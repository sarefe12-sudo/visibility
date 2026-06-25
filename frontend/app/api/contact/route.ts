import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
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

  if (error) {
    console.error('[contact] insert error:', error.message)
    // Continue even if DB insert fails — still send email notification
  }

  // Notify admin
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'sarefe12@gmail.com',
    subject: `New contact form submission from ${name || email}`,
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
  }).catch(err => console.error('[contact] email error:', err))

  return NextResponse.json({ ok: true })
}
