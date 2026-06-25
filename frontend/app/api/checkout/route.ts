import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { variantId } = await req.json()
  if (!variantId) return NextResponse.json({ error: 'Missing variantId' }, { status: 400 })

  const { data: user } = await supabase.from('users').select('*').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const storeId = process.env.LEMONSQUEEZY_STORE_ID!
  const apiKey = process.env.LEMONSQUEEZY_API_KEY!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://visibilityradar.ai'

  const body = JSON.stringify({
    data: {
      type: 'checkouts',
      attributes: {
        product_options: {
          redirect_url: `${appUrl}/dashboard?upgraded=true`,
        },
        checkout_data: {
          email: user.email,
          custom: { clerk_id: userId },
        },
      },
      relationships: {
        store:   { data: { type: 'stores',   id: String(storeId) } },
        variant: { data: { type: 'variants', id: String(variantId) } },
      },
    },
  })

  const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
    },
    body,
  })

  const data = await res.json()
  const url = data?.data?.attributes?.url

  if (!url) {
    console.error('[LemonSqueezy] checkout error:', JSON.stringify(data))
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }

  return NextResponse.json({ url })
}
