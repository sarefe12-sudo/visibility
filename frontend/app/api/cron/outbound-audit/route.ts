import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 280 // stay under Vercel's 300s budget

const RAILWAY_URL = 'https://zealous-perception-production-2d31.up.railway.app'
// Each audit runs 2 live model calls (~90s). Keep this low enough that a
// batch always finishes comfortably inside the function's time budget.
const BATCH_SIZE = 3

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MODEL_NAMES: Record<string, string> = {
  claude: 'Claude', gpt4o: 'GPT-4o', gemini: 'Gemini',
  perplexity: 'Perplexity', grok: 'Grok', deepseek: 'DeepSeek',
}

interface PendingLead { id: string; brand: string | null; company: string | null; market: string | null }

async function auditOne(lead: PendingLead) {
  const brand = lead.brand || lead.company
  if (!brand) {
    await supabase.from('outbound_leads').update({ status: 'failed', error: 'No brand/company name' }).eq('id', lead.id)
    return
  }
  const market = lead.market ?? 'global'

  try {
    const promptRes = await fetch(`${RAILWAY_URL}/generate-prompts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, market }),
    })
    if (!promptRes.ok) {
      const err = await promptRes.text().catch(() => '')
      await supabase.from('outbound_leads').update({ status: 'failed', error: `Prompts ${promptRes.status}: ${err.slice(0, 130)}` }).eq('id', lead.id)
      return
    }
    const promptData = await promptRes.json()
    const prompts: string[] = (promptData.prompts ?? []).map((p: { prompt: string }) => p.prompt).filter(Boolean)
    if (prompts.length === 0) {
      await supabase.from('outbound_leads').update({ status: 'failed', error: 'No prompts generated' }).eq('id', lead.id)
      return
    }

    let competitors: { name: string }[] = []
    try {
      const compRes = await fetch(`${RAILWAY_URL}/suggest-competitors`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, market }),
      })
      if (compRes.ok) {
        const compData = await compRes.json()
        competitors = (compData.competitors ?? []).slice(0, 3).map((name: string) => ({ name }))
      }
    } catch { /* competitors are optional */ }

    const res = await fetch(`${RAILWAY_URL}/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, competitors, prompts, tier: 'free' }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => '')
      await supabase.from('outbound_leads').update({ status: 'failed', error: `Analyze ${res.status}: ${err.slice(0, 130)}` }).eq('id', lead.id)
      return
    }

    const result = await res.json()
    const rawScores: Record<string, number> = result.model_scores ?? {}
    const modelScores: Record<string, number> = {}
    for (const [k, v] of Object.entries(rawScores)) modelScores[MODEL_NAMES[k] ?? k] = v as number

    let worstModel: string | null = null
    let worstScore: number | null = null
    for (const [model, score] of Object.entries(modelScores)) {
      if (worstScore === null || (score as number) < worstScore) { worstScore = score as number; worstModel = model }
    }

    const compScoresRaw: Record<string, { overall: number }> = result.competitor_scores ?? {}
    const competitorScores = Object.entries(compScoresRaw)
      .map(([name, v]) => ({ name, score: v?.overall ?? 0 }))
      .sort((a, b) => b.score - a.score)

    await supabase.from('outbound_leads').update({
      status: 'audited',
      overall_score: result.overall_score ?? null,
      model_scores: modelScores,
      worst_model: worstModel,
      worst_score: worstScore,
      top_recommendation: (result.insights ?? [])[0] ?? null,
      competitor_scores: competitorScores,
      sample_query: prompts[0] ?? null,
      error: null,
    }).eq('id', lead.id)
  } catch (e) {
    await supabase.from('outbound_leads').update({ status: 'failed', error: String(e).slice(0, 150) }).eq('id', lead.id)
  }
}

// GET /api/cron/outbound-audit?cron=1 — Vercel Cron, every 2 hours.
// Works through the pending-lead backlog a few at a time so a fresh batch of
// audited (ready-to-email) leads is always available for the daily send job.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('cron') !== '1') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: pending } = await supabase
    .from('outbound_leads')
    .select('id, brand, company, market')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  for (const lead of (pending ?? []) as PendingLead[]) {
    await auditOne(lead)
  }

  return NextResponse.json({ ok: true, audited: pending?.length ?? 0 })
}
