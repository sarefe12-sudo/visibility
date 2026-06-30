import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'sarefe12@gmail.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (email !== ADMIN_EMAIL) return null
  return userId
}

interface LeadInput {
  email: string
  name?: string
  title?: string
  company?: string
  brand?: string
  domain?: string
  industry?: string
  market?: string
}

// Derive a clean brand name from company / domain
function deriveBrand(company?: string, domain?: string): string | undefined {
  if (company && company.trim()) return company.trim()
  if (domain) {
    const host = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    const root = host.split('.')[0]
    if (root) return root.charAt(0).toUpperCase() + root.slice(1)
  }
  return undefined
}

function normalizeLeads(raw: LeadInput[]): LeadInput[] {
  return raw
    .filter(l => l.email && /\S+@\S+\.\S+/.test(l.email) && !l.email.includes('email_not_unlocked'))
    .map(l => ({
      email: l.email.trim().toLowerCase(),
      name: l.name?.trim() || undefined,
      title: l.title?.trim() || undefined,
      company: l.company?.trim() || undefined,
      brand: (l.brand?.trim() || deriveBrand(l.company, l.domain)) || undefined,
      domain: l.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || undefined,
      industry: l.industry?.trim() || undefined,
      market: l.market?.trim() || 'global',
    }))
}

// Fetch people from Apollo.io
async function fetchFromApollo(filters: {
  titles?: string[]
  industries?: string[]
  employeeRanges?: string[]
  locations?: string[]
  perPage?: number
  page?: number
}): Promise<{ leads: LeadInput[]; error?: string }> {
  const apiKey = process.env.APOLLO_API_KEY
  if (!apiKey) return { leads: [], error: 'APOLLO_API_KEY not set' }

  const body: Record<string, unknown> = {
    page: filters.page ?? 1,
    per_page: Math.min(filters.perPage ?? 25, 100),
  }
  if (filters.titles?.length) body.person_titles = filters.titles
  if (filters.industries?.length) body.q_organization_keyword_tags = filters.industries
  if (filters.employeeRanges?.length) body.organization_num_employees_ranges = filters.employeeRanges
  if (filters.locations?.length) body.person_locations = filters.locations

  const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    return { leads: [], error: `Apollo error ${res.status}: ${err.slice(0, 200)}` }
  }

  const data = await res.json()
  const people = data.people ?? []
  const leads: LeadInput[] = people.map((p: Record<string, unknown>) => {
    const org = (p.organization ?? {}) as Record<string, unknown>
    return {
      email: (p.email as string) ?? '',
      name: [p.first_name, p.last_name].filter(Boolean).join(' '),
      title: p.title as string,
      company: org.name as string,
      domain: (org.primary_domain ?? org.website_url) as string,
      industry: org.industry as string,
      market: 'global',
    }
  })

  return { leads }
}

// POST /api/admin/outbound/import
// body: { mode: 'apollo' | 'manual', leads?: LeadInput[], filters?: {...} }
export async function POST(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const mode = body.mode as 'apollo' | 'manual'

  let rawLeads: LeadInput[] = []

  if (mode === 'apollo') {
    const { leads, error } = await fetchFromApollo(body.filters ?? {})
    if (error) return NextResponse.json({ error }, { status: 400 })
    rawLeads = leads
  } else if (mode === 'manual') {
    rawLeads = Array.isArray(body.leads) ? body.leads : []
  } else {
    return NextResponse.json({ error: 'mode must be apollo or manual' }, { status: 400 })
  }

  const leads = normalizeLeads(rawLeads)
  if (leads.length === 0) {
    return NextResponse.json({ error: 'No valid leads with unlocked emails found' }, { status: 400 })
  }

  // Upsert by email (ignore duplicates)
  const rows = leads.map(l => ({ ...l, source: mode, status: 'pending' }))
  const { data, error } = await supabase
    .from('outbound_leads')
    .upsert(rows, { onConflict: 'email', ignoreDuplicates: true })
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, imported: data?.length ?? 0, found: leads.length })
}
