'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Stats {
  users: { total: number; active: number; free: number; pro: number; agency: number }
  analyses: { total: number; thisMonth: number }
  contacts: number
  dailyChart: { date: string; count: number }[]
  recentUsers: { id: string; email: string; name: string | null; tier: string; created_at: string }[]
}

const PRO_PRICE = 49
const AGENCY_PRICE = 199

function KPI({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) })
  }, [])

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>
  if (!stats) return <div className="p-8 text-red-400">Failed to load</div>

  const mrr = stats.users.pro * PRO_PRICE + stats.users.agency * AGENCY_PRICE
  const arr = mrr * 12
  const conversion = stats.users.total > 0
    ? (((stats.users.pro + stats.users.agency) / stats.users.total) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-6">Executive Dashboard</h1>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI label="Total Users" value={stats.users.total} />
        <KPI label="Active (30d)" value={stats.users.active} />
        <KPI label="Free" value={stats.users.free} />
        <KPI label="Pro" value={stats.users.pro} sub={`$${stats.users.pro * PRO_PRICE}/mo`} />
        <KPI label="Agency" value={stats.users.agency} sub={`$${stats.users.agency * AGENCY_PRICE}/mo`} />
        <KPI label="MRR" value={`$${mrr.toLocaleString()}`} />
        <KPI label="ARR" value={`$${arr.toLocaleString()}`} />
        <KPI label="Conversion" value={`${conversion}%`} sub="free → paid" />
        <KPI label="Total Analyses" value={stats.analyses.total} />
        <KPI label="This Month" value={stats.analyses.thisMonth} sub="analyses" />
        <KPI label="Contacts" value={stats.contacts} sub="unread messages" />
      </div>

      {/* Daily Analyses Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Daily Analyses — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stats.dailyChart}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#818cf8' }}
            />
            <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#grad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Users */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Recent Signups</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase">
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Tier</th>
              <th className="pb-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentUsers.map(u => (
              <tr key={u.id} className="border-t border-slate-800">
                <td className="py-2.5 pr-4 text-slate-300">{u.email}</td>
                <td className="py-2.5 pr-4 text-slate-400">{u.name ?? '—'}</td>
                <td className="py-2.5 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.tier === 'agency' ? 'bg-amber-900/40 text-amber-400' :
                    u.tier === 'pro' ? 'bg-indigo-900/40 text-indigo-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>{u.tier}</span>
                </td>
                <td className="py-2.5 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
