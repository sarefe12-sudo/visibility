import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason, customNote } = await req.json()
  if (!reason) return NextResponse.json({ error: 'Reason required' }, { status: 400 })

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? ''

  const { data: user } = await supabase
    .from('users')
    .select('id, tier, email, lemon_subscription_id')
    .eq('clerk_id', userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.tier === 'free') return NextResponse.json({ error: 'No active subscription' }, { status: 400 })

  // Cancel on LemonSqueezy if we have a subscription ID
  if (user.lemon_subscription_id) {
    try {
      const res = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${user.lemon_subscription_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
            'Accept': 'application/vnd.api+json',
          },
        }
      )
      if (!res.ok) {
        const err = await res.json()
        console.error('[LemonSqueezy] cancel error:', JSON.stringify(err))
        // Don't block — still log locally
      }
    } catch (e) {
      console.error('[LemonSqueezy] cancel fetch failed:', e)
    }
  }

  // Log cancellation reason
  await supabase.from('cancellations').insert({
    user_id: user.id,
    email: user.email ?? email,
    tier: user.tier,
    reason,
    custom_note: customNote ?? null,
    lemon_subscription_id: user.lemon_subscription_id ?? null,
  })

  // Downgrade user to free
  await supabase.from('users').update({ tier: 'free' }).eq('id', user.id)

  // Audit log
  supabase.from('audit_logs').insert({
    admin_email: email,
    action: 'self_cancel',
    target_user_email: user.email ?? email,
    details: `Reason: ${reason}${customNote ? ` — ${customNote}` : ''}`,
  }).then(() => {}).catch(() => {})

  return NextResponse.json({ ok: true })
}
