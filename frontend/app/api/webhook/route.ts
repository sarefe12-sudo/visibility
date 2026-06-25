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
    const amountCents = Math.round((attrs.first_subscription_item?.price ?? 0) * 100)

    if (!clerkId) {
      console.error('[webhook] subscription event missing clerk_id', { eventName, subscriptionId })
      return NextResponse.json({ error: 'missing clerk_id in custom_data' }, { status: 400 })
    }

    const { data: updatedUser, error: updateError } = await supabase.from('users').update({
      tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      lemon_subscription_id: subscriptionId,
    }).eq('clerk_id', clerkId).select('id').single()

    if (updateError) {
      console.error('[webhook] failed to upgrade user', { clerkId, tier, updateError })
      return NextResponse.json({ error: 'db update failed' }, { status: 500 })
    }

    // log billing event
    await supabase.from('billing_events').insert({
      user_id: updatedUser?.id ?? null,
      event_type: eventName,
      amount_cents: amountCents,
      lemon_subscription_id: subscriptionId,
    })

    // audit log
    await supabase.from('audit_logs').insert({
      actor_email: attrs.user_email ?? clerkId,
      action: eventName,
      target_id: updatedUser?.id ?? null,
      details: { tier, subscriptionId },
    })
  }

  // Subscription cancelled / expired → downgrade to free
  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    const subscriptionId = String(event.data?.id ?? '')

    const { data: downgradedUser } = await supabase.from('users')
      .update({ tier: 'free', stripe_subscription_id: null })
      .eq('stripe_subscription_id', subscriptionId)
      .select('id')
      .single()

    // log billing event
    await supabase.from('billing_events').insert({
      user_id: downgradedUser?.id ?? null,
      event_type: eventName,
      amount_cents: 0,
      lemon_subscription_id: subscriptionId,
    })

    await supabase.from('audit_logs').insert({
      actor_email: 'system',
      action: eventName,
      target_id: downgradedUser?.id ?? null,
      details: { subscriptionId },
    })
  }

  // Payment success
  if (eventName === 'subscription_payment_success') {
    const subscriptionId = String(event.data?.id ?? '')
    const amountCents = Math.round((attrs.total ?? 0))
    const { data: u } = await supabase.from('users')
      .select('id').eq('stripe_subscription_id', subscriptionId).single()
    await supabase.from('billing_events').insert({
      user_id: u?.id ?? null,
      event_type: eventName,
      amount_cents: amountCents,
      lemon_subscription_id: subscriptionId,
    })
  }

  return NextResponse.json({ ok: true })
}
