'use client'

import { useEffect, useState } from 'react'

interface Cancellation {
  id: string
  email: string
  tier: string
  reason: string
  custom_note: string | null
  cancelled_at: string
  lemon_subscription_id: string | null
}

interface RetentionData {
  cancellations: Cancellation[]
  reasonCounts: Record<string, number>
  total: number
}

const REASON_EMOJI: Record<string, string> = {
  'Too expensive': '💸',
  'Not using it enough': '😴',
  'Missing features I need': '🔧',
  'Switching to a competitor': '🔄',
  'Technical issues': '⚠️',
  'Just testing / exploring': '🧪',
  'Other': '💬',
}

export default function RetentionPage() {
  const [data, setData] = useState<RetentionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/cancellations')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>
  if (!data) return <div className="p-8 text-red-400">Failed to load</div>

  const sorted = Object.entries(data.reasonCounts).sort((a, b) => b[1] - a[1])
  const maxCount = sorted[0]?.[1] ?? 1

  const filtered = data.cancellations.filter(c =>
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.reason.toLowerCase().includes(search.toLowerCase())
  )

  const tierColor = (tier: string) =>
    tier === 'pro' ? 'text-indigo-400 bg-indigo-900/30' :
    tier === 'agency' ? 'text-amber-400 bg-amber-900/30' :
    'text-slate-400 bg-slate-800'

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-1">Retention & Churn</h1>
      <p className="text-slate-500 text-sm mb-8">
        {data.total} cancellation{data.total !== 1 ? 's' : ''} total — use this list for win-back campaigns
      </p>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Cancel Reasons breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Cancel Reasons</div>
          {sorted.length === 0 ? (
            <div className="text-sm text-slate-600 py-4 text-center">No cancellations yet</div>
          ) : (
            <div className="space-y-3">
              {sorted.map(([reason, count]) => (
                <div key={reason}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-300">
                      {REASON_EMOJI[reason] ?? '•'} {reason}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-rows-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Churned</div>
            <div className="text-3xl font-bold text-white">{data.total}</div>
            <div className="text-xs text-slate-500 mt-1">all time</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Top Reason</div>
            <div className="text-sm font-semibold text-slate-200">
              {sorted[0] ? `${REASON_EMOJI[sorted[0][0]] ?? ''} ${sorted[0][0]}` : '—'}
            </div>
            {sorted[0] && (
              <div className="text-xs text-slate-500 mt-1">
                {Math.round((sorted[0][1] / data.total) * 100)}% of cancellations
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Win-back list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-300">Win-back List</h2>
            <p className="text-xs text-slate-500 mt-0.5">Cancelled users — target with re-engagement offers</p>
          </div>
          <input
            type="text"
            placeholder="Search email or reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-slate-600 py-12 text-sm">
            {data.total === 0 ? 'No cancelled users yet' : 'No results for search'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Was on</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-slate-200 font-medium">{c.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${tierColor(c.tier)}`}>
                      {c.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {REASON_EMOJI[c.reason] ?? ''} {c.reason}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[180px] truncate">
                    {c.custom_note ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(c.cancelled_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-slate-600 mt-3 text-right">
          {filtered.length} user{filtered.length !== 1 ? 's' : ''} — copy emails to target with win-back campaign
        </p>
      )}
    </div>
  )
}
