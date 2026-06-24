import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TIER_LIMITS } from '@/lib/supabase'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/analyses — list user's analyses + monthly usage
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id, tier').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ analyses: [], monthly_count: 0 })

  const limit = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS]
  const cutoff = limit.history_days > 0
    ? new Date(Date.now() - limit.history_days * 86400000).toISOString()
    : null

  // Current month start
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  let query = supabase
    .from('analyses')
    .select('id, brand, market, overall_score, active_models, competitor_count, prompt_count, result_snapshot, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (cutoff) query = query.gte('created_at', cutoff)

  const [{ data: analyses, error }, { count: monthly_count }] = await Promise.all([
    query,
    supabase.from('analyses').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ analyses, monthly_count: monthly_count ?? 0 })
}

// POST /api/analyses — save new analysis (also enforces free limit)
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('*').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const tierLimits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS]

  // Enforce limits — free uses total count, paid plans use monthly count
  if (user.tier === 'free') {
    if (user.analyses_count >= tierLimits.analyses) {
      return NextResponse.json({ error: 'free_limit_reached' }, { status: 403 })
    }
  } else {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('analyses').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', monthStart.toISOString())
    if ((count ?? 0) >= tierLimits.analyses) {
      return NextResponse.json({ error: 'monthly_limit_reached' }, { status: 403 })
    }
  }

  const body = await req.json()
  const { brand, market, overall_score, active_models, competitor_count, prompt_count, result_snapshot } = body

  const { data: analysis, error } = await supabase
    .from('analyses')
    .insert({ user_id: user.id, brand, market, overall_score, active_models, competitor_count, prompt_count, result_snapshot })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment analyses_count
  await supabase.from('users').update({ analyses_count: user.analyses_count + 1 }).eq('id', user.id)

  return NextResponse.json({ analysis })
}
