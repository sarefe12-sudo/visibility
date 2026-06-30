import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TIER_LIMITS } from '@/lib/supabase'

export const maxDuration = 120

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type AssetType = 'faq' | 'schema' | 'press_release' | 'linkedin'

const VALID_TYPES: AssetType[] = ['faq', 'schema', 'press_release', 'linkedin']

const TYPE_LABEL: Record<AssetType, string> = {
  faq: 'FAQ Content',
  schema: 'Schema Markup',
  press_release: 'Press Release',
  linkedin: 'LinkedIn Post',
}

// GET — return already-generated assets for an analysis (so the panel can rehydrate)
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id, tier').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ assets: [] })

  const { searchParams } = new URL(req.url)
  const analysisId = searchParams.get('analysis_id')

  let query = supabase
    .from('growth_assets')
    .select('id, type, title, content, created_at, analysis_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  query = analysisId ? query.eq('analysis_id', analysisId) : query.is('analysis_id', null)

  const { data } = await query
  return NextResponse.json({ assets: data ?? [] })
}

function buildPrompt(type: AssetType, ctx: {
  brand: string; market: string; score: number; weakModels: string; competitors: string; query: string
}): string {
  const base = `Brand: ${ctx.brand}
Market: ${ctx.market}
Current AI visibility score: ${ctx.score}/100
Weakest AI models: ${ctx.weakModels || 'n/a'}
Main competitors: ${ctx.competitors || 'n/a'}
A real query buyers ask AI in this space: "${ctx.query}"

Goal: make ${ctx.brand} more likely to be recommended by AI models (ChatGPT, Claude, Gemini, Perplexity) for queries like the one above.`

  switch (type) {
    case 'faq':
      return `You are a GEO (Generative Engine Optimization) specialist. ${base}

Write 8 high-intent FAQ question-and-answer pairs that mirror the exact questions real buyers ask AI assistants about this category. Each answer should be factual, concise (2-4 sentences), naturally mention ${ctx.brand} where genuinely relevant, and be the kind of clear, citable content AI models prefer to quote.

Return clean Markdown: each item as "### Question" followed by the answer paragraph. No preamble, no closing notes.`

    case 'schema':
      return `You are a technical SEO specialist. ${base}

Generate valid schema.org JSON-LD structured data for ${ctx.brand} that helps AI models and search engines clearly understand the brand. Include an Organization entity and a FAQPage entity with 4-5 relevant Q&A items for this category.

Return ONLY the markup wrapped in a single <script type="application/ld+json"> ... </script> block, ready to paste into the site <head>. Use realistic placeholder values where exact data is unknown (e.g. "https://example.com"). No explanation before or after.`

    case 'press_release':
      return `You are a PR copywriter. ${base}

Write a professional press release draft (~350-450 words) that would earn coverage on publications AI models trust and cite. Use standard format: a strong headline, an optional subheadline, a dateline (CITY, Month Day, Year), 3-4 body paragraphs with a quote from a ${ctx.brand} spokesperson, a short boilerplate "About ${ctx.brand}", and a media-contact placeholder.

Return clean Markdown. No preamble, no notes.`

    case 'linkedin':
      return `You are a B2B social copywriter. ${base}

Write one engaging LinkedIn post (~140-200 words) from the ${ctx.brand} team about being discoverable in AI answers. Strong first-line hook, genuine value/insight, a soft CTA, and 3-4 relevant hashtags at the end. Conversational, not salesy.

Return only the post text. No preamble.`
  }
}

// POST — generate one growth asset
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id, tier').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const tier = user.tier as keyof typeof TIER_LIMITS
  // Growth Kit is a Pro/Agency feature — reuse the recommendations capability flag
  if (!TIER_LIMITS[tier]?.recommendations) {
    return NextResponse.json({ error: 'upgrade_required' }, { status: 403 })
  }

  const body = await req.json()
  const { type, analysis_id, brand, market = 'global', overall_score = 0, model_scores, competitor_scores, sample_query } = body

  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 })
  if (!brand) return NextResponse.json({ error: 'brand is required' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })

  const weakModels = Object.entries((model_scores ?? {}) as Record<string, number>)
    .sort(([, a], [, b]) => a - b).slice(0, 3).map(([m, s]) => `${m} (${s})`).join(', ')
  const competitors = Object.keys(competitor_scores ?? {}).slice(0, 3).join(', ')
  const query = sample_query || `the best ${brand} alternative`

  const prompt = buildPrompt(type as AssetType, {
    brand, market, score: overall_score,
    weakModels, competitors, query,
  })

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!aiRes.ok) {
    const err = await aiRes.json().catch(() => ({}))
    const detail = err?.error?.message ?? `HTTP ${aiRes.status}`
    return NextResponse.json({ error: `AI generation failed: ${detail}` }, { status: 500 })
  }

  const aiData = await aiRes.json()
  const content = (aiData.content?.[0]?.text ?? '').trim()
  if (!content) return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })

  const title = `${TYPE_LABEL[type as AssetType]} — ${brand}`

  // Replace any prior asset of the same type for this analysis (regenerate)
  if (analysis_id) {
    await supabase.from('growth_assets').delete().eq('user_id', user.id).eq('analysis_id', analysis_id).eq('type', type)
  }

  const { data: asset, error } = await supabase.from('growth_assets').insert({
    user_id: user.id,
    analysis_id: analysis_id ?? null,
    brand,
    type,
    title,
    content,
  }).select('id, type, title, content, created_at').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ asset })
}
