import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserFromKey(apiKey: string) {
  const { data: keyRow } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', apiKey)
    .single()
  if (!keyRow) return null
  const { data: user } = await supabase.from('users').select('id, tier').eq('id', keyRow.user_id).single()
  return user
}

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })

  const user = await getUserFromKey(apiKey)
  if (!user) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')

  let query = supabase
    .from('analyses')
    .select('id, brand, market, overall_score, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (brand) query = query.ilike('brand', brand)

  const { data: analyses } = await query
  return NextResponse.json({ analyses: analyses ?? [] })
}
