import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TIER_LIMITS } from '@/lib/supabase'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — monthly usage count + whether a specific analysis already has content
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id, tier').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ count: 0, limit: 0, analysis_done: false })

  const { searchParams } = new URL(req.url)
  const analysisId = searchParams.get('analysis_id')

  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const [{ count }, analysisDone] = await Promise.all([
    supabase.from('content_plans').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', monthStart.toISOString()),
    analysisId
      ? supabase.from('content_plans').select('id', { count: 'exact', head: true }).eq('analysis_id', analysisId).then(r => (r.count ?? 0) > 0)
      : Promise.resolve(false),
  ])

  const tier = user.tier as keyof typeof TIER_LIMITS
  const limit = TIER_LIMITS[tier]?.content_generations ?? 0

  return NextResponse.json({ count: count ?? 0, limit, analysis_done: analysisDone })
}

// POST — generate 5 content pieces for a brand analysis
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  const { data: user } = await supabase.from('users').select('id, tier').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const tier = user.tier as keyof typeof TIER_LIMITS
  const limit = TIER_LIMITS[tier]?.content_generations ?? 0
  if (limit === 0) return NextResponse.json({ error: 'upgrade_required' }, { status: 403 })

  // Monthly cap check
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const { count } = await supabase.from('content_plans').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).gte('created_at', monthStart.toISOString())
  if ((count ?? 0) >= limit) return NextResponse.json({ error: 'monthly_limit_reached' }, { status: 403 })

  const body = await req.json()
  const { analysis_id, brand, market, overall_score, model_scores, competitor_scores, playbook } = body

  // Check if already generated for this analysis
  const { count: existingCount } = await supabase.from('content_plans')
    .select('id', { count: 'exact', head: true }).eq('analysis_id', analysis_id)
  if ((existingCount ?? 0) > 0) return NextResponse.json({ error: 'already_generated' }, { status: 409 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })

  // Build context from analysis data
  const weakModels = Object.entries(model_scores as Record<string, number>)
    .sort(([,a],[,b]) => a - b).slice(0, 3).map(([m, s]) => `${m} (score: ${s})`).join(', ')

  const competitors = Object.keys(competitor_scores ?? {}).slice(0, 3).join(', ')

  const prevRecs = (playbook?.priority_actions ?? []).slice(0, 5).map((r: {title: string}) => r.title).join('; ')

  const prompt = `You are a content strategist specializing in AI brand visibility and SEO. Generate exactly 5 blog post content pieces for the brand "${brand}" to improve their AI model visibility.

BRAND ANALYSIS DATA:
- Brand: ${brand}
- Market: ${market}
- Overall AI Visibility Score: ${overall_score}/100
- Weakest AI models: ${weakModels || 'none identified'}
- Competitors tracked: ${competitors || 'none'}
- Current strategic priorities: ${prevRecs || 'general visibility improvement'}

INSTRUCTIONS:
Generate 5 distinct blog posts that will:
1. Directly improve visibility in the weakest AI models
2. Address competitor gaps
3. Build topical authority around the brand's niche
4. Be genuinely useful (not just SEO fluff)

For each post return a JSON object with these exact fields:
- title: compelling blog post title (max 70 chars)
- slug: URL-friendly slug
- meta_description: SEO meta description (max 155 chars)
- target_model: which AI model this most helps (one of: claude, gpt4o, gemini, perplexity, grok, deepseek, or "all")
- why: one sentence explaining why this content improves AI visibility
- priority: "high" | "medium" | "low"
- keywords: array of 5 target keywords
- read_time: estimated read time in minutes (integer)
- content: full blog post in markdown format with proper H2/H3 headings, 400-600 words, natural keyword integration, ends with a clear CTA

Return ONLY a raw JSON array of exactly 5 objects. No explanation, no markdown code fences, no wrapper text. Start your response with [ and end with ].`

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!aiRes.ok) {
    const err = await aiRes.json().catch(() => ({}))
    console.error('[content-gen] Claude error:', aiRes.status, JSON.stringify(err))
    const detail = err?.error?.message ?? err?.message ?? `HTTP ${aiRes.status}`
    return NextResponse.json({ error: `AI generation failed: ${detail}` }, { status: 500 })
  }

  const aiData = await aiRes.json()
  const rawText = aiData.content?.[0]?.text ?? ''

  let posts: unknown[]
  try {
    // Strip markdown code fences if present
    const stripped = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const jsonMatch = stripped.match(/\[[\s\S]*\]/)
    posts = JSON.parse(jsonMatch ? jsonMatch[0] : stripped)
    if (!Array.isArray(posts) || posts.length === 0) throw new Error('Invalid output')
  } catch {
    console.error('[content-gen] Parse error, raw:', rawText.slice(0, 800))
    return NextResponse.json({ error: 'Failed to parse AI output' }, { status: 500 })
  }

  // Save to Supabase
  const { data: plan, error } = await supabase.from('content_plans').insert({
    user_id: user.id,
    analysis_id: analysis_id ?? null,
    brand,
    market,
    posts,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ plan, remaining: limit - (count ?? 0) - 1 })
}
