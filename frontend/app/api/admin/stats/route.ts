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

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const last30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const last7 = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    { count: totalUsers },
    { data: tierCounts },
    { count: totalAnalyses },
    { count: monthlyAnalyses },
    { data: dailyAnalyses },
    { data: recentUsers },
    contacts30dResult,
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('tier'),
    supabase.from('analyses').select('id', { count: 'exact', head: true }),
    supabase.from('analyses').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('analyses').select('created_at').gte('created_at', last30).order('created_at', { ascending: true }),
    supabase.from('users').select('id, email, name, tier, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
  ])

  // active users: use analyses as proxy (users who analyzed in last 30d)
  const { count: activeUsers } = await supabase
    .from('analyses')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', last30)

  const contacts = contacts30dResult.count

  // tier breakdown
  const tiers = { free: 0, pro: 0, agency: 0 }
  for (const row of (tierCounts ?? [])) {
    const t = row.tier as keyof typeof tiers
    if (t in tiers) tiers[t]++
  }

  // daily analyses chart — group by date
  const dailyMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    dailyMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const row of (dailyAnalyses ?? [])) {
    const d = row.created_at.slice(0, 10)
    if (d in dailyMap) dailyMap[d]++
  }
  const dailyChart = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

  return NextResponse.json({
    users: { total: totalUsers ?? 0, active: activeUsers ?? 0, ...tiers },
    analyses: { total: totalAnalyses ?? 0, thisMonth: monthlyAnalyses ?? 0 },
    contacts: contacts ?? 0,
    dailyChart,
    recentUsers: recentUsers ?? [],
  })
}
