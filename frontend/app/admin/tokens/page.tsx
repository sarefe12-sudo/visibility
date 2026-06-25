'use client'

import { useEffect, useState } from 'react'

interface TokenStats {
  totalCost: number
  modelTotals: Record<string, { prompt: number; completion: number; cost: number }>
  topUsers: { id: string; email: string; tier: string; cost_usd: number }[]
}

const PRO_PRICE = 49
const AGENCY_PRICE = 199

export default function TokensPage() {
  const [data, setData] = useState<TokenStats | null>(null)
  const [loading, setLoading] = useState(true)
  // rough MRR estimate — will be replaced with real billing data
  const [mrrEstimate] = useState(0)

  useEffect(() => {
    fetch('/api/admin/tokens').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>
  if (!data) return <div className="p-8 text-red-400">Failed to load</div>

  const margin = mrrEstimate > 0 ? (((mrrEstimate - data.totalCost) / mrrEstimate) * 100).toFixed(1) : '—'

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-2">Token & Cost Analytics</h1>
      <p className="text-slate-500 text-sm mb-6">This month · real-time from Railway backend</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total AI Cost (Month)</div>
          <div className="text-2xl font-bold text-white">${data.totalCost.toFixed(4)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">MRR</div>
          <div className="text-2xl font-bold text-white">${mrrEstimate.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">from billing events</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Gross Margin</div>
          <div className="text-2xl font-bold text-white">{margin}%</div>
        </div>
      </div>

      {/* Per-model breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Cost by Model</h2>
        {Object.keys(data.modelTotals).length === 0 ? (
          <p className="text-slate-500 text-sm">No usage yet this month</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="pb-3 pr-4">Model</th>
                <th className="pb-3 pr-4">Prompt Tokens</th>
                <th className="pb-3 pr-4">Completion Tokens</th>
                <th className="pb-3">Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.modelTotals).map(([model, stats]) => (
                <tr key={model} className="border-t border-slate-800">
                  <td className="py-2.5 pr-4 text-slate-300 font-medium">{model}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{stats.prompt.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{stats.completion.toLocaleString()}</td>
                  <td className="py-2.5 text-amber-400">${stats.cost.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Top spenders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Top Spenders (This Month)</h2>
        {data.topUsers.length === 0 ? (
          <p className="text-slate-500 text-sm">No usage yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Tier</th>
                <th className="pb-3">AI Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.topUsers.map((u, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="py-2.5 pr-4 text-slate-300">{u.email ?? '—'}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.tier === 'agency' ? 'bg-amber-900/40 text-amber-400' :
                      u.tier === 'pro' ? 'bg-indigo-900/40 text-indigo-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>{u.tier ?? 'free'}</span>
                  </td>
                  <td className="py-2.5 text-red-400">${u.cost_usd.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
