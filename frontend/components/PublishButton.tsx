'use client'

import { useEffect, useState } from 'react'

interface Connection {
  id: string
  platform: 'wordpress' | 'ghost' | 'webhook'
  label: string | null
  site_url: string
}

const PLATFORM_LABEL: Record<Connection['platform'], string> = {
  wordpress: 'WordPress', ghost: 'Ghost', webhook: 'Webhook',
}

export default function PublishButton({ title, markdown }: { title: string; markdown: string }) {
  const [connections, setConnections] = useState<Connection[] | null>(null)
  const [open, setOpen] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (open && connections === null) {
      fetch('/api/publishing/connections').then(r => r.json()).then(d => setConnections(d.connections ?? []))
    }
  }, [open, connections])

  const publish = async (connectionId: string) => {
    setPublishing(connectionId); setResult(null)
    const r = await fetch('/api/publishing/publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId, title, markdown }),
    })
    const d = await r.json()
    setPublishing(null)
    setResult(r.ok ? { ok: true, message: 'Sent as a draft — check your site to review & publish.' } : { ok: false, message: d.error ?? 'Publish failed' })
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 4l16 8-16 8V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Publish
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 mt-1 w-64 rounded-xl border border-slate-200 bg-white shadow-lg p-2">
          {connections === null ? (
            <p className="text-xs text-slate-400 px-2 py-2">Loading connections…</p>
          ) : connections.length === 0 ? (
            <div className="px-2 py-2">
              <p className="text-xs text-slate-500 mb-2">No platforms connected yet.</p>
              <a href="/profile" className="text-xs font-semibold text-indigo-600 hover:underline">Connect one in Account Settings →</a>
            </div>
          ) : (
            <div className="space-y-1">
              {connections.map(c => (
                <button key={c.id} onClick={() => publish(c.id)} disabled={publishing !== null}
                  className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs disabled:opacity-50">
                  <span className="text-slate-700 truncate">{c.label || c.site_url} <span className="text-slate-400">· {PLATFORM_LABEL[c.platform]}</span></span>
                  {publishing === c.id && <span className="text-slate-400 flex-shrink-0 ml-2">…</span>}
                </button>
              ))}
            </div>
          )}
          {result && (
            <p className={`text-[11px] mt-2 px-2 ${result.ok ? 'text-emerald-600' : 'text-red-500'}`}>{result.message}</p>
          )}
        </div>
      )}
    </div>
  )
}
