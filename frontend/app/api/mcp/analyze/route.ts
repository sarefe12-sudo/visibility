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

  // Fetch user's custom prompts (Pro/Agency feature)
  const { data: customPrompts } = await supabase
    .from('custom_prompts')
    .select('text')
    .eq('user_id', user.id)
    .limit(5)

  // Call Railway backend
  const backendRes = await fetch(`${RAILWAY_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand,
      market,
      competitors,
      tier: user.tier,
      custom_prompts: customPrompts?.map(p => p.text) ?? [],
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
      competitor_count: competitors.length,
      prompt_count: result.prompts_used ?? 5,
      result_snapshot: result,
      source: 'mcp',
    })
    .select('id')
    .single()

  await supabase.rpc('increment_analyses_count', { user_id_input: user.id })

  // Return clean summary for MCP (not raw HTML/full result)
  const modelScores = Object.entries(result.model_scores ?? {}).map(([model, score]) => ({
    model,
    score,
  }))

  const topRecommendations = (result.recommendations ?? []).slice(0, 3).map((r: { action: string; priority: string }) => ({
    action: r.action,
    priority: r.priority,
  }))

  return NextResponse.json({
    brand,
    market,
    overall_score: result.overall_score,
    label: result.overall_score >= 70 ? 'Strong' : result.overall_score >= 40 ? 'Moderate' : 'Low',
    model_scores: modelScores,
    sentiment: result.sentiment ?? null,
    top_recommendations: topRecommendations,
    competitors: result.competitor_scores ?? [],
    dashboard_url: `https://visibilityradar.ai/dashboard`,
    analysis_id: analysis?.id ?? null,
  })
}
