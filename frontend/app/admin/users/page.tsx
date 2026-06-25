'use client'

import { useEffect, useState } from 'react'

interface AdminUser {
  id: string
  clerk_id: string
  email: string
  name: string | null
  tier: string
  user_type: string
  analyses_count: number
  is_held: boolean
  admin_note: string | null
  created_at: string
  last_login_at: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [noteModal, setNoteModal] = useState<{ userId: string; note: string } | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (tierFilter) params.set('tier', tierFilter)
    const r = await fetch(`/api/admin/users?${params}`)
    const d = await r.json()
    setUsers(d.users ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [tierFilter])

  const update = async (userId: string, updates: Record<string, unknown>) => {
    setSaving(userId)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates }),
    })
    setSaving(null)
    await load()
  }

  const tierBadge = (tier: string) => {
    const cls =
      tier === 'agency' ? 'bg-amber-900/40 text-amber-400' :
      tier === 'pro' ? 'bg-indigo-900/40 text-indigo-400' :
      'bg-slate-800 text-slate-400'
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{tier}</span>
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-6">Users Management</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Search by email..."
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm placeholder-slate-500 w-64 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Tiers</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="agency">Agency</option>
        </select>
        <button
          onClick={load}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Analyses</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={`border-t border-slate-800 ${u.is_held ? 'bg-red-950/20' : ''}`}>
                  <td className="px-4 py-3 text-slate-300">
                    <div>{u.email}</div>
                    {u.admin_note && <div className="text-xs text-amber-400 mt-0.5">Note: {u.admin_note}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.name ?? '—'}</td>
                  <td className="px-4 py-3">{tierBadge(u.tier)}</td>
                  <td className="px-4 py-3 text-slate-400 text-center">{u.analyses_count}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_held
                      ? <span className="text-xs text-red-400 font-medium">Held</span>
                      : <span className="text-xs text-emerald-400">Active</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Hold / Unhold */}
                      <button
                        onClick={() => update(u.id, { is_held: !u.is_held })}
                        disabled={saving === u.id}
                        className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                          u.is_held
                            ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60'
                            : 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
                        }`}
                      >
                        {u.is_held ? 'Unhold' : 'Hold'}
                      </button>

                      {/* Tier selector */}
                      <select
                        value={u.tier}
                        onChange={e => update(u.id, { tier: e.target.value })}
                        disabled={saving === u.id}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="agency">Agency</option>
                      </select>

                      {/* Note */}
                      <button
                        onClick={() => setNoteModal({ userId: u.id, note: u.admin_note ?? '' })}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Note
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center text-slate-500 py-12">No users found</div>
          )}
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-96">
            <h3 className="text-white font-semibold mb-3">Admin Note</h3>
            <textarea
              value={noteModal.note}
              onChange={e => setNoteModal({ ...noteModal, note: e.target.value })}
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-3 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Internal note..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setNoteModal(null)} className="text-slate-400 text-sm px-4 py-2 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={() => { update(noteModal.userId, { admin_note: noteModal.note }); setNoteModal(null) }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
