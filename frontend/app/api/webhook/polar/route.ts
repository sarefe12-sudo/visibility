import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRODUCT_TO_TIER: Record<string, string> = {
  [process.env.POLAR_PRO_PRODUCT_ID ?? '']: 'pro',
  [process.env.POLAR_AGENCY_PRODUCT_ID ?? '']: 'agency',
}

export async function POST(req: Request) {
  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  let event: ReturnType<typeof validateEvent>
  try {
    event = validateEvent(payload, headers, process.env.POLAR_WEBHOOK_SECRET ?? '')
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
    console.error('[polar webhook] validation error:', e)
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  console.log('[polar webhook]', event.type)

  // subscription.created / .updated / .active — data: Subscription
  // { id, customerId, productId, status, customer: { id, externalId, ... } }
  if (event.type === 'subscription.created' || event.type === 'subscription.updated' || event.type === 'subscription.active') {
    const sub = event.data
    const clerkId = sub.customer?.externalId

    if (!clerkId) {
      console.error('[polar webhook] subscription event missing customer.externalId', { type: event.type, subscriptionId: sub.id })
      return NextResponse.json({ error: 'missing customer.externalId' }, { status: 400 })
    }

    const tier = PRODUCT_TO_TIER[sub.productId] ?? 'pro'

    const { data: updatedUser, error: updateError } = await supabase.from('users').update({
      tier,
      payment_provider: 'polar',
      polar_customer_id: sub.customerId,
      polar_subscription_id: sub.id,
    }).eq('clerk_id', clerkId).select('id').single()

    if (updateError) {
      console.error('[polar webhook] failed to upgrade user', { clerkId, tier, updateError })
      return NextResponse.json({ error: 'db update failed' }, { status: 500 })
    }

    await supabase.from('billing_events').insert({
      user_id: updatedUser?.id ?? null,
      event_type: event.type,
      amount_cents: 0, // amount is on the order, not the subscription — captured via order.paid below
      lemon_subscription_id: sub.id, // shared column, provider-agnostic in practice
    })

    await supabase.from('audit_logs').insert({
      actor_email: clerkId,
      action: event.type,
      target_id: updatedUser?.id ?? null,
      details: { tier, subscriptionId: sub.id, provider: 'polar' },
    })
  }

  // subscription.canceled / .revoked — data: Subscription
  if (event.type === 'subscription.canceled' || event.type === 'subscription.revoked') {
    const sub = event.data

    const { data: downgradedUser } = await supabase.from('users')
      .update({ tier: 'free', polar_subscription_id: null })
      .eq('polar_subscription_id', sub.id)
      .select('id')
      .single()

    await supabase.from('billing_events').insert({
      user_id: downgradedUser?.id ?? null,
      event_type: event.type,
      amount_cents: 0,
      lemon_subscription_id: sub.id,
    })

    await supabase.from('audit_logs').insert({
      actor_email: 'system',
      action: event.type,
      target_id: downgradedUser?.id ?? null,
      details: { subscriptionId: sub.id, provider: 'polar' },
    })
  }

  // order.paid — data: Order { id, totalAmount, subscriptionId, customer: {...} }
  if (event.type === 'order.paid') {
    const order = event.data
    if (order.subscriptionId) {
      const { data: u } = await supabase.from('users').select('id').eq('polar_subscription_id', order.subscriptionId).single()
      await supabase.from('billing_events').insert({
        user_id: u?.id ?? null,
        event_type: event.type,
        amount_cents: order.totalAmount,
        lemon_subscription_id: order.subscriptionId,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
