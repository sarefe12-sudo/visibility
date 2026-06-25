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

// GET /api/admin/users — list all users
export async function GET(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') ?? ''
  const tier = searchParams.get('tier') ?? ''

  let query = supabase
    .from('users')
    .select('id, clerk_id, email, name, tier, user_type, analyses_count, created_at, is_held, admin_note, last_login_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (search) query = query.ilike('email', `%${search}%`)
  if (tier) query = query.eq('tier', tier)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
}

// PATCH /api/admin/users — hold/unhold, tier change, note
export async function PATCH(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, updates } = await req.json()
  const allowed = ['is_held', 'tier', 'admin_note']
  const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))

  const { data, error } = await supabase
    .from('users')
    .update(safe)
    .eq('id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // audit log — fire and forget, ignore errors if table doesn't exist yet
  void supabase.from('audit_logs').insert({
    actor_email: ADMIN_EMAIL,
    action: `admin_update_user`,
    target_id: userId,
    details: safe,
  })

  return NextResponse.json({ user: data })
}
