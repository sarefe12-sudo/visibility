import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchFromApollo, normalizeLeads, type LeadInput } from '@/lib/apolloImport'

export const maxDuration = 280 // each result now needs a separate email-reveal call

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
