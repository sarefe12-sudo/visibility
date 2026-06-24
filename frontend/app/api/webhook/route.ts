import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VARIANT_TO_TIER: Record<string, string> = {
  [process.env.LEMONSQUEEZY_PRO_VARIANT_ID!]:    'pro',
  [process.env.LEMONSQUEEZY_AGENCY_VARIANT_ID!]: 'agency',
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))
}

export async function POST(req: Request) {
  const payload = await req.text()
  const signature = req.headers.get('x-signature') ?? ''

  if (!verifySignature(payload, signature, process.env.LEMONSQUEEZY_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(payload)
  const eventName: string = event.meta?.event_name ?? ''
  const customData = event.meta?.custom_data ?? {}
  const clerkId: string = customData.clerk_id ?? ''
  const attrs = event.data?.attributes ?? {}

  // Subscription created or updated → upgrade tier
  if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
    const variantId = String(attrs.variant_id ?? '')
    const tier = VARIANT_TO_TIER[variantId] ?? 'pro'
    const customerId = String(attrs.customer_id ?? '')
    const subscriptionId = String(event.data?.id ?? '')

    if (clerkId) {
      await supabase.from('users').update({
        tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      }).eq('clerk_id', clerkId)
    }
  }

  // Subscription cancelled / expired → downgrade to free
  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    const subscriptionId = String(event.data?.id ?? '')
    await supabase.from('users')
      .update({ tier: 'free', stripe_subscription_id: null })
      .eq('stripe_subscription_id', subscriptionId)
  }

  return NextResponse.json({ ok: true })
}
