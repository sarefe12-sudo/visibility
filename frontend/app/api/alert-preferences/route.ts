import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/alert-preferences
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id, email').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: prefs } = await supabase
    .from('alert_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ prefs: prefs ?? null, userEmail: user.email })
}

// POST /api/alert-preferences — upsert
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id, tier').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (user.tier === 'free') {
    return NextResponse.json({ error: 'Weekly alerts require Pro or Agency plan' }, { status: 403 })
  }

  const body = await req.json()
  const { enabled, email } = body as { enabled: boolean; email: string }

  const { data, error } = await supabase
    .from('alert_preferences')
    .upsert(
      { user_id: user.id, email, enabled, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prefs: data })
}
