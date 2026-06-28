import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MODEL_LABELS: Record<string, string> = {
  claude: 'Claude', gpt4o: 'GPT-4o', gemini: 'Gemini',
  perplexity: 'Perplexity', grok: 'Grok', deepseek: 'DeepSeek',
}

function buildDigestHtml(params: {
  email: string
  userName: string
  analyses: { brand: string; score: number; prevScore?: number; modelScores: Record<string, number>; date: string }[]
}): string {
  const { userName, analyses } = params

  const analysisRows = analyses.map(({ brand, score, prevScore, modelScores, date }) => {
    const delta = prevScore !== undefined ? score - prevScore : undefined
    const scoreColor = score >= 70 ? '#059669' : score >= 40 ? '#d97706' : '#dc2626'
    const deltaHtml = delta !== undefined
      ? `<span style="margin-left:8px;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;background:${delta > 0 ? '#ecfdf5' : delta < 0 ? '#fef2f2' : '#f8fafc'};color:${delta > 0 ? '#059669' : delta < 0 ? '#dc2626' : '#64748b'};">
           ${delta > 0 ? '↑ +' : delta < 0 ? '↓ ' : '= '}${delta === 0 ? 'No change' : delta}
         </span>`
      : '<span style="margin-left:8px;padding:2px 8px;border-radius:12px;font-size:11px;background:#f8fafc;color:#94a3b8;">First analysis</span>'

    const modelRows = Object.entries(modelScores).map(([m, s]) =>
      `<tr>
        <td style="padding:4px 0;font-size:12px;color:#64748b;width:100px;">${MODEL_LABELS[m] ?? m}</td>
        <td style="padding:4px 0;">
          <div style="background:#f1f5f9;border-radius:4px;height:6px;overflow:hidden;width:160px;">
            <div style="background:${scoreColor};height:6px;width:${s}%;border-radius:4px;"></div>
          </div>
        </td>
        <td style="padding:4px 0 4px 8px;font-size:12px;font-weight:700;color:#1e293b;">${Math.round(s)}</td>
      </tr>`
    ).join('')

    return `
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:16px;background:#fff;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div>
            <p style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">${brand}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">${new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div style="text-align:right;">
            <span style="font-size:40px;font-weight:900;color:${scoreColor};">${score}</span>
            <span style="font-size:16px;color:#94a3b8;">/100</span>
            ${deltaHtml}
          </div>
        </div>
        <table cellpadding="0" cellspacing="0" style="width:100%;">${modelRows}</table>
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

        <tr><td style="background:linear-gradient(135deg,#1e1b4b,#1e293b);padding:36px 40px 28px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#818cf8;">VisibilityRadar · Weekly Digest</p>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff;">Your weekly AI visibility update</h1>
          <p style="margin:0;font-size:13px;color:#94a3b8;">Hi ${userName || 'there'}, here's how your brands are performing in AI this week.</p>
        </td></tr>

        <tr><td style="padding:28px 32px;">
          ${analysisRows}
        </td></tr>

        <tr><td style="padding:24px 40px;text-align:center;border-top:1px solid #f1f5f9;">
          <a href="https://visibilityradar.ai/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;font-size:13px;font-weight:700;padding:10px 24px;border-radius:10px;text-decoration:none;">View Full Dashboard →</a>
          <p style="margin:16px 0 0;font-size:11px;color:#cbd5e1;">You're receiving this because you enabled weekly alerts. <a href="https://visibilityradar.ai/dashboard" style="color:#818cf8;">Manage preferences</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// POST /api/weekly-digest — called by Vercel Cron every Monday 07:00 UTC
// Also callable manually by admin
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

  // Get all enabled alert preferences
  const { data: prefs, error: prefsError } = await supabase
    .from('alert_preferences')
    .select('user_id, email, enabled')
    .eq('enabled', true)

  if (prefsError) return NextResponse.json({ error: prefsError.message }, { status: 500 })
  if (!prefs || prefs.length === 0) return NextResponse.json({ sent: 0, message: 'No active subscribers' })

  let sent = 0
  const errors: string[] = []

  for (const pref of prefs) {
    try {
      // Get user name
      const { data: user } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', pref.user_id)
        .single()

      // Get last 2 analyses per brand for this user (last 14 days)
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const { data: analyses } = await supabase
        .from('analyses')
        .select('id, brand, overall_score, active_models, result_snapshot, created_at')
        .eq('user_id', pref.user_id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!analyses || analyses.length === 0) continue

      // Group by brand: take latest + one before
      const byBrand = new Map<string, typeof analyses>()
      for (const a of analyses) {
        const key = a.brand.toLowerCase().trim()
        if (!byBrand.has(key)) byBrand.set(key, [])
        byBrand.get(key)!.push(a)
      }

      const digestItems = []
      for (const [, brandAnalyses] of byBrand) {
        const latest = brandAnalyses[0]
        const prev = brandAnalyses[1]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snapshot = latest.result_snapshot as any
        digestItems.push({
          brand: latest.brand,
          score: latest.overall_score,
          prevScore: prev?.overall_score,
          modelScores: snapshot?.model_scores ?? {},
          date: latest.created_at,
        })
      }

      if (digestItems.length === 0) continue

      const html = buildDigestHtml({
        email: pref.email,
        userName: user?.name ?? '',
        analyses: digestItems,
      })

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'VisibilityRadar <reports@visibilityradar.ai>',
          to: [pref.email],
          subject: `Your weekly AI visibility digest — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`,
          html,
        }),
      })

      if (res.ok) sent++
      else errors.push(`${pref.email}: ${res.status}`)
    } catch (e) {
      errors.push(`${pref.email}: ${String(e)}`)
    }
  }

  return NextResponse.json({ sent, errors, total: prefs.length })
}

// GET — admin trigger check
export async function GET() {
  return NextResponse.json({ message: 'Use POST to trigger the weekly digest' })
}
