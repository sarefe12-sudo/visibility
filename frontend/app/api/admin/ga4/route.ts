import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSign } from 'crypto'

const ADMIN_EMAIL = 'sarefe12@gmail.com'

function base64url(data: string | Buffer): string {
  const b64 = Buffer.from(data).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }))

  const input = `${header}.${payload}`
  const sign = createSign('RSA-SHA256')
  sign.update(input)
  sign.end()
  const sig = base64url(sign.sign(sa.private_key))
  const jwt = `${input}.${sig}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const data = await res.json()
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`)
  return data.access_token
}

async function ga4Report(token: string, propertyId: string, body: object) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GA4 API error ${res.status}: ${err}`)
  }
  return res.json()
}

function parseRows(report: { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] }) {
  return (report?.rows ?? []).map(r => ({
    dims: r.dimensionValues.map(d => d.value),
    mets: r.metricValues.map(m => m.value),
  }))
}

export async function GET() {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const saJson = process.env.GA4_SERVICE_ACCOUNT_JSON
  const propertyId = process.env.GA4_PROPERTY_ID

  if (!saJson || !propertyId) {
    return NextResponse.json({ configured: false })
  }

  try {
    const token = await getAccessToken(saJson)

    const batchBody = {
      requests: [
        // 0 — 30-day overview totals
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
        },
        // 1 — daily sessions last 30 days
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
        // 2 — top pages
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 10,
        },
        // 3 — traffic sources
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionSourceMedium' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        },
        // 4 — top countries
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
          limit: 8,
        },
        // 5 — funnel: pageviews per key path
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              inListFilter: {
                values: ['/', '/analyze', '/pricing', '/sign-up', '/sign-in'],
              },
            },
          },
        },
        // 6 — 7-day vs prev 7-day comparison
        {
          dateRanges: [
            { startDate: '7daysAgo', endDate: 'today' },
            { startDate: '14daysAgo', endDate: '8daysAgo' },
          ],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        },
      ],
    }

    const { reports } = await ga4Report(token, propertyId, batchBody)

    // Overview totals (single row, no dimension)
    const overviewRow = reports[0]?.rows?.[0]
    const overview = overviewRow
      ? {
          sessions: parseInt(overviewRow.metricValues[0].value),
          users: parseInt(overviewRow.metricValues[1].value),
          newUsers: parseInt(overviewRow.metricValues[2].value),
          pageviews: parseInt(overviewRow.metricValues[3].value),
          bounceRate: parseFloat(overviewRow.metricValues[4].value),
          avgDuration: parseFloat(overviewRow.metricValues[5].value),
        }
      : null

    // Daily chart
    const dailyChart = parseRows(reports[1]).map(r => ({
      date: `${r.dims[0].slice(0, 4)}-${r.dims[0].slice(4, 6)}-${r.dims[0].slice(6, 8)}`,
      sessions: parseInt(r.mets[0]),
      users: parseInt(r.mets[1]),
    }))

    // Top pages
    const topPages = parseRows(reports[2]).map(r => ({
      path: r.dims[0],
      views: parseInt(r.mets[0]),
      users: parseInt(r.mets[1]),
    }))

    // Traffic sources
    const sources = parseRows(reports[3]).map(r => ({
      source: r.dims[0],
      sessions: parseInt(r.mets[0]),
      users: parseInt(r.mets[1]),
    }))

    // Countries
    const countries = parseRows(reports[4]).map(r => ({
      country: r.dims[0],
      users: parseInt(r.mets[0]),
    }))

    // Funnel
    const funnelMap: Record<string, number> = {}
    parseRows(reports[5]).forEach(r => { funnelMap[r.dims[0]] = parseInt(r.mets[0]) })
    const funnel = [
      { label: 'Home', path: '/', views: funnelMap['/'] ?? 0 },
      { label: 'Analyze', path: '/analyze', views: funnelMap['/analyze'] ?? 0 },
      { label: 'Pricing', path: '/pricing', views: funnelMap['/pricing'] ?? 0 },
      { label: 'Sign-up', path: '/sign-up', views: funnelMap['/sign-up'] ?? 0 },
    ]

    // 7-day comparison
    const compare7 = reports[6]
    const cur = compare7?.rows?.[0]?.metricValues
    const prev = compare7?.rows?.[1]?.metricValues
    const trend = cur && prev ? {
      sessionsDelta: parseFloat(prev[0].value) > 0
        ? (((parseInt(cur[0].value) - parseInt(prev[0].value)) / parseInt(prev[0].value)) * 100).toFixed(1)
        : '0',
      usersDelta: parseFloat(prev[1].value) > 0
        ? (((parseInt(cur[1].value) - parseInt(prev[1].value)) / parseInt(prev[1].value)) * 100).toFixed(1)
        : '0',
    } : null

    return NextResponse.json({
      configured: true,
      overview,
      dailyChart,
      topPages,
      sources,
      countries,
      funnel,
      trend,
    })
  } catch (err) {
    console.error('[GA4]', err)
    return NextResponse.json({ configured: true, error: (err as Error).message }, { status: 500 })
  }
}
