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

export async function GET() {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: events } = await supabase
    .from('billing_events')
    .select('*, users(email, tier)')
    .order('created_at', { ascending: false })
    .limit(50)

  // MRR calculation
  const { data: paidUsers } = await supabase
    .from('users')
    .select('tier')
    .in('tier', ['pro', 'agency'])

  const pro = paidUsers?.filter(u => u.tier === 'pro').length ?? 0
  const agency = paidUsers?.filter(u => u.tier === 'agency').length ?? 0
  const mrr = pro * 49 + agency * 199

  return NextResponse.json({ events: events ?? [], mrr, pro, agency })
}
