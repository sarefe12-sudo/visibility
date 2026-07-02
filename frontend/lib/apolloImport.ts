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

interface ApolloPerson {
  id: string
  first_name?: string
  last_name?: string
  title?: string
  has_email?: boolean
  organization?: { name?: string; primary_domain?: string; website_url?: string; industry?: string }
}

// Step 1 — search (Apollo's current search endpoint no longer returns email
// addresses; it only returns matching people + org info. As of the API's
// 2026 revision the old /mixed_people/search endpoint is deprecated in favor
// of this one).
async function searchApollo(apiKey: string, filters: ApolloFilters): Promise<{ people: ApolloPerson[]; error?: string }> {
  const body: Record<string, unknown> = {
    page: filters.page ?? 1,
    per_page: Math.min(filters.perPage ?? 25, 100),
  }
  if (filters.titles?.length) body.person_titles = filters.titles
  if (filters.industries?.length) body.q_organization_keyword_tags = filters.industries
  if (filters.employeeRanges?.length) body.organization_num_employees_ranges = filters.employeeRanges
  if (filters.locations?.length) body.person_locations = filters.locations

  const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    return { people: [], error: `Apollo search ${res.status}: ${err.slice(0, 200)}` }
  }
  const data = await res.json()
  return { people: data.people ?? [] }
}

// Step 2 — reveal the email for one person. Apollo's search results no
// longer include emails at all, so each candidate needs its own enrichment
// call (each successful reveal consumes an Apollo credit).
async function enrichPerson(apiKey: string, person: ApolloPerson): Promise<LeadInput | null> {
  const org = person.organization ?? {}
  const res = await fetch('https://api.apollo.io/api/v1/people/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify({
      first_name: person.first_name,
      last_name: person.last_name,
      organization_name: org.name,
      domain: org.primary_domain ?? org.website_url,
      reveal_personal_emails: true,
    }),
  })
  if (!res.ok) return null

  const data = await res.json()
  // Defensive extraction — Apollo's documented response wraps the result in
  // a "person" key; fall back to the raw object if that shape changes again.
  const p = (data.person ?? data) as Record<string, unknown>
  const email = p.email as string | undefined
  if (!email) return null

  const enrichedOrg = (p.organization ?? org) as Record<string, unknown>
  return {
    email,
    name: [p.first_name ?? person.first_name, p.last_name ?? person.last_name].filter(Boolean).join(' '),
    title: (p.title as string) ?? person.title,
    company: (enrichedOrg.name as string) ?? org.name,
    domain: ((enrichedOrg.primary_domain ?? enrichedOrg.website_url) as string) ?? org.primary_domain ?? org.website_url,
    industry: (enrichedOrg.industry as string) ?? org.industry,
    market: 'global',
  }
}

// Fetch + enrich people from Apollo.io (search, then reveal each email).
export async function fetchFromApollo(filters: ApolloFilters): Promise<{ leads: LeadInput[]; error?: string }> {
  const apiKey = process.env.APOLLO_API_KEY
  if (!apiKey) return { leads: [], error: 'APOLLO_API_KEY not set' }

  const { people, error } = await searchApollo(apiKey, filters)
  if (error) return { leads: [], error }
  if (people.length === 0) return { leads: [] }

  // Apollo's search response already flags whether a person has a
  // revealable email (has_email) — skip enrich calls (and the credit they
  // cost) for people it's already told us have none.
  const candidates = people.filter(p => p.has_email !== false)

  const leads: LeadInput[] = []
  for (const person of candidates) {
    const lead = await enrichPerson(apiKey, person)
    if (lead) leads.push(lead)
  }

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
