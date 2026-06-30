import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'sarefe12@gmail.com'
const APP_URL = 'https://visibilityradar.ai'

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

interface CompetitorScore { name: string; score: number }

interface Lead {
  id: string
  email: string
  name: string | null
  brand: string | null
  company: string | null
  overall_score: number | null
  worst_model: string | null
  worst_score: number | null
  top_recommendation: string | null
  competitor_scores: CompetitorScore[] | null
}

// "Trello — 100/100, Monday.com — 97/100, Jira — 70/100"
function formatCompetitors(comps: CompetitorScore[] | null): string {
  if (!comps || comps.length === 0) return 'your top competitors'
  return comps.map(c => `${c.name} — ${Math.round(c.score)}/100`).join(', ')
}

function firstName(name: string | null): string {
  if (!name) return 'there'
  return name.trim().split(/\s+/)[0]
}

// Replace {{token}} placeholders
function render(template: string, lead: Lead): string {
  const brand = lead.brand || lead.company || 'your brand'
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, lead.name || 'there')
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName(lead.name))
    .replace(/\{\{\s*brand\s*\}\}/gi, brand)
    .replace(/\{\{\s*company\s*\}\}/gi, lead.company || brand)
    .replace(/\{\{\s*score\s*\}\}/gi, lead.overall_score != null ? String(Math.round(lead.overall_score)) : '—')
    .replace(/\{\{\s*worst_model\s*\}\}/gi, lead.worst_model || 'one AI model')
    .replace(/\{\{\s*worst_score\s*\}\}/gi, lead.worst_score != null ? String(Math.round(lead.worst_score)) : '—')
    .replace(/\{\{\s*recommendation\s*\}\}/gi, lead.top_recommendation || 'improving your AI visibility')
    .replace(/\{\{\s*competitors\s*\}\}/gi, formatCompetitors(lead.competitor_scores))
}

function buildHtml(bodyText: string, leadId: string): string {
  // Convert newlines to <br>, wrap the CTA link with click tracking
  const cta = `${APP_URL}/api/track/c/${leadId}?u=${encodeURIComponent(APP_URL + '/?utm_source=outreach&utm_medium=email')}`
  const pixel = `${APP_URL}/api/track/o/${leadId}.png`

  const htmlBody = bodyText
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#1e293b;font-size:15px;line-height:1.6;">
    <p>${htmlBody}</p>
    <p style="margin:28px 0;">
      <a href="${cta}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block;">See your full AI visibility report →</a>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="color:#94a3b8;font-size:12px;">VisibilityRadar · <a href="${APP_URL}" style="color:#6366f1;">visibilityradar.ai</a><br>
    See how AI models describe your brand across Claude, GPT-4o, Gemini, Perplexity, Grok &amp; DeepSeek.</p>
    <img src="${pixel}" width="1" height="1" style="display:none" alt="">
  </div>`
}

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
    .select('id, email, name, brand, company, overall_score, worst_model, worst_score, top_recommendation, competitor_scores')
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  const errors: string[] = []

  // Personalized → one email per lead. Cap per run to respect function timeout.
  const MAX_PER_RUN = 40
  const batch = (leads ?? []).slice(0, MAX_PER_RUN)

  for (const lead of batch as Lead[]) {
    const renderedSubject = render(subject, lead)
    const renderedBody = render(body, lead)
    const html = buildHtml(renderedBody, lead.id)

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
      // In test mode, don't advance the real lead through the funnel.
      if (!testTo) {
        await supabase.from('outbound_leads').update({
          status: 'emailed',
          email_subject: renderedSubject,
          email_sent_at: new Date().toISOString(),
          error: null,
        }).eq('id', lead.id)
      }
    } else {
      const err = await res.json().catch(() => ({}))
      errors.push(`${recipient}: ${JSON.stringify(err).slice(0, 120)}`)
      if (!testTo) {
        await supabase.from('outbound_leads').update({ status: 'failed', error: JSON.stringify(err).slice(0, 150) }).eq('id', lead.id)
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
