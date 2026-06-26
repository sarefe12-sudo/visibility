import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Resend inbound webhook payload
    const from = body.from ?? body.sender ?? ''
    const to = body.to ?? body.recipient ?? ''
    const subject = body.subject ?? '(no subject)'
    const text = body.text ?? ''
    const html = body.html ?? ''
    const date = body.created_at ?? new Date().toISOString()

    // Determine which inbox this was sent to
    const toAddress = Array.isArray(to) ? to[0] : to
    const inbox = toAddress.includes('privacy@') ? 'privacy' : 'info'

    const { error } = await supabase.from('inbound_emails').insert({
      from_email: from,
      to_email: toAddress,
      inbox,
      subject,
      body_text: text,
      body_html: html,
      received_at: date,
    })

    if (error) console.error('[inbound-email] insert error:', error.message)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[inbound-email] error:', e)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
