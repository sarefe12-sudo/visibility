'use client'

import { useEffect, useState, useCallback } from 'react'

interface Analysis {
  id: string
  brand: string
  market: string
  overall_score: number
  active_models: string[] | null
  competitor_count: number | null
  prompt_count: number | null
  source: string | null
  created_at: string
  user_id: string
  users: { email: string; tier: string } | null
}

const SOURCE_STYLE: Record<string, string> = {
  weekly_digest_auto: 'bg-violet-500/15 text-violet-400',
  monthly_report_auto: 'bg-blue-500/15 text-blue-400',
  mcp: 'bg-amber-500/15 text-amber-400',
}

export default function AdminAnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [editing, setEditing] = useState<Analysis | null>(null)
  const [editBrand, setEditBrand] = useState('')
  const [editMarket, setEditMarket] = useState('')

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/analyses')
    const d = await r.json()
    setAnalyses(d.analyses ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000) }

  const filtered = analyses.filter(a => {
    const q = search.toLowerCase()
    return a.brand.toLowerCase().includes(q) || (a.users?.email ?? '').toLowerCase().includes(q)
  })

  const toggle = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(a => a.id)))
  }

  const openEdit = (a: Analysis) => { setEditing(a); setEditBrand(a.brand); setEditMarket(a.market) }

  const saveEdit = async () => {
    if (!editing) return
    setBusy(true)
    const r = await fetch('/api/admin/analyses', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing.id, brand: editBrand, market: editMarket }),
    })
    setBusy(false)
    if (r.ok) { setEditing(null); flash('Updated'); load() }
    else { const d = await r.json().catch(() => ({})); flash(d.error ?? 'Update failed') }
  }

  const del = async (ids: string[]) => {
    if (ids.length === 0) return
    if (!confirm(`Delete ${ids.length} analysis${ids.length > 1 ? 'es' : ''}? This cannot be undone. Linked blog posts are kept but unlinked, and the user's quota usage is adjusted automatically.`)) return
    setBusy(true)
    const r = await fetch('/api/admin/analyses', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setBusy(false)
    if (r.ok) { setSelected(new Set()); flash(`Deleted ${ids.length}`); load() }
    else { const d = await r.json().catch(() => ({})); flash(d.error ?? 'Delete failed') }
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 border border-slate-700 text-slate-100 text-sm px-4 py-3 rounded-lg shadow-xl">{toast}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Analyses</h1>
          <p className="text-slate-500 text-sm mt-0.5">{analyses.length} total across all users</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text" placeholder="Search brand / user email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5">
          <span className="text-sm text-slate-400">{selected.size} selected</span>
          <div className="flex-1" />
          <button onClick={() => del(Array.from(selected))} disabled={busy}
            className="bg-slate-800 hover:bg-red-900/50 text-red-400 text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            Delete
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-8">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-indigo-500" />
              </th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Brand</th>
              <th className="px-4 py-3 text-left">Market</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Models</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-600">No analyses found</td></tr>
            )}
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} className="accent-indigo-500" /></td>
                <td className="px-4 py-3">
                  <div className="text-slate-300">{a.users?.email ?? '—'}</div>
                  {a.users?.tier && <span className="text-[10px] uppercase text-slate-500">{a.users.tier}</span>}
                </td>
                <td className="px-4 py-3 text-slate-200 font-medium">{a.brand}</td>
                <td className="px-4 py-3 text-slate-500 uppercase text-xs">{a.market}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${a.overall_score >= 70 ? 'text-emerald-400' : a.overall_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {Math.round(a.overall_score)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{a.active_models?.length ?? '—'}</td>
                <td className="px-4 py-3">
                  {a.source && (
                    <span className={`text-[10px] px-2 py-0.5 rounded ${SOURCE_STYLE[a.source] ?? 'bg-slate-800 text-slate-400'}`}>{a.source}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button onClick={() => openEdit(a)} className="text-xs text-indigo-400 hover:text-indigo-300 mr-3">Edit</button>
                  <button onClick={() => del([a.id])} className="text-xs text-red-400/80 hover:text-red-400">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[420px]">
            <h3 className="text-white font-semibold mb-4">Edit analysis</h3>
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Brand</label>
              <input value={editBrand} onChange={e => setEditBrand(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Market</label>
              <input value={editMarket} onChange={e => setEditMarket(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
            </div>
            <p className="text-[11px] text-slate-600 mb-4">Score and model data reflect the AI test result and aren&apos;t editable here — delete and re-run instead if that needs to change.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="text-slate-400 text-sm px-4 py-2 hover:text-white">Cancel</button>
              <button onClick={saveEdit} disabled={busy} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">{busy ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
