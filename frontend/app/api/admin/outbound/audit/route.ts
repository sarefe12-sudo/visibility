import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'sarefe12@gmail.com'
const RAILWAY_URL = 'https://zealous-perception-production-2d31.up.railway.app'

export const maxDuration = 300 // 5 minutes — one audit fans out across 6 models (~4 min)

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

// Backend model keys → display names used in the pitch email
const MODEL_NAMES: Record<string, string> = {
  claude: 'Claude',
  gpt4o: 'GPT-4o',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  grok: 'Grok',
  deepseek: 'DeepSeek',
}

async function auditOne(lead: Lead) {
  const brand = lead.brand || lead.company
  if (!brand) {
    await supabase.from('outbound_leads').update({ status: 'failed', error: 'No brand/company name' }).eq('id', lead.id)
    return
  }

  const market = lead.market ?? 'global'

  try {
    // Step 1 — generate brand-specific test prompts (backend requires `prompts`)
    const promptRes = await fetch(`${RAILWAY_URL}/generate-prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    // Step 2 — run the analysis across all 6 models (tier agency → richest pitch)
    const res = await fetch(`${RAILWAY_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, competitors: [], prompts, tier: 'agency' }),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      await supabase.from('outbound_leads').update({ status: 'failed', error: `Analyze ${res.status}: ${err.slice(0, 130)}` }).eq('id', lead.id)
      return
    }

    const result = await res.json()
    const rawScores: Record<string, number> = result.model_scores ?? {}
    // Map to display names for storage/email
    const modelScores: Record<string, number> = {}
    for (const [k, v] of Object.entries(rawScores)) modelScores[MODEL_NAMES[k] ?? k] = v as number

    // Find the worst-performing model — the hook for the pitch
    let worstModel: string | null = null
    let worstScore: number | null = null
    for (const [model, score] of Object.entries(modelScores)) {
      if (worstScore === null || (score as number) < worstScore) {
        worstScore = score as number
        worstModel = model
      }
    }

    const topRec: string | null = (result.insights ?? [])[0] ?? null

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

  // One audit fans out across 6 models (~4 min), so process a single lead per
  // request to stay within the 300s function budget. The UI loops automatically
  // ("X left, run again") until the selection is drained.
  const MAX_PER_RUN = 1
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
