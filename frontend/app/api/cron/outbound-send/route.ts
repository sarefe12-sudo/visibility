import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderOutboundTemplate, buildOutboundHtml, DEFAULT_SUBJECT, DEFAULT_BODY, type OutboundLead } from '@/lib/outboundEmail'

export const maxDuration = 280

// Deliverability ramp-up: keep this low on a fresh sending domain and raise
// it gradually as bounce/complaint rates stay healthy. 20/day = ~140/week.
const DAILY_SEND_LIMIT = 20

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/cron/outbound-send?cron=1 — Vercel Cron, once daily.
// Sends the AI Growth Copilot pitch to the next batch of already-audited
// leads (built up throughout the day by /api/cron/outbound-audit) and marks
// them 'emailed' so they're never picked twice.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('cron') !== '1') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const { data: leads, error } = await supabase
    .from('outbound_leads')
    .select('id, email, name, brand, company, overall_score, worst_model, worst_score, top_recommendation, competitor_scores, sample_query')
    .eq('status', 'audited')
    .order('created_at', { ascending: true })
    .limit(DAILY_SEND_LIMIT)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!leads || leads.length === 0) return NextResponse.json({ ok: true, sent: 0, message: 'No audited leads ready to send' })

  let sent = 0
  const errors: string[] = []

  for (const lead of leads as OutboundLead[]) {
    const renderedSubject = renderOutboundTemplate(DEFAULT_SUBJECT, lead)
    const renderedBody = renderOutboundTemplate(DEFAULT_BODY, lead)
    const html = buildOutboundHtml(renderedBody, lead.id)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'VisibilityRadar <info@visibilityradar.ai>',
        to: [lead.email],
        subject: renderedSubject,
        html,
      }),
    })

    if (res.ok) {
      sent++
      const okData = await res.json().catch(() => ({}))
      await supabase.from('outbound_leads').update({
        status: 'emailed',
        email_subject: renderedSubject,
        email_sent_at: new Date().toISOString(),
        error: null,
        last_send_result: `auto-sent → ${lead.email} · Resend id ${okData?.id ?? 'ok'} · ${new Date().toISOString()}`,
      }).eq('id', lead.id)
    } else {
      const err = await res.json().catch(() => ({}))
      errors.push(`${lead.email}: ${JSON.stringify(err).slice(0, 120)}`)
      await supabase.from('outbound_leads').update({
        status: 'failed',
        error: JSON.stringify(err).slice(0, 150),
        last_send_result: `FAILED → ${lead.email} · ${JSON.stringify(err).slice(0, 150)}`,
      }).eq('id', lead.id)
    }
  }

  return NextResponse.json({ ok: true, sent, failed: errors.length, errors: errors.slice(0, 10) })
}
