import { createHmac } from 'crypto'
import { markdownToHtml } from './markdownToHtml'

export type Platform = 'wordpress' | 'ghost' | 'webhook'

export interface WordPressCreds { username: string; app_password: string }
export interface GhostCreds { admin_api_key: string } // format: "<id>:<hex secret>"
export interface WebhookCreds { url: string; secret?: string }

function base64url(input: Buffer | string): string {
  const b = typeof input === 'string' ? Buffer.from(input) : input
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Ghost Admin API auth: short-lived HS256 JWT built from the "<id>:<secret>" key.
function buildGhostToken(adminApiKey: string): string {
  const [id, secretHex] = adminApiKey.split(':')
  if (!id || !secretHex) throw new Error('Invalid Ghost Admin API key — expected "<id>:<secret>"')
  const secret = Buffer.from(secretHex, 'hex')

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id }))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64url(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }))
  const signature = base64url(createHmac('sha256', secret).update(`${header}.${payload}`).digest())
  return `${header}.${payload}.${signature}`
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export interface PublishInput {
  platform: Platform
  siteUrl: string
  credentials: Record<string, string>
  title: string
  markdown: string
  publishStatus?: 'draft' | 'publish' // where supported; webhook ignores this
}

export interface PublishResult {
  ok: boolean
  url?: string
  error?: string
}

export async function publishContent(input: PublishInput): Promise<PublishResult> {
  const { platform, siteUrl, credentials, title, markdown } = input
  const status = input.publishStatus ?? 'draft'
  const html = markdownToHtml(markdown)
  const site = normalizeUrl(siteUrl)

  try {
    if (platform === 'wordpress') {
      const { username, app_password } = credentials as unknown as WordPressCreds
      const auth = Buffer.from(`${username}:${app_password}`).toString('base64')
      const res = await fetch(`${site}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: html, status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { ok: false, error: err?.message ?? `WordPress ${res.status}` }
      }
      const data = await res.json()
      return { ok: true, url: data.link }
    }

    if (platform === 'ghost') {
      const { admin_api_key } = credentials as unknown as GhostCreds
      const token = buildGhostToken(admin_api_key)
      const res = await fetch(`${site}/ghost/api/admin/posts/?source=html`, {
        method: 'POST',
        headers: { Authorization: `Ghost ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: [{ title, html, status: status === 'publish' ? 'published' : 'draft' }],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { ok: false, error: err?.errors?.[0]?.message ?? `Ghost ${res.status}` }
      }
      const data = await res.json()
      return { ok: true, url: data.posts?.[0]?.url }
    }

    if (platform === 'webhook') {
      const { url, secret } = credentials as unknown as WebhookCreds
      const payload = JSON.stringify({ event: 'content.publish', title, html, markdown, sent_at: new Date().toISOString() })
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (secret) headers['X-VisibilityRadar-Signature'] = createHmac('sha256', secret).update(payload).digest('hex')
      const res = await fetch(url, { method: 'POST', headers, body: payload })
      if (!res.ok) return { ok: false, error: `Webhook returned ${res.status}` }
      return { ok: true }
    }

    return { ok: false, error: 'Unknown platform' }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// Lightweight connectivity + auth check used when a connection is first saved.
export async function testConnection(platform: Platform, siteUrl: string, credentials: Record<string, string>): Promise<PublishResult> {
  const site = normalizeUrl(siteUrl)
  try {
    if (platform === 'wordpress') {
      const { username, app_password } = credentials as unknown as WordPressCreds
      const auth = Buffer.from(`${username}:${app_password}`).toString('base64')
      const res = await fetch(`${site}/wp-json/wp/v2/users/me`, { headers: { Authorization: `Basic ${auth}` } })
      if (!res.ok) return { ok: false, error: `WordPress auth failed (${res.status}). Check site URL and Application Password.` }
      return { ok: true }
    }
    if (platform === 'ghost') {
      const { admin_api_key } = credentials as unknown as GhostCreds
      const token = buildGhostToken(admin_api_key)
      const res = await fetch(`${site}/ghost/api/admin/posts/?limit=1`, { headers: { Authorization: `Ghost ${token}` } })
      if (!res.ok) return { ok: false, error: `Ghost auth failed (${res.status}). Check site URL and Admin API Key.` }
      return { ok: true }
    }
    if (platform === 'webhook') {
      const { url, secret } = credentials as unknown as WebhookCreds
      const payload = JSON.stringify({ event: 'connection.test', sent_at: new Date().toISOString() })
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (secret) headers['X-VisibilityRadar-Signature'] = createHmac('sha256', secret).update(payload).digest('hex')
      const res = await fetch(url, { method: 'POST', headers, body: payload })
      if (!res.ok) return { ok: false, error: `Webhook test returned ${res.status}` }
      return { ok: true }
    }
    return { ok: false, error: 'Unknown platform' }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
