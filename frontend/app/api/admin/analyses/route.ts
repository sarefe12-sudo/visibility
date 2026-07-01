import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'sarefe12@gmail.com'

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

// GET /api/admin/analyses — list all analyses across all users, most recent first
export async function GET() {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('analyses')
    .select('id, brand, market, overall_score, active_models, competitor_count, prompt_count, source, created_at, user_id, users(email, tier)')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ analyses: data ?? [] })
}

// PATCH /api/admin/analyses — edit brand/market on a single analysis
export async function PATCH(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, brand, market } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const update: Record<string, string> = {}
  if (typeof brand === 'string' && brand.trim()) update.brand = brand.trim()
  if (typeof market === 'string' && market.trim()) update.market = market.trim()
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { data, error } = await supabase.from('analyses').update(update).eq('id', id).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

// DELETE /api/admin/analyses — body: { ids: string[] }
// Safe to delete manually:
// - content_plans.analysis_id has ON DELETE SET NULL (blog posts survive, just lose the link)
// - quota checks (/api/analyses HEAD/POST) use a live COUNT(*) on this table, so deleting
//   automatically frees up the user's free-tier / monthly slot — nothing else to reconcile there
// - the only denormalized counter is users.analyses_count (shown as "X analyses used" in the UI),
//   which we decrement here per user so it doesn't drift after a manual delete
export async function DELETE(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'ids required' }, { status: 400 })

  // Tally how many rows belong to each user so we can decrement their counter correctly.
  const { data: rows, error: fetchError } = await supabase
    .from('analyses')
    .select('id, user_id')
    .in('id', ids)
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  const countByUser = new Map<string, number>()
  for (const r of rows ?? []) countByUser.set(r.user_id, (countByUser.get(r.user_id) ?? 0) + 1)

  const { error: deleteError } = await supabase.from('analyses').delete().in('id', ids)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  // Best-effort counter reconciliation — never let this block the delete itself.
  for (const [userId, n] of countByUser) {
    const { data: u } = await supabase.from('users').select('analyses_count').eq('id', userId).single()
    if (u) {
      const next = Math.max(0, (u.analyses_count ?? 0) - n)
      await supabase.from('users').update({ analyses_count: next }).eq('id', userId)
    }
  }

  return NextResponse.json({ ok: true, deleted: rows?.length ?? 0 })
}
