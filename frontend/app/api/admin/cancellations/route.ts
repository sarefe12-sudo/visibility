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

  const { data: rows } = await supabase
    .from('cancellations')
    .select('*')
    .order('cancelled_at', { ascending: false })
    .limit(200)

  // Aggregate reason counts
  const reasonMap: Record<string, number> = {}
  for (const r of rows ?? []) {
    reasonMap[r.reason] = (reasonMap[r.reason] ?? 0) + 1
  }

  return NextResponse.json({
    cancellations: rows ?? [],
    reasonCounts: reasonMap,
    total: rows?.length ?? 0,
  })
}
