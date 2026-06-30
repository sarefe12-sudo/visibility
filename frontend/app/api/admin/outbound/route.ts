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

// GET /api/admin/outbound — list leads + funnel stats
export async function GET() {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('outbound_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const leads = data ?? []
  const funnel = {
    total: leads.length,
    pending: leads.filter(l => l.status === 'pending').length,
    audited: leads.filter(l => l.status === 'audited').length,
    emailed: leads.filter(l => ['emailed', 'opened', 'clicked', 'signed_up', 'converted'].includes(l.status)).length,
    opened: leads.filter(l => ['opened', 'clicked', 'signed_up', 'converted'].includes(l.status)).length,
    clicked: leads.filter(l => ['clicked', 'signed_up', 'converted'].includes(l.status)).length,
    signed_up: leads.filter(l => ['signed_up', 'converted'].includes(l.status)).length,
    converted: leads.filter(l => l.status === 'converted').length,
    failed: leads.filter(l => l.status === 'failed').length,
  }

  return NextResponse.json({ leads, funnel })
}

// DELETE /api/admin/outbound — delete selected leads
export async function DELETE(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }

  const { error } = await supabase.from('outbound_leads').delete().in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, deleted: ids.length })
}
