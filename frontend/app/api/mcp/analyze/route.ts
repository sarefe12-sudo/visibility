import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TIER_LIMITS } from '@/lib/supabase'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RAILWAY_URL = 'https://zealous-perception-production-2d31.up.railway.app'

const DAILY_LIMITS = { pro: 5, agency: 20 }

async function getUserFromKey(apiKey: string) {
  const { data: keyRow } = await supabase
    .from('api_keys')
    .select('user_id, id')
    .eq('key_hash', apiKey)
    .single()

  if (!keyRow) return null

  const { data: user } = await supabase
    .from('users')
    .select('id, tier, email')
    .eq('id', keyRow.user_id)
    .single()

  // Update last_used_at
  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id)

  return user
}

async function checkLimits(userId: string, tier: string): Promise<{ allowed: boolean; reason?: string }> {
  const tierLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]

  // Monthly cap (same logic as /api/analyses)
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const { count: monthlyCount } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString())

  if ((monthlyCount ?? 0) >= tierLimits.analyses) {
    return { allowed: false, reason: `Monthly limit of ${tierLimits.analyses} analyses reached. Upgrade your plan at visibilityradar.ai/pricing` }
  }

  // Daily rate limit per tier
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  const { count: dailyCount } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', dayStart.toISOString())

  const dailyLimit = DAILY_LIMITS[tier as keyof typeof DAILY_LIMITS] ?? 5
  if ((dailyCount ?? 0) >= dailyLimit) {
    return { allowed: false, reason: `Daily limit of ${dailyLimit} analyses reached. Try again tomorrow.` }
  }

  return { allowed: true }
}

// POST /api/mcp/analyze — called by MCP server
export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })

  const user = await getUserFromKey(apiKey)
  if (!user) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  if (user.tier === 'free') {
    return NextResponse.json({ error: 'MCP access requires Pro or Agency plan. Upgrade at visibilityradar.ai/pricing' }, { status: 403 })
  }

  const { allowed, reason } = await checkLimits(user.id, user.tier)
  if (!allowed) return NextResponse.json({ error: reason }, { status: 429 })

  const { brand, market = 'global', competitors = [] } = await req.json()

  if (!brand) return NextResponse.json({ error: 'brand is required' }, { status: 400 })

  // Normalize competitors to the object shape the backend expects: [{ name }]
  const competitorObjects = (Array.isArray(competitors) ? competitors : [])
    .map((c: unknown) => (typeof c === 'string' ? { name: c } : c))
    .filter((c): c is { name: string } => !!c && typeof (c as { name?: string }).name === 'string')

  // Determine prompts: use the user's custom prompts, otherwise have the
  // backend generate brand-specific ones. The backend REQUIRES a prompts array.
  const { data: customPrompts } = await supabase
    .from('custom_prompts')
    .select('text')
    .eq('user_id', user.id)
    .limit(5)

  let prompts: string[] = (customPrompts ?? []).map(p => p.text).filter(Boolean)
  if (prompts.length === 0) {
    const promptRes = await fetch(`${RAILWAY_URL}/generate-prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, market }),
    })
    if (!promptRes.ok) {
      const err = await promptRes.text().catch(() => '')
      return NextResponse.json({ error: `Prompt generation failed: ${err}` }, { status: 500 })
    }
    const promptData = await promptRes.json()
    prompts = (promptData.prompts ?? []).map((p: { prompt: string }) => p.prompt).filter(Boolean)
  }

  if (prompts.length === 0) {
    return NextResponse.json({ error: 'Could not generate analysis prompts' }, { status: 500 })
  }

  // Call Railway backend
  const backendRes = await fetch(`${RAILWAY_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand,
      competitors: competitorObjects,
      prompts,
      tier: user.tier,
    }),
  })

  if (!backendRes.ok) {
    const err = await backendRes.text().catch(() => '')
    return NextResponse.json({ error: `Analysis failed: ${err}` }, { status: 500 })
  }

  const result = await backendRes.json()

  // Save to Supabase (same as dashboard flow — shows up in dashboard)
  const { data: analysis } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      brand,
      market,
      overall_score: result.overall_score,
      active_models: result.active_models,
      competitor_count: competitorObjects.length,
      prompt_count: prompts.length,
      result_snapshot: result,
      source: 'mcp',
    })
    .select('id')
    .single()

  await supabase.rpc('increment_analyses_count', { user_id_input: user.id })

  // Backend model keys → display names
  const MODEL_NAMES: Record<string, string> = {
    claude: 'Claude', gpt4o: 'GPT-4o', gemini: 'Gemini',
    perplexity: 'Perplexity', grok: 'Grok', deepseek: 'DeepSeek',
  }

  // Return clean summary for MCP (not raw HTML/full result)
  const modelScores = Object.entries(result.model_scores ?? {}).map(([model, score]) => ({
    model: MODEL_NAMES[model] ?? model,
    score,
  }))

  // Backend returns insights: string[] → shape as {action, priority} for the
  // published MCP client and the documented API response.
  const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']
  const topRecommendations = (result.insights ?? []).slice(0, 3).map((action: string, i: number) => ({
    action,
    priority: PRIORITIES[i] ?? 'LOW',
  }))

  // competitor_scores: Record<name, { overall, per_model }> → flat list
  const competitorScores = Object.entries(result.competitor_scores ?? {}).map(([name, v]) => ({
    brand: name,
    score: (v as { overall?: number })?.overall ?? 0,
  }))

  return NextResponse.json({
    brand,
    market,
    overall_score: result.overall_score,
    label: result.overall_score >= 70 ? 'Strong' : result.overall_score >= 40 ? 'Moderate' : 'Low',
    model_scores: modelScores,
    sentiment: result.sentiment_summary ?? null,
    top_recommendations: topRecommendations,
    competitors: competitorScores,
    dashboard_url: `https://visibilityradar.ai/dashboard`,
    analysis_id: analysis?.id ?? null,
  })
}
