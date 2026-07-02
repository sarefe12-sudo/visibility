'use client'

import { useEffect, useState, useCallback } from 'react'

interface Connection {
  id: string
  platform: 'wordpress' | 'ghost' | 'webhook'
  label: string | null
  site_url: string
  status: string
  last_error: string | null
  last_used_at: string | null
  created_at: string
}

const PLATFORM_META: Record<Connection['platform'], { label: string; icon: string; urlHint: string }> = {
  wordpress: { label: 'WordPress', icon: 'W', urlHint: 'https://yoursite.com' },
  ghost: { label: 'Ghost', icon: 'G', urlHint: 'https://yoursite.ghost.io' },
  webhook: { label: 'Webhook (Zapier / Make / n8n)', icon: '⚡', urlHint: 'https://hooks.zapier.com/...' },
}

export default function PublishingConnections({ tier }: { tier: string }) {
  const isPremium = tier === 'pro' || tier === 'agency'
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [platform, setPlatform] = useState<Connection['platform']>('wordpress')
  const [siteUrl, setSiteUrl] = useState('')
  const [label, setLabel] = useState('')
  const [username, setUsername] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [adminApiKey, setAdminApiKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/publishing/connections').then(r => r.json()).then(d => { setConnections(d.connections ?? []); setLoading(false) })
  }, [])

  useEffect(() => { if (isPremium) load() }, [isPremium, load])

  const resetForm = () => {
    setSiteUrl(''); setLabel(''); setUsername(''); setAppPassword(''); setAdminApiKey(''); setWebhookSecret(''); setError(null)
  }

  const openModal = () => { resetForm(); setPlatform('wordpress'); setModalOpen(true) }

  const save = async () => {
    setSaving(true); setError(null)
    const credentials =
      platform === 'wordpress' ? { username, app_password: appPassword } :
      platform === 'ghost' ? { admin_api_key: adminApiKey } :
      { url: siteUrl, secret: webhookSecret || undefined }

    const r = await fetch('/api/publishing/connections', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, siteUrl: platform === 'webhook' ? siteUrl : siteUrl, label, credentials }),
    })
    const d = await r.json()
    setSaving(false)
    if (r.ok) { setModalOpen(false); load() }
    else setError(d.error ?? 'Connection failed')
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this connection?')) return
    await fetch('/api/publishing/connections', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-bold text-slate-800 mb-1">Publishing Integrations</p>
        <p className="text-xs text-slate-400">Auto-publish your generated blog posts and FAQ content directly to WordPress, Ghost, or your own automation (Zapier/Make). Available on the Pro plan.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-slate-800">Publishing Integrations</p>
        <button onClick={openModal} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 transition-all">+ Connect</button>
      </div>
      <p className="text-xs text-slate-400 mb-4">Connect a platform to publish generated content straight to your own site (as a draft for you to review).</p>

      {loading ? (
        <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
      ) : connections.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No connections yet.</p>
      ) : (
        <div className="space-y-2">
          {connections.map(c => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700">{c.label || PLATFORM_META[c.platform].label} <span className="text-slate-400 font-normal">· {PLATFORM_META[c.platform].label}</span></p>
                <p className="text-[11px] text-slate-400 truncate">{c.site_url}</p>
                {c.status === 'error' && c.last_error && <p className="text-[11px] text-red-500 mt-0.5">⚠ {c.last_error}</p>}
              </div>
              <button onClick={() => remove(c.id)} className="text-[11px] text-red-400 hover:text-red-600 flex-shrink-0 ml-3">Remove</button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Connect a platform</h3>

            <div className="flex gap-2 mb-4">
              {(['wordpress', 'ghost', 'webhook'] as const).map(p => (
                <button key={p} onClick={() => setPlatform(p)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-all ${platform === p ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
                  {PLATFORM_META[p].icon} {PLATFORM_META[p].label.split(' ')[0]}
                </button>
              ))}
            </div>

            {error && <div className="mb-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Label (optional)</label>
                <input value={label} onChange={e => setLabel(e.target.value)} placeholder="My main blog"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{platform === 'webhook' ? 'Webhook URL' : 'Site URL'}</label>
                <input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder={PLATFORM_META[platform].urlHint}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>

              {platform === 'wordpress' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Username</label>
                    <input value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Application Password</label>
                    <input type="password" value={appPassword} onChange={e => setAppPassword(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <p className="text-[10px] text-slate-400 mt-1">WP Admin → Users → Profile → Application Passwords → generate one for VisibilityRadar.</p>
                  </div>
                </>
              )}

              {platform === 'ghost' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Admin API Key</label>
                  <input type="password" value={adminApiKey} onChange={e => setAdminApiKey(e.target.value)} placeholder="id:secret" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <p className="text-[10px] text-slate-400 mt-1">Ghost Admin → Settings → Integrations → Add custom integration → copy the Admin API Key.</p>
                </div>
              )}

              {platform === 'webhook' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Signing secret (optional)</label>
                  <input type="password" value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <p className="text-[10px] text-slate-400 mt-1">Used to sign the X-VisibilityRadar-Signature header (HMAC-SHA256) so you can verify requests came from us.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModalOpen(false)} className="text-xs text-slate-500 px-3 py-2">Cancel</button>
              <button onClick={save} disabled={saving || !siteUrl} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 disabled:opacity-50">
                {saving ? 'Testing & saving...' : 'Test & save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
