const APP_URL = 'https://visibilityradar.ai'

export interface CompetitorScore { name: string; score: number }

export interface OutboundLead {
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
  sample_query: string | null
}

// The default AI Growth Copilot pitch — same copy used in the admin Compose
// & Send modal. Shared here so the automated daily-send cron uses identical
// wording without needing an admin to compose each time.
export const DEFAULT_SUBJECT = `{{brand}}: how to get recommended by ChatGPT in 30 days`

export const DEFAULT_BODY = `Hi {{first_name}},

When someone asks ChatGPT or Claude "{{query}}", they get a recommendation on the spot — and right now, it often isn't {{brand}}.

I ran {{brand}} through the AI models your buyers actually use. Here's where you stand:

• Your AI visibility score: {{score}}/100{{competitor_bullet}}

The good news: this is very fixable. Based on your results, three changes would move the needle most over the next 30 days:

1. Publish a structured FAQ that answers the exact questions people ask AI in your space
2. Add schema markup so AI models can clearly identify who you are and what you offer
3. Earn a few authoritative mentions (blog, press, LinkedIn) that AI models trust and cite

Here's what makes VisibilityRadar different: it's not just a report. It's an AI Growth Copilot. With one click it generates the assets to actually make those changes for you:

✓ An SEO blog post tailored to your visibility gaps
✓ FAQ content built from the real questions buyers ask AI
✓ Schema markup, ready to paste into your site
✓ A press release draft
✓ A LinkedIn post

One pattern that stood out: {{recommendation}}.

Make these changes and your odds of being the brand AI recommends for queries like "{{query}}" go up — and we track that score for you month over month.

Want me to generate your growth kit for {{brand}}?`

function formatCompetitors(comps: CompetitorScore[] | null): string {
  if (!comps || comps.length === 0) return 'your top competitors'
  return comps.map(c => `${c.name} — ${Math.round(c.score)}/100`).join(', ')
}

// Only competitors that actually outscore the brand make a persuasive (and
// honest) comparison. Niche brands often see every suggested competitor
// score 0 in a free-tier audit — in that case the bullet is dropped rather
// than shipping a comparison that undermines the email's own claim.
function competitorBullet(lead: OutboundLead): string {
  const brandScore = lead.overall_score ?? 0
  const stronger = (lead.competitor_scores ?? []).filter(c => c.score > 0 && c.score > brandScore)
  if (stronger.length === 0) return ''
  return `\n• Competitors on the same questions: ${formatCompetitors(stronger)}`
}

function firstName(name: string | null): string {
  if (!name) return 'there'
  return name.trim().split(/\s+/)[0]
}

// Replace {{token}} placeholders
export function renderOutboundTemplate(template: string, lead: OutboundLead): string {
  const brand = lead.brand || lead.company || 'your brand'
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, lead.name || 'there')
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName(lead.name))
    .replace(/\{\{\s*brand\s*\}\}/gi, brand)
    .replace(/\{\{\s*company\s*\}\}/gi, lead.company || brand)
    .replace(/\{\{\s*score\s*\}\}/gi, lead.overall_score != null ? String(Math.round(lead.overall_score)) : '—')
    .replace(/\{\{\s*worst_model\s*\}\}/gi, lead.worst_model || 'one AI model')
    .replace(/\{\{\s*worst_score\s*\}\}/gi, lead.worst_score != null ? String(Math.round(lead.worst_score)) : '—')
    .replace(/\{\{\s*recommendation\s*\}\}/gi, (lead.top_recommendation || 'improving your AI visibility').replace(/\.+\s*$/, ''))
    .replace(/\{\{\s*competitor_bullet\s*\}\}/gi, competitorBullet(lead))
    .replace(/\{\{\s*competitors\s*\}\}/gi, formatCompetitors(lead.competitor_scores))
    .replace(/\{\{\s*query\s*\}\}/gi, (lead.sample_query || 'the best option in your space').replace(/\?+\s*$/, ''))
}

export interface ContentCheckResult { ok: boolean; reason?: string }

// Fast, free sanity check — catches the common failure mode where the audit
// came back thin and the template fell back to generic placeholder phrases
// ("your brand", "your top competitors", etc). No LLM call needed for these.
export function ruleCheckOutboundLead(lead: OutboundLead): ContentCheckResult {
  if (!lead.brand || !lead.brand.trim()) return { ok: false, reason: 'Missing brand/company name' }
  if (lead.overall_score == null || lead.overall_score < 0 || lead.overall_score > 100) {
    return { ok: false, reason: `Invalid overall_score: ${lead.overall_score}` }
  }
  if (!lead.worst_model) return { ok: false, reason: 'Missing worst_model — audit likely incomplete' }
  // Note: an empty/weak competitor list is no longer a hard failure — the
  // template now omits the competitor bullet entirely in that case.
  if (!lead.sample_query || !lead.sample_query.trim()) return { ok: false, reason: 'Missing sample_query' }
  if (!/\S+@\S+\.\S+/.test(lead.email)) return { ok: false, reason: `Malformed email address: ${lead.email}` }
  return { ok: true }
}

// Semantic check — asks Claude to read the fully-rendered email as a human
// would and flag anything nonsensical, contradictory, or embarrassing before
// it goes out to a real prospect. Only called after the rule check passes.
export async function llmCheckOutboundEmail(params: {
  lead: OutboundLead
  subject: string
  body: string
}): Promise<ContentCheckResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, reason: 'ANTHROPIC_API_KEY not configured — cannot run content safety check' }

  const { lead, subject, body } = params
  const competitorsStr = (lead.competitor_scores ?? []).map(c => `${c.name} (${c.score})`).join(', ')

  const prompt = `You are a quality-control reviewer for a personalized B2B cold outreach email about AI brand visibility, about to be sent to a real prospect. Flag it if it contains: leftover placeholder-looking text (e.g. "your brand", "your top competitors", "one AI model" where real data should be), factual nonsense (e.g. a brand listed as its own competitor, an impossible score), broken personalization, or any other issue that would look unprofessional or confusing to the recipient.

Context data used to generate this email:
- Recipient: ${lead.name ?? 'unknown'} (${lead.email})
- Brand: ${lead.brand ?? lead.company ?? 'unknown'}
- Overall AI visibility score: ${lead.overall_score}
- Weakest model: ${lead.worst_model} (${lead.worst_score})
- Competitors: ${competitorsStr || 'none'}

Note: it is expected and intentional that the email omits any competitor comparison when no competitor outscores the brand (competitor scores of 0 are normal for niche brands in this audit). Do NOT fail the email for missing competitor mentions or for competitor data showing low/zero scores — only fail if the email TEXT itself contains something contradictory, broken, or embarrassing.

--- EMAIL SUBJECT ---
${subject}

--- EMAIL BODY ---
${body}

Respond with ONLY a JSON object and nothing else: {"ok": true} if this email is ready to send as-is, or {"ok": false, "reason": "<short reason, under 15 words>"} if it should NOT be sent.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return { ok: false, reason: `Content check API error ${res.status} — will retry next cycle` }
    const data = await res.json()
    const text = (data.content?.[0]?.text ?? '').trim()
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const parsed = JSON.parse(stripped)
    if (typeof parsed.ok === 'boolean') return parsed
    return { ok: false, reason: 'Content check returned an unparseable verdict' }
  } catch (e) {
    // Fail closed — if we can't verify the email is sane, don't send it.
    return { ok: false, reason: `Content check failed: ${String(e).slice(0, 100)}` }
  }
}

export function buildOutboundHtml(bodyText: string, leadId: string): string {
  const cta = `${APP_URL}/api/track/c/${leadId}?u=${encodeURIComponent(APP_URL + '/?utm_source=outreach&utm_medium=email')}`
  const pixel = `${APP_URL}/api/track/o/${leadId}.png`
  const unsubscribe = `${APP_URL}/api/track/u/${leadId}`

  // CAN-SPAM (US) / PECR-adjacent (UK, CA) compliance for commercial cold
  // email: a working one-click opt-out and a valid physical mailing address
  // are both required. Set OUTBOUND_MAILING_ADDRESS in Vercel; without it we
  // still ship the unsubscribe link (the more critical piece) but the
  // address line is left blank rather than a fabricated one.
  const mailingAddress = process.env.OUTBOUND_MAILING_ADDRESS

  const htmlBody = bodyText
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#1e293b;font-size:15px;line-height:1.6;">
    <p>${htmlBody}</p>
    <p style="margin:28px 0;">
      <a href="${cta}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block;">Generate my AI growth kit →</a>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="color:#94a3b8;font-size:12px;">VisibilityRadar · <a href="${APP_URL}" style="color:#6366f1;">visibilityradar.ai</a><br>
    See how AI models describe your brand across Claude, GPT-4o, Gemini, Perplexity, Grok &amp; DeepSeek.</p>
    ${mailingAddress ? `<p style="color:#cbd5e1;font-size:11px;">${mailingAddress}</p>` : ''}
    <p style="color:#cbd5e1;font-size:11px;">Don't want these emails? <a href="${unsubscribe}" style="color:#94a3b8;">Unsubscribe</a></p>
    <img src="${pixel}" width="1" height="1" style="display:none" alt="">
  </div>`
}
