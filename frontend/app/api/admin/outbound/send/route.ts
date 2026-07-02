import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderOutboundTemplate, buildOutboundHtml, type OutboundLead } from '@/lib/outboundEmail'

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

type Lead = OutboundLead

// POST /api/admin/outbound/send
// body: { ids: string[], subject: string, body: string }
export async function POST(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids, subject, body, testEmail } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'ids required' }, { status: 400 })
  if (!subject || !body) return NextResponse.json({ error: 'subject and body required' }, { status: 400 })

  // Test mode: route every email to a single inbox without touching lead status.
  const testTo = typeof testEmail === 'string' && /\S+@\S+\.\S+/.test(testEmail) ? testEmail.trim() : null

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const { data: leads, error } = await supabase
    .from('outbound_leads')
    .select('id, email, name, brand, company, overall_score, worst_model, worst_score, top_recommendation, competitor_scores, sample_query')
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  const errors: string[] = []

  // Personalized → one email per lead. Cap per run to respect function timeout.
  const MAX_PER_RUN = 40
  const batch = (leads ?? []).slice(0, MAX_PER_RUN)

  for (const lead of batch as Lead[]) {
    const renderedSubject = renderOutboundTemplate(subject, lead)
    const renderedBody = renderOutboundTemplate(body, lead)
    const html = buildOutboundHtml(renderedBody, lead.id)

    const recipient = testTo ?? lead.email
    const finalSubject = testTo ? `[TEST→${lead.email}] ${renderedSubject}` : renderedSubject

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'VisibilityRadar <info@visibilityradar.ai>',
        to: [recipient],
        subject: finalSubject,
        html,
      }),
    })

    if (res.ok) {
      sent++
      const okData = await res.json().catch(() => ({}))
      const resultNote = `${testTo ? 'TEST' : 'sent'} → ${recipient} · Resend id ${okData?.id ?? 'ok'} · ${new Date().toISOString()}`
      // Record the send outcome on the row (visible even in test mode).
      // In test mode, don't advance the real lead through the funnel.
      if (!testTo) {
        await supabase.from('outbound_leads').update({
          status: 'emailed',
          email_subject: renderedSubject,
          email_sent_at: new Date().toISOString(),
          error: null,
          last_send_result: resultNote,
        }).eq('id', lead.id)
      } else {
        await supabase.from('outbound_leads').update({ last_send_result: resultNote }).eq('id', lead.id)
      }
    } else {
      const err = await res.json().catch(() => ({}))
      const errNote = `FAILED → ${recipient} · ${JSON.stringify(err).slice(0, 160)}`
      errors.push(`${recipient}: ${JSON.stringify(err).slice(0, 120)}`)
      if (!testTo) {
        await supabase.from('outbound_leads').update({ status: 'failed', error: JSON.stringify(err).slice(0, 150), last_send_result: errNote }).eq('id', lead.id)
      } else {
        await supabase.from('outbound_leads').update({ last_send_result: errNote }).eq('id', lead.id)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed: errors.length,
    remaining: (leads?.length ?? 0) - batch.length,
    errors: errors.slice(0, 10),
  })
}
