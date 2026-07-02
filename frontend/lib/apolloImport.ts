export interface LeadInput {
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

export function normalizeLeads(raw: LeadInput[]): LeadInput[] {
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

export interface ApolloFilters {
  titles?: string[]
  industries?: string[]
  employeeRanges?: string[]
  locations?: string[]
  perPage?: number
  page?: number
}

// Fetch people from Apollo.io
export async function fetchFromApollo(filters: ApolloFilters): Promise<{ leads: LeadInput[]; error?: string }> {
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

// The two highest-willingness-to-pay ICP segments for VisibilityRadar:
// marketing/SEO agencies (Agency plan, white-label, resell multiplier) and
// funded B2B SaaS companies (Pro plan, sophisticated buyers, fast self-serve
// approval). English-speaking, high-SaaS-spend markets only.
export const ICP_SEGMENTS: Record<'agency' | 'saas', ApolloFilters> = {
  agency: {
    titles: ['Founder', 'CEO', 'Agency Owner', 'Managing Director', 'Co-Founder'],
    industries: ['marketing agency', 'seo agency', 'digital marketing', 'advertising agency'],
    employeeRanges: ['2,50'],
    locations: ['United States', 'United Kingdom', 'Canada', 'Australia'],
  },
  saas: {
    titles: ['CMO', 'VP Marketing', 'Head of Growth', 'Head of Marketing', 'Director of Marketing'],
    industries: ['software', 'saas', 'b2b software', 'computer software'],
    employeeRanges: ['11,200'],
    locations: ['United States', 'United Kingdom', 'Canada', 'Australia'],
  },
}
