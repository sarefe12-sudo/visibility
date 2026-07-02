import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { polar } from '@/lib/polar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/polar/checkout — body: { productId }
// Mirrors /api/checkout (LemonSqueezy) so the pricing page can switch
// providers by swapping which endpoint it calls.
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

  const { data: user } = await supabase.from('users').select('*').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://visibilityradar.ai'

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      externalCustomerId: userId, // Clerk ID — read back in the webhook to identify the user
      customerEmail: user.email,
      successUrl: `${appUrl}/dashboard?upgraded=true`,
    })

    return NextResponse.json({ url: checkout.url })
  } catch (e) {
    console.error('[Polar] checkout error:', e)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
