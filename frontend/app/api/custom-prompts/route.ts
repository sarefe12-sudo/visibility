import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_CUSTOM_PROMPTS: Record<string, number> = {
  free: 0,
  pro: 10,
  agency: 50,
}

// GET /api/custom-prompts
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ prompts: [] })

  const { data: prompts } = await supabase
    .from('custom_prompts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ prompts: prompts ?? [] })
}

// POST /api/custom-prompts — add prompt
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id, tier').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const max = MAX_CUSTOM_PROMPTS[user.tier] ?? 0
  if (max === 0) {
    return NextResponse.json({ error: 'Custom prompts require Pro or Agency plan' }, { status: 403 })
  }

  // Check count
  const { count } = await supabase
    .from('custom_prompts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= max) {
    return NextResponse.json({ error: `Limit reached (${max} custom prompts on ${user.tier} plan)` }, { status: 429 })
  }

  const body = await req.json()
  const text = (body.text as string)?.trim()
  if (!text || text.length < 5) return NextResponse.json({ error: 'Prompt too short' }, { status: 400 })
  if (text.length > 300) return NextResponse.json({ error: 'Prompt too long (max 300 chars)' }, { status: 400 })

  const { data, error } = await supabase
    .from('custom_prompts')
    .insert({ user_id: user.id, text, category: body.category ?? 'custom' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompt: data })
}

// DELETE /api/custom-prompts?id=...
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('custom_prompts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
