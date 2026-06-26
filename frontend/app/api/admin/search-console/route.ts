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
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
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

async function gscQuery(token: string, siteUrl: string, body: object) {
  const encoded = encodeURIComponent(siteUrl)
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
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
    throw new Error(`GSC API error ${res.status}: ${err}`)
  }
  return res.json()
}

function dateRange(daysAgo: number): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - daysAgo)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

export async function GET() {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const saJson = process.env.GA4_SERVICE_ACCOUNT_JSON
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE || 'https://visibilityradar.ai/'

  if (!saJson) {
    return NextResponse.json({ configured: false })
  }

  try {
    const token = await getAccessToken(saJson)
    const range28 = dateRange(28)
    const range7 = dateRange(7)
    const range7prev = { startDate: dateRange(14).startDate, endDate: dateRange(8).endDate }

    const [
      overviewData,
      queriesData,
      pagesData,
      dailyData,
      overview7,
      overview7prev,
      countriesData,
      devicesData,
    ] = await Promise.all([
      // 28-day totals (no dimension)
      gscQuery(token, siteUrl, { ...range28, rowLimit: 1 }),
      // Top queries
      gscQuery(token, siteUrl, { ...range28, dimensions: ['query'], rowLimit: 20 }),
      // Top pages
      gscQuery(token, siteUrl, { ...range28, dimensions: ['page'], rowLimit: 15 }),
      // Daily clicks+impressions
      gscQuery(token, siteUrl, { ...range28, dimensions: ['date'], rowLimit: 30 }),
      // Current 7d totals
      gscQuery(token, siteUrl, { ...range7, rowLimit: 1 }),
      // Prev 7d for comparison
      gscQuery(token, siteUrl, { startDate: range7prev.startDate, endDate: range7prev.endDate, rowLimit: 1 }),
      // By country
      gscQuery(token, siteUrl, { ...range28, dimensions: ['country'], rowLimit: 10 }),
      // By device
      gscQuery(token, siteUrl, { ...range28, dimensions: ['device'], rowLimit: 5 }),
    ])

    // Overview totals from 28d data (sum all rows if dimensionless)
    const totRow = overviewData?.rows?.[0]
    const overview = totRow ? {
      clicks: totRow.clicks,
      impressions: totRow.impressions,
      ctr: totRow.ctr,
      position: totRow.position,
    } : { clicks: 0, impressions: 0, ctr: 0, position: 0 }

    // 7-day trend
    const cur7 = overview7?.rows?.[0]
    const prv7 = overview7prev?.rows?.[0]
    const trend = cur7 && prv7 && prv7.clicks > 0 ? {
      clicksDelta: (((cur7.clicks - prv7.clicks) / prv7.clicks) * 100).toFixed(1),
      impressionsDelta: (((cur7.impressions - prv7.impressions) / prv7.impressions) * 100).toFixed(1),
    } : null

    // Queries
    const queries = (queriesData?.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: (r.ctr * 100).toFixed(1),
      position: r.position.toFixed(1),
    }))

    // Pages
    const pages = (pagesData?.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }) => ({
      page: r.keys[0].replace(siteUrl.replace(/\/$/, ''), '') || '/',
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: (r.ctr * 100).toFixed(1),
      position: r.position.toFixed(1),
    }))

    // Daily chart
    const daily = (dailyData?.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number }) => ({
      date: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
    }))

    // Countries
    const countries = (countriesData?.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number }) => ({
      country: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
    }))

    // Devices
    const devices = (devicesData?.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number }) => ({
      device: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
    }))

    return NextResponse.json({
      configured: true,
      siteUrl,
      overview,
      trend,
      queries,
      pages,
      daily,
      countries,
      devices,
    })
  } catch (err) {
    console.error('[GSC]', err)
    return NextResponse.json({ configured: true, error: (err as Error).message }, { status: 500 })
  }
}
