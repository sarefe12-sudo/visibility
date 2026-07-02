import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { testConnection, type Platform } from '@/lib/publishers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser(clerkId: string) {
  const { data } = await supabase.from('users').select('id, tier').eq('clerk_id', clerkId).single()
  return data
}

// GET — list the current user's platform connections (credentials never returned)
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ connections: [] })

  const { data } = await supabase
    .from('platform_connections')
    .select('id, platform, label, site_url, status, last_error, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ connections: data ?? [] })
}

// POST — add + test a new connection
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (user.tier === 'free') {
    return NextResponse.json({ error: 'Publishing integrations require a Pro or Agency plan.' }, { status: 403 })
  }

  const body = await req.json()
  const { platform, siteUrl, label, credentials } = body as {
    platform: Platform; siteUrl: string; label?: string; credentials: Record<string, string>
  }

  if (!platform || !siteUrl || !credentials) {
    return NextResponse.json({ error: 'platform, siteUrl and credentials are required' }, { status: 400 })
  }
  if (!['wordpress', 'ghost', 'webhook'].includes(platform)) {
    return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
  }

  const result = await testConnection(platform, siteUrl, credentials)
  if (!result.ok) return NextResponse.json({ error: result.error ?? 'Connection test failed' }, { status: 400 })

  const { data, error } = await supabase
    .from('platform_connections')
    .insert({
      user_id: user.id,
      platform,
      label: label || null,
      site_url: siteUrl,
      credentials,
      status: 'connected',
    })
    .select('id, platform, label, site_url, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ connection: data })
}

// DELETE — body: { id }
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('platform_connections').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
