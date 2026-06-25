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

  // Per-user cost this month
  const { data: rawUsage } = await supabase
    .from('token_usage')
    .select('user_id, model, prompt_tokens, completion_tokens, cost_usd')
    .gte('created_at', monthStart)

  // Per-model totals
  const modelTotals: Record<string, { prompt: number; completion: number; cost: number }> = {}
  const userCosts: Record<string, number> = {}
  let totalCost = 0

  for (const row of rawUsage ?? []) {
    if (!modelTotals[row.model]) modelTotals[row.model] = { prompt: 0, completion: 0, cost: 0 }
    modelTotals[row.model].prompt += row.prompt_tokens
    modelTotals[row.model].completion += row.completion_tokens
    modelTotals[row.model].cost += row.cost_usd
    userCosts[row.user_id] = (userCosts[row.user_id] ?? 0) + row.cost_usd
    totalCost += row.cost_usd
  }

  // Fetch user emails for top spenders
  const topUserIds = Object.entries(userCosts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id)

  const { data: users } = await supabase
    .from('users')
    .select('id, email, tier')
    .in('id', topUserIds.length ? topUserIds : ['00000000-0000-0000-0000-000000000000'])

  const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u]))

  const topUsers = Object.entries(userCosts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id, cost]) => ({
      ...userMap[id],
      cost_usd: cost,
    }))

  return NextResponse.json({
    totalCost,
    modelTotals,
    topUsers,
  })
}
