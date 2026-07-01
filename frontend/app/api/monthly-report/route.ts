import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { reanalyzeBrand } from '@/lib/reanalyze'

export const maxDuration = 300 // each brand re-run hits live AI models — budget generously

const ADMIN_EMAIL = 'sarefe12@gmail.com'
// Cap brands re-analyzed per user so the job stays within the function time budget.
const MAX_BRANDS_PER_USER = 5

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Called by Vercel Cron on 1st of each month at 08:00 UTC
// Vercel cron.json: { "crons": [{ "path": "/api/monthly-report", "schedule": "0 8 1 * *" }] }
// Also callable manually from the admin panel (Clerk admin session).
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isCron = !cronSecret || authHeader === `Bearer ${cronSecret}`

  if (!isCron) {
    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress
    if (email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No email service' }, { status: 500 })

  // Get all Pro/Agency users with at least 2 months of analyses
  const { data: users } = await supabase
    .from('users')
    .select('id, email, tier')
    .in('tier', ['pro', 'agency'])

  if (!users?.length) return NextResponse.json({ sent: 0 })

  const now = new Date()

  let sent = 0

  for (const user of users) {
    if (!user.email) continue

    // Find this user's tracked brands: the latest analysis per brand, capped
    // so the re-run job stays time-bounded.
    const { data: recentAnalyses } = await supabase
      .from('analyses')
      .select('id, brand, market, overall_score, result_snapshot, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!recentAnalyses?.length) continue

    const seenBrands = new Set<string>()
    const trackedBrands: typeof recentAnalyses = []
    for (const a of recentAnalyses) {
      const key = a.brand.toLowerCase().trim()
      if (seenBrands.has(key)) continue
      seenBrands.add(key)
      trackedBrands.push(a)
      if (trackedBrands.length >= MAX_BRANDS_PER_USER) break
    }

    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const rows: string[] = []
    for (const prevAnalysis of trackedBrands) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prevSnapshot = prevAnalysis.result_snapshot as any
      const competitors: string[] = Object.keys(prevSnapshot?.competitor_scores ?? {})

      // Re-run live so "current" reflects this month's actual AI visibility,
      // not a replay of whatever was last stored.
      const fresh = await reanalyzeBrand({
        brand: prevAnalysis.brand,
        market: prevAnalysis.market ?? 'global',
        competitors,
        tier: user.tier,
      })
      if (!fresh) continue

      await supabase.from('analyses').insert({
        user_id: user.id,
        brand: prevAnalysis.brand,
        market: prevAnalysis.market ?? 'global',
        overall_score: fresh.overall_score,
        active_models: fresh.active_models,
        competitor_count: competitors.length,
        prompt_count: Object.keys(fresh.model_scores ?? {}).length,
        result_snapshot: fresh,
        source: 'monthly_report_auto',
      })

      const lastScore = prevAnalysis.overall_score
      const currentScore = fresh.overall_score
      const diff = currentScore - lastScore
      const trend = diff > 0 ? `▲ +${diff.toFixed(1)}` : diff < 0 ? `▼ ${diff.toFixed(1)}` : '→ 0'
      const trendColor = diff > 0 ? '#059669' : diff < 0 ? '#dc2626' : '#64748b'
      rows.push(`
        <tr>
          <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#1e293b;">${prevAnalysis.brand}</td>
          <td style="padding:12px 16px;font-size:14px;text-align:right;color:#64748b;">${lastScore.toFixed(0)}</td>
          <td style="padding:12px 16px;font-size:14px;text-align:right;color:#1e293b;">${currentScore.toFixed(0)}</td>
          <td style="padding:12px 16px;font-size:13px;font-weight:700;text-align:right;color:${trendColor};">${trend}</td>
        </tr>`)
    }

    if (rows.length === 0) continue
    const brandRows = rows.join('')

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:linear-gradient(135deg,#1e1b4b,#1e293b);padding:36px 40px;">
    <p style="margin:0 0 4px;font-size:11px;color:#818cf8;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">VisibilityRadar · Monthly Report</p>
    <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">${monthName} — AI Visibility Summary</h1>
  </td></tr>
  <tr><td style="padding:28px 40px 8px;">
    <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Brand Performance</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f1f5f9;border-radius:10px;overflow:hidden;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 16px;font-size:11px;text-align:left;color:#94a3b8;font-weight:700;text-transform:uppercase;">Brand</th>
        <th style="padding:10px 16px;font-size:11px;text-align:right;color:#94a3b8;font-weight:700;text-transform:uppercase;">Last Month</th>
        <th style="padding:10px 16px;font-size:11px;text-align:right;color:#94a3b8;font-weight:700;text-transform:uppercase;">Current</th>
        <th style="padding:10px 16px;font-size:11px;text-align:right;color:#94a3b8;font-weight:700;text-transform:uppercase;">Change</th>
      </tr></thead>
      <tbody>${brandRows}</tbody>
    </table>
  </td></tr>
  <tr><td style="padding:24px 40px 36px;">
    <a href="https://visibilityradar.ai/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;">
      View Full Dashboard →
    </a>
  </td></tr>
  <tr><td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
    <p style="margin:0;font-size:11px;color:#cbd5e1;">VisibilityRadar · visibilityradar.ai</p>
  </td></tr>
</table></td></tr></table>
</body></html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'VisibilityRadar <reports@visibilityradar.ai>',
        to: [user.email],
        subject: `Your AI Visibility Report — ${monthName}`,
        html,
      }),
    })

    if (res.ok) sent++
    else console.error(`[monthly-report] failed for ${user.email}:`, await res.json().catch(() => ({})))
  }

  return NextResponse.json({ sent, total: users.length })
}
