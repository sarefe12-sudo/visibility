const RAILWAY_URL = 'https://zealous-perception-production-2d31.up.railway.app'

export interface ReanalyzeResult {
  overall_score: number
  model_scores: Record<string, number>
  competitor_scores: Record<string, { overall: number; per_model: Record<string, number> }>
  active_models: string[]
  insights: string[]
  sentiment_summary: { positive: number; neutral: number; negative: number }
}

// Re-runs a full brand analysis against the live AI models — used by scheduled
// digests so the report reflects the brand's *current* visibility, not a stale
// snapshot. Mirrors the flow the analyze page runs manually (generate-prompts -> analyze).
export async function reanalyzeBrand(params: {
  brand: string
  market: string
  competitors: string[]
  tier: string
}): Promise<ReanalyzeResult | null> {
  const { brand, market, competitors, tier } = params

  try {
    const promptRes = await fetch(`${RAILWAY_URL}/generate-prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, market }),
    })
    if (!promptRes.ok) return null
    const promptData = await promptRes.json()
    const prompts: string[] = (promptData.prompts ?? []).map((p: { prompt: string }) => p.prompt).filter(Boolean)
    if (prompts.length === 0) return null

    const analyzeRes = await fetch(`${RAILWAY_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand,
        market,
        prompts,
        tier,
        competitors: competitors.map(name => ({ name })),
      }),
    })
    if (!analyzeRes.ok) return null

    return await analyzeRes.json()
  } catch {
    return null
  }
}
