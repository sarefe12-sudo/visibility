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

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Always return all analyses — we never delete history regardless of tier.
  // Monthly new-analysis quota is still enforced separately.
  const query = supabase
    .from('analyses')
    .select('id, brand, market, overall_score, active_models, competitor_count, prompt_count, result_snapshot, playbook, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  const [{ data: analyses, error }, { count: monthly_count }] = await Promise.all([
    query,
    supabase.from('analyses').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ analyses, monthly_count: monthly_count ?? 0 })
}

// POST /api/analyses — save new analysis (also enforces limits)
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('*').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const tierLimits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS]

  if (user.tier === 'free') {
    // Free: lifetime cap — use DB count to avoid race conditions
    const { count } = await supabase
      .from('analyses').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= tierLimits.analyses) {
      return NextResponse.json({ error: 'free_limit_reached' }, { status: 403 })
    }
  } else {
    // Pro/Agency: monthly cap
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

  // Atomic increment — avoids race condition from read-then-write
  await supabase.rpc('increment_analyses_count', { user_id_input: user.id })

  return NextResponse.json({ analysis })
}

// PATCH /api/analyses — save generated playbook to an existing analysis
export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { analysis_id, playbook } = await req.json()
  if (!analysis_id || !playbook) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Verify ownership before updating
  const { error } = await supabase
    .from('analyses')
    .update({ playbook })
    .eq('id', analysis_id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// HEAD /api/analyses — pre-flight limit check before calling backend
// Returns 403 if user is at limit, 200 if they can proceed
export async function HEAD() {
  const { userId } = await auth()
  if (!userId) return new NextResponse(null, { status: 401 })

  const { data: user } = await supabase.from('users').select('id, tier').eq('clerk_id', userId).single()
  if (!user) return new NextResponse(null, { status: 404 })

  const tierLimits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS]

  if (user.tier === 'free') {
    const { count } = await supabase
      .from('analyses').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= tierLimits.analyses) return new NextResponse(null, { status: 403 })
  } else {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('analyses').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', monthStart.toISOString())
    if ((count ?? 0) >= tierLimits.analyses) return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, { status: 200 })
}
