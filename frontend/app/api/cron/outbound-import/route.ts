import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchFromApollo, normalizeLeads, ICP_SEGMENTS } from '@/lib/apolloImport'

export const maxDuration = 60

// Daily import volume, split across the two ICP segments. Sized to comfortably
// feed the 20/day send cap (accounting for audit/content-check attrition)
// while staying well inside Apollo Basic's ~33 credits/day average budget.
const PER_SEGMENT = 15

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/cron/outbound-import?cron=1 — Vercel Cron, once daily, ahead of
// the hourly audit/send cycle so there's always a fresh backlog to work
// through. Pulls from both ICP segments (agencies + B2B SaaS) every run,
// paging forward each time so it never re-fetches the same people.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('cron') !== '1') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Spends real Apollo credits — require CRON_SECRET explicitly rather than
  // falling open when it's unset.
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, { imported: number; found: number; error?: string }> = {}

  for (const segment of ['agency', 'saas'] as const) {
    const { data: state } = await supabase
      .from('outbound_import_state')
      .select('next_page')
      .eq('segment', segment)
      .single()
    const page = state?.next_page ?? 1

    const { leads: rawLeads, error } = await fetchFromApollo({
      ...ICP_SEGMENTS[segment],
      perPage: PER_SEGMENT,
      page,
    })

    if (error) {
      results[segment] = { imported: 0, found: 0, error }
      continue
    }

    const leads = normalizeLeads(rawLeads)
    let imported = 0
    if (leads.length > 0) {
      const rows = leads.map(l => ({ ...l, source: `apollo_auto_${segment}`, status: 'pending' }))
      const { data } = await supabase
        .from('outbound_leads')
        .upsert(rows, { onConflict: 'email', ignoreDuplicates: true })
        .select('id')
      imported = data?.length ?? 0
    }

    // Advance to the next page for tomorrow's run regardless of how many
    // were net-new (already-seen contacts still consumed this page).
    await supabase
      .from('outbound_import_state')
      .update({ next_page: page + 1, updated_at: new Date().toISOString() })
      .eq('segment', segment)

    results[segment] = { imported, found: leads.length }
  }

  return NextResponse.json({ ok: true, results })
}
