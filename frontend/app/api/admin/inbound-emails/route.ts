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

export async function GET(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const inbox = searchParams.get('inbox') // 'info' | 'privacy' | null (all)

  let query = supabase
    .from('inbound_emails')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(200)

  if (inbox) query = query.eq('inbox', inbox)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ emails: data ?? [] })
}

// POST — reply to an inbound email
export async function POST(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { to, subject, message, inbox } = await req.json()
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const from = inbox === 'privacy'
    ? 'VisibilityRadar Privacy <privacy@visibilityradar.ai>'
    : 'VisibilityRadar <info@visibilityradar.ai>'

  const html = `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;">
    <p style="color:#1e293b;font-size:15px;line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="color:#94a3b8;font-size:12px;">VisibilityRadar · <a href="https://visibilityradar.ai" style="color:#6366f1;">visibilityradar.ai</a></p>
  </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })

  if (!res.ok) return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
