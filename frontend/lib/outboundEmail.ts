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

• Your AI visibility score: {{score}}/100
• Competitors on the same questions: {{competitors}}

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
    .replace(/\{\{\s*competitors\s*\}\}/gi, formatCompetitors(lead.competitor_scores))
    .replace(/\{\{\s*query\s*\}\}/gi, (lead.sample_query || 'the best option in your space').replace(/\?+\s*$/, ''))
}

export function buildOutboundHtml(bodyText: string, leadId: string): string {
  const cta = `${APP_URL}/api/track/c/${leadId}?u=${encodeURIComponent(APP_URL + '/?utm_source=outreach&utm_medium=email')}`
  const pixel = `${APP_URL}/api/track/o/${leadId}.png`

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
    <img src="${pixel}" width="1" height="1" style="display:none" alt="">
  </div>`
}
