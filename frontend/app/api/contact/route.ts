import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { name, email, company, message, source } = await req.json()

    if (!email || !message) {
      return NextResponse.json({ error: 'email and message required' }, { status: 400 })
    }

    const { error } = await supabase.from('contacts').insert({
      name: name?.trim() || null,
      email: email.trim(),
      company: company?.trim() || null,
      message: message.trim(),
      source: source || 'contact_page',
    })

    if (error) console.error('[contact] insert error:', error.message)

    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'VisibilityRadar <noreply@visibilityradar.ai>',
          to: ['sarefe12@gmail.com'],
          subject: `New contact: ${name || email}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px">
              <h2 style="color:#0f172a;margin-bottom:4px">New Contact Form Submission</h2>
              <p style="color:#6366f1;font-size:12px;margin-top:0">VisibilityRadar</p>
              <table style="width:100%;border-collapse:collapse;margin-top:16px">
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:12px;width:100px">Name</td><td style="padding:8px 0;font-size:13px;color:#1e293b">${name || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:12px">Email</td><td style="padding:8px 0;font-size:13px;color:#1e293b"><a href="mailto:${email}" style="color:#6366f1">${email}</a></td></tr>
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:12px">Company</td><td style="padding:8px 0;font-size:13px;color:#1e293b">${company || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#94a3b8;font-size:12px;vertical-align:top">Message</td><td style="padding:8px 0;font-size:13px;color:#1e293b;white-space:pre-wrap">${message}</td></tr>
              </table>
            </div>
          `,
        }),
      }).catch(err => console.error('[contact] email error:', err))
    } else {
      console.log('[contact] RESEND_API_KEY not set, skipping email')
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
