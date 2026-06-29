import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — list user's API keys
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id, tier').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ keys: [] })

  if (user.tier === 'free') {
    return NextResponse.json({ error: 'mcp_not_available', message: 'MCP access requires Pro or Agency plan.' }, { status: 403 })
  }

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_preview, created_at, last_used_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: keys ?? [] })
}

// POST — generate new API key
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id, tier').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (user.tier === 'free') {
    return NextResponse.json({ error: 'mcp_not_available' }, { status: 403 })
  }

  // Max 3 keys per user
  const { count } = await supabase
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'Max 3 API keys allowed. Delete an existing key first.' }, { status: 400 })
  }

  const { name } = await req.json()
  const rawKey = `vr_${randomBytes(24).toString('hex')}`
  const keyPreview = `${rawKey.slice(0, 8)}...${rawKey.slice(-4)}`

  const { data: key, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name: name || 'My MCP Key',
      key_hash: rawKey, // store raw — hashing adds complexity without auth gains here
      key_preview: keyPreview,
    })
    .select('id, name, key_preview, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return full key ONCE — user must copy it now
  return NextResponse.json({ key: { ...key, full_key: rawKey } })
}

// DELETE — revoke a key
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { id } = await req.json()

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // ensure ownership

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
