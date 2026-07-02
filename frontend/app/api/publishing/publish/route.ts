import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publishContent, type Platform } from '@/lib/publishers'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/publishing/publish — body: { connectionId, title, markdown }
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { connectionId, title, markdown } = await req.json()
  if (!connectionId || !title || !markdown) {
    return NextResponse.json({ error: 'connectionId, title and markdown are required' }, { status: 400 })
  }

  const { data: conn } = await supabase
    .from('platform_connections')
    .select('id, platform, site_url, credentials')
    .eq('id', connectionId)
    .eq('user_id', user.id)
    .single()

  if (!conn) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })

  const result = await publishContent({
    platform: conn.platform as Platform,
    siteUrl: conn.site_url,
    credentials: conn.credentials,
    title,
    markdown,
    publishStatus: 'draft', // always publish as a draft — the customer reviews before going live
  })

  await supabase
    .from('platform_connections')
    .update({
      last_used_at: new Date().toISOString(),
      status: result.ok ? 'connected' : 'error',
      last_error: result.ok ? null : (result.error ?? 'Unknown error'),
    })
    .eq('id', conn.id)

  if (!result.ok) return NextResponse.json({ error: result.error ?? 'Publish failed' }, { status: 502 })
  return NextResponse.json({ ok: true, url: result.url ?? null })
}
