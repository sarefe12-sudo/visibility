import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'sarefe12@gmail.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (email !== ADMIN_EMAIL) return null
  return userId
}

// GET /api/admin/leads
export async function GET() {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data ?? [] })
}

// POST /api/admin/leads — send email to one or many leads
export async function POST(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { to, subject, message } = await req.json()
  // `to` can be a single email string or an array
  const recipients: string[] = Array.isArray(to) ? to : [to]

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const html = `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;">
    <p style="color:#1e293b;font-size:15px;line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="color:#94a3b8;font-size:12px;">VisibilityRadar · <a href="https://visibilityradar.ai" style="color:#6366f1;">visibilityradar.ai</a></p>
  </div>`

  // Resend supports up to 50 recipients per call — batch if needed
  const BATCH = 50
  const errors: string[] = []

  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'VisibilityRadar <info@visibilityradar.ai>',
        to: batch,
        subject,
        html,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      errors.push(JSON.stringify(err))
    }
  }

  if (errors.length) return NextResponse.json({ error: errors.join('; ') }, { status: 500 })
  return NextResponse.json({ ok: true, sent: recipients.length })
}
