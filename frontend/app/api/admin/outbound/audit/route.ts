import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'sarefe12@gmail.com'
const RAILWAY_URL = 'https://zealous-perception-production-2d31.up.railway.app'

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

interface Lead {
  id: string
  brand: string | null
  company: string | null
  market: string | null
}

async function auditOne(lead: Lead) {
  const brand = lead.brand || lead.company
  if (!brand) {
    await supabase.from('outbound_leads').update({ status: 'failed', error: 'No brand/company name' }).eq('id', lead.id)
    return
  }

  try {
    const res = await fetch(`${RAILWAY_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // tier agency → run all 6 models for the richest pitch
      body: JSON.stringify({ brand, market: lead.market ?? 'global', competitors: [], tier: 'agency', custom_prompts: [] }),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      await supabase.from('outbound_leads').update({ status: 'failed', error: `Analyze ${res.status}: ${err.slice(0, 150)}` }).eq('id', lead.id)
      return
    }

    const result = await res.json()
    const modelScores: Record<string, number> = result.model_scores ?? {}

    // Find the worst-performing model — the hook for the pitch
    let worstModel: string | null = null
    let worstScore: number | null = null
    for (const [model, score] of Object.entries(modelScores)) {
      if (worstScore === null || (score as number) < worstScore) {
        worstScore = score as number
        worstModel = model
      }
    }

    const topRec = (result.recommendations ?? [])[0]?.action ?? null

    await supabase.from('outbound_leads').update({
      status: 'audited',
      overall_score: result.overall_score ?? null,
      model_scores: modelScores,
      worst_model: worstModel,
      worst_score: worstScore,
      top_recommendation: topRec,
      error: null,
    }).eq('id', lead.id)
  } catch (e) {
    await supabase.from('outbound_leads').update({ status: 'failed', error: String(e).slice(0, 150) }).eq('id', lead.id)
  }
}

// POST /api/admin/outbound/audit — body: { ids: string[] }
// Runs the brand analysis for each selected lead so emails can be personalized.
export async function POST(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }

  const { data: leads, error } = await supabase
    .from('outbound_leads')
    .select('id, brand, company, market')
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audits hit AI models — run sequentially to avoid backend rate limits.
  // Cap per request so the serverless function stays within its time budget.
  const MAX_PER_RUN = 15
  const batch = (leads ?? []).slice(0, MAX_PER_RUN)
  for (const lead of batch) {
    await auditOne(lead as Lead)
  }

  return NextResponse.json({
    ok: true,
    audited: batch.length,
    remaining: (leads?.length ?? 0) - batch.length,
  })
}
