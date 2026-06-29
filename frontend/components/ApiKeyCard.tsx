"use client"

import { useEffect, useState } from "react"

interface ApiKey {
  id: string
  name: string
  key_preview: string
  created_at: string
  last_used_at: string | null
  full_key?: string
}

export default function ApiKeyCard({ tier }: { tier: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isPro = tier === 'pro' || tier === 'agency'

  useEffect(() => {
    if (!isPro) return
    fetch('/api/mcp-keys')
      .then(r => r.json())
      .then(d => setKeys(d.keys ?? []))
      .finally(() => setLoading(false))
  }, [isPro])

  async function createKey() {
    if (!newKeyName.trim()) return
    setCreating(true)
    const res = await fetch('/api/mcp-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    })
    const data = await res.json()
    if (data.key) {
      setRevealedKey(data.key.full_key)
      setKeys(prev => [data.key, ...prev])
      setShowForm(false)
      setNewKeyName("")
    }
    setCreating(false)
  }

  async function deleteKey(id: string) {
    await fetch('/api/mcp-keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setKeys(prev => prev.filter(k => k.id !== id))
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">MCP API Access</p>
            <p className="text-xs text-slate-500">Use VisibilityRadar inside Claude Desktop & Cursor</p>
          </div>
        </div>
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-center">
          <p className="text-xs text-indigo-700 mb-3">MCP access is available on <strong>Pro & Agency</strong> plans</p>
          <a href="/pricing" className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all">
            Upgrade to unlock →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">MCP API Keys</p>
            <p className="text-xs text-slate-500">Use VisibilityRadar inside Claude Desktop & Cursor</p>
          </div>
        </div>
        {!showForm && keys.length < 3 && (
          <button onClick={() => setShowForm(true)} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-all">
            + New Key
          </button>
        )}
      </div>

      {/* Revealed key — show once */}
      {revealedKey && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold text-emerald-800 mb-2">⚠ Copy this key now — it won&apos;t be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white border border-emerald-200 px-3 py-2 text-xs text-slate-800 font-mono break-all">{revealedKey}</code>
            <button onClick={() => copy(revealedKey)} className="flex-shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setRevealedKey(null)} className="mt-2 text-xs text-emerald-700 hover:underline">I&apos;ve saved it, dismiss</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-4 flex gap-2">
          <input
            autoFocus
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createKey()}
            placeholder="Key name (e.g. Claude Desktop)"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button onClick={createKey} disabled={creating || !newKeyName.trim()} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all">
            {creating ? "Creating..." : "Create"}
          </button>
          <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 transition-all">
            Cancel
          </button>
        </div>
      )}

      {/* Key list */}
      {loading ? (
        <div className="h-16 flex items-center justify-center text-xs text-slate-400">Loading...</div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">No API keys yet</p>
          <p className="text-xs text-slate-400">Create a key to use VisibilityRadar in Claude Desktop</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {keys.map(k => (
            <div key={k.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{k.name}</p>
                <p className="text-xs text-slate-400 font-mono">{k.key_preview}</p>
              </div>
              {k.last_used_at && (
                <p className="text-[10px] text-slate-400 flex-shrink-0">
                  Last used {new Date(k.last_used_at).toLocaleDateString()}
                </p>
              )}
              <button onClick={() => deleteKey(k.id)} className="flex-shrink-0 rounded-lg px-2 py-1 text-[10px] text-rose-500 hover:bg-rose-50 transition-all">
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Setup instructions */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-bold text-slate-700 mb-2">Setup in Claude Desktop</p>
        <p className="text-[11px] text-slate-500 mb-2">Add to your <code className="bg-white border border-slate-200 rounded px-1">claude_desktop_config.json</code>:</p>
        <pre className="text-[10px] text-slate-700 bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto">{`{
  "mcpServers": {
    "visibilityradar": {
      "command": "npx",
      "args": ["visibilityradar-mcp"],
      "env": {
        "VR_API_KEY": "your-api-key-here"
      }
    }
  }
}`}</pre>
      </div>
    </div>
  )
}
