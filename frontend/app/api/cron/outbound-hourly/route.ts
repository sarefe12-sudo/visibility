import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  renderOutboundTemplate, buildOutboundHtml, ruleCheckOutboundLead, llmCheckOutboundEmail,
  DEFAULT_SUBJECT, DEFAULT_BODY, type OutboundLead,
} from '@/lib/outboundEmail'

export const maxDuration = 280

const RAILWAY_URL = 'https://zealous-perception-production-2d31.up.railway.app'
// Deliverability ramp-up on a fresh sending domain: one lead per hour caps
// out at 24/day naturally; DAILY_SEND_LIMIT below keeps it at the target
// ~20/day (~140/week) even if every hourly run succeeds.
const DAILY_SEND_LIMIT = 20
// After this many failed content-safety checks, stop retrying automatically
// and surface the lead as 'failed' so it shows up for manual review instead
// of looping forever.
const MAX_REVIEW_ATTEMPTS = 3

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MODEL_NAMES: Record<string, string> = {
  claude: 'Claude', gpt4o: 'GPT-4o', gemini: 'Gemini',
  perplexity: 'Perplexity', grok: 'Grok', deepseek: 'DeepSeek',
}

interface RawLead {
  id: string; email: string; name: string | null; brand: string | null; company: string | null
  market: string | null; review_attempts: number
}

// Runs the brand analysis for one lead. Returns the audit fields on success,
// or null (having already marked the row 'failed') on hard failure.
async function auditLead(lead: RawLead) {
  const brand = lead.brand || lead.company
  const market = lead.market ?? 'global'
  if (!brand) {
    await supabase.from('outbound_leads').update({ status: 'failed', error: 'No brand/company name' }).eq('id', lead.id)
    return null
  }

  const promptRes = await fetch(`${RAILWAY_URL}/generate-prompts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand, market }),
  })
  if (!promptRes.ok) {
    const err = await promptRes.text().catch(() => '')
    await supabase.from('outbound_leads').update({ status: 'failed', error: `Prompts ${promptRes.status}: ${err.slice(0, 130)}` }).eq('id', lead.id)
    return null
  }
  const promptData = await promptRes.json()
  const prompts: string[] = (promptData.prompts ?? []).map((p: { prompt: string }) => p.prompt).filter(Boolean)
  if (prompts.length === 0) {
    await supabase.from('outbound_leads').update({ status: 'failed', error: 'No prompts generated' }).eq('id', lead.id)
    return null
  }

  let competitors: { name: string }[] = []
  try {
    const compRes = await fetch(`${RAILWAY_URL}/suggest-competitors`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, market }),
    })
    if (compRes.ok) {
      const compData = await compRes.json()
      competitors = (compData.competitors ?? []).slice(0, 3).map((name: string) => ({ name }))
    }
  } catch { /* competitors are optional */ }

  const res = await fetch(`${RAILWAY_URL}/analyze`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand, competitors, prompts, tier: 'free' }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    await supabase.from('outbound_leads').update({ status: 'failed', error: `Analyze ${res.status}: ${err.slice(0, 130)}` }).eq('id', lead.id)
    return null
  }

  const result = await res.json()
  const rawScores: Record<string, number> = result.model_scores ?? {}
  const modelScores: Record<string, number> = {}
  for (const [k, v] of Object.entries(rawScores)) modelScores[MODEL_NAMES[k] ?? k] = v as number

  let worstModel: string | null = null
  let worstScore: number | null = null
  for (const [model, score] of Object.entries(modelScores)) {
    if (worstScore === null || (score as number) < worstScore) { worstScore = score as number; worstModel = model }
  }

  const compScoresRaw: Record<string, { overall: number }> = result.competitor_scores ?? {}
  const competitorScores = Object.entries(compScoresRaw)
    .map(([name, v]) => ({ name, score: v?.overall ?? 0 }))
    .sort((a, b) => b.score - a.score)

  return {
    overall_score: result.overall_score ?? null,
    model_scores: modelScores,
    worst_model: worstModel,
    worst_score: worstScore,
    top_recommendation: (result.insights ?? [])[0] ?? null,
    competitor_scores: competitorScores,
    sample_query: prompts[0] ?? null,
  }
}

// GET /api/cron/outbound-hourly?cron=1 — Vercel Cron, once per hour.
// One lead per run: audit -> content-safety check -> send (or bounce back to
// 'pending' for a retry next hour if the content looks wrong). No manual
// trigger needed — this is the entire automated pipeline end to end.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('cron') !== '1') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Unlike the digest crons, this one spends real money (Apollo credits) and
  // sends real cold email to real people — require CRON_SECRET to be
  // explicitly configured rather than falling open when it's unset.
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  // Daily volume cap.
  const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0)
  const { count: sentToday } = await supabase
    .from('outbound_leads')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'emailed')
    .gte('email_sent_at', todayStart.toISOString())

  if ((sentToday ?? 0) >= DAILY_SEND_LIMIT) {
    return NextResponse.json({ ok: true, skipped: 'daily_limit_reached', sentToday })
  }

  // Next lead to work on: fresh imports, or ones sent back for retry that
  // haven't exhausted their review attempts.
  const { data: candidates } = await supabase
    .from('outbound_leads')
    .select('id, email, name, brand, company, market, review_attempts')
    .eq('status', 'pending')
    .lt('review_attempts', MAX_REVIEW_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(1)

  const lead = (candidates ?? [])[0] as RawLead | undefined
  if (!lead) return NextResponse.json({ ok: true, message: 'No pending leads ready' })

  const audit = await auditLead(lead)
  if (!audit) return NextResponse.json({ ok: true, message: 'Audit failed, marked failed', leadId: lead.id })

  // Build the full lead view (original + fresh audit data) used for both the
  // content check and the actual email render.
  const fullLead: OutboundLead = {
    id: lead.id, email: lead.email, name: lead.name, brand: lead.brand, company: lead.company,
    overall_score: audit.overall_score, worst_model: audit.worst_model, worst_score: audit.worst_score,
    top_recommendation: audit.top_recommendation, competitor_scores: audit.competitor_scores,
    sample_query: audit.sample_query,
  }

  const rule = ruleCheckOutboundLead(fullLead)
  const renderedSubject = renderOutboundTemplate(DEFAULT_SUBJECT, fullLead)
  const renderedBody = renderOutboundTemplate(DEFAULT_BODY, fullLead)

  const check = rule.ok ? await llmCheckOutboundEmail({ lead: fullLead, subject: renderedSubject, body: renderedBody }) : rule

  if (!check.ok) {
    const attempts = (lead.review_attempts ?? 0) + 1
    const giveUp = attempts >= MAX_REVIEW_ATTEMPTS
    await supabase.from('outbound_leads').update({
      ...audit,
      status: giveUp ? 'failed' : 'pending',
      review_attempts: attempts,
      error: `Content check failed (attempt ${attempts}${giveUp ? ', giving up' : ''}): ${check.reason}`,
    }).eq('id', lead.id)
    return NextResponse.json({ ok: true, leadId: lead.id, sent: false, reason: check.reason, attempts, giveUp })
  }

  // Content looks good — send it for real.
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'VisibilityRadar <info@visibilityradar.ai>',
      to: [fullLead.email],
      subject: renderedSubject,
      html: buildOutboundHtml(renderedBody, fullLead.id),
    }),
  })

  if (res.ok) {
    const okData = await res.json().catch(() => ({}))
    await supabase.from('outbound_leads').update({
      ...audit,
      status: 'emailed',
      email_subject: renderedSubject,
      email_sent_at: new Date().toISOString(),
      error: null,
      last_send_result: `auto-sent → ${fullLead.email} · Resend id ${okData?.id ?? 'ok'} · ${new Date().toISOString()}`,
    }).eq('id', lead.id)
    return NextResponse.json({ ok: true, leadId: lead.id, sent: true })
  } else {
    const err = await res.json().catch(() => ({}))
    await supabase.from('outbound_leads').update({
      ...audit,
      status: 'failed',
      error: JSON.stringify(err).slice(0, 150),
      last_send_result: `FAILED → ${fullLead.email} · ${JSON.stringify(err).slice(0, 150)}`,
    }).eq('id', lead.id)
    return NextResponse.json({ ok: true, leadId: lead.id, sent: false, reason: 'resend_error' })
  }
}
