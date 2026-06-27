import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TIER_LIMITS } from '@/lib/supabase'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BACKEND = 'https://zealous-perception-production-2d31.up.railway.app'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('tier').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const tier = user.tier as keyof typeof TIER_LIMITS
  if (!TIER_LIMITS[tier]?.recommendations) {
    return NextResponse.json({ error: 'upgrade_required' }, { status: 403 })
  }

  const body = await req.json()
  const { url, brand } = body
  if (!url || !brand) return NextResponse.json({ error: 'Missing url or brand' }, { status: 400 })

  // Validate URL is related to the brand
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase()
    const brandWords = (brand as string).toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length > 2)
    const isRelated = brandWords.some((w: string) => domain.includes(w))
    if (!isRelated) {
      return NextResponse.json({ error: `This site does not appear to be related to the brand "${brand}". Only websites belonging to ${brand} can be analyzed.` }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  try {
    const res = await fetch(`${BACKEND}/analyze-site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, brand }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.detail ?? 'Analysis failed' }, { status: res.status })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: `Network error: ${(e as Error).message}` }, { status: 500 })
  }
}
