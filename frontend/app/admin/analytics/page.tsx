'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface GA4Data {
  configured: boolean
  error?: string
  overview?: {
    sessions: number
    users: number
    newUsers: number
    pageviews: number
    bounceRate: number
    avgDuration: number
  }
  dailyChart?: { date: string; sessions: number; users: number }[]
  topPages?: { path: string; views: number; users: number }[]
  sources?: { source: string; sessions: number; users: number }[]
  countries?: { country: string; users: number }[]
  funnel?: { label: string; path: string; views: number }[]
  trend?: { sessionsDelta: string; usersDelta: string }
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}m ${s}s`
}

function delta(val: string) {
  const n = parseFloat(val)
  const pos = n >= 0
  return (
    <span className={`text-xs font-semibold ml-1 ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
      {pos ? '▲' : '▼'} {Math.abs(n).toFixed(1)}%
    </span>
  )
}

const SOURCE_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f472b6', '#a78bfa', '#fb923c', '#34d399', '#e879f9', '#60a5fa']

export default function AnalyticsPage() {
  const [data, setData] = useState<GA4Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/ga4')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-white mb-2">Analytics & Funnel</h1>
        <div className="flex items-center gap-3 text-slate-400 mt-8">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          Loading GA4 data...
        </div>
      </div>
    )
  }

  // Not configured yet
  if (!data?.configured) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-xl font-bold text-white mb-2">Analytics & Funnel</h1>
        <p className="text-slate-500 text-sm mb-8">GA4 Reporting API — setup required</p>

        <div className="bg-slate-900 border border-amber-800/40 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-900/40 rounded-full flex items-center justify-center text-orange-400 font-bold text-sm">G</div>
            <div>
              <div className="text-sm font-semibold text-white">GA4 Integration — Setup Required</div>
              <div className="text-xs text-slate-500">Property <span className="font-mono text-slate-300">G-QTY92863Z3</span> is tracking visitors</div>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="font-semibold text-white mb-2">Step 1 — Find your numeric GA4 Property ID</p>
              <p className="text-slate-400 text-xs">Google Analytics → Admin → Property Settings → Property ID (a number like <span className="font-mono text-slate-300">123456789</span>, NOT &quot;G-...&quot;)</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <p className="font-semibold text-white mb-2">Step 2 — Create a Service Account</p>
              <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside">
                <li>Go to <span className="font-mono text-slate-300">console.cloud.google.com</span></li>
                <li>Create project or select existing → Enable <strong className="text-slate-200">Google Analytics Data API</strong></li>
                <li>IAM &amp; Admin → Service Accounts → Create → Download <strong className="text-slate-200">JSON key</strong></li>
              </ol>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <p className="font-semibold text-white mb-2">Step 3 — Grant access in GA4</p>
              <p className="text-slate-400 text-xs">GA4 → Admin → Property Access Management → Add user → paste service account email → Viewer role</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <p className="font-semibold text-white mb-2">Step 4 — Add Vercel env vars</p>
              <div className="font-mono text-xs text-emerald-400 space-y-1">
                <p>GA4_PROPERTY_ID=<span className="text-slate-300">123456789</span></p>
                <p>GA4_SERVICE_ACCOUNT_JSON=<span className="text-slate-300">{`{"type":"service_account","project_id":"...",...}`}</span></p>
              </div>
              <p className="text-slate-500 text-xs mt-2">Paste the full JSON key as the value (minified, no newlines)</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500">Current tracking: <span className="text-slate-300 font-mono">G-QTY92863Z3</span> is live and collecting data. Once you complete the setup above, this page will show full analytics.</p>
        </div>
      </div>
    )
  }

  // API error
  if (data.error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-white mb-2">Analytics & Funnel</h1>
        <div className="bg-red-950 border border-red-800 rounded-xl p-6 mt-6">
          <p className="text-red-400 font-semibold mb-2">GA4 API Error</p>
          <pre className="text-xs text-red-300 whitespace-pre-wrap">{data.error}</pre>
        </div>
      </div>
    )
  }

  const ov = data.overview!
  const maxFunnelViews = Math.max(...(data.funnel ?? []).map(f => f.views), 1)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics & Funnel</h1>
          <p className="text-slate-500 text-xs mt-0.5">GA4 · Property <span className="font-mono">G-QTY92863Z3</span> · Last 30 days</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950 border border-emerald-900 px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
        </span>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Sessions', value: ov.sessions.toLocaleString(), trend: data.trend?.sessionsDelta },
          { label: 'Users', value: ov.users.toLocaleString(), trend: data.trend?.usersDelta },
          { label: 'New Users', value: ov.newUsers.toLocaleString() },
          { label: 'Pageviews', value: ov.pageviews.toLocaleString() },
          { label: 'Bounce Rate', value: `${(ov.bounceRate * 100).toFixed(1)}%` },
          { label: 'Avg Duration', value: fmtDuration(ov.avgDuration) },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{k.label}</div>
            <div className="text-xl font-bold text-white">{k.value}</div>
            {k.trend && <div className="mt-0.5">{delta(k.trend)} <span className="text-xs text-slate-600">vs prev 7d</span></div>}
          </div>
        ))}
      </div>

      {/* Daily Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Daily Sessions & Users — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.dailyChart}>
            <defs>
              <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8', fontSize: 11 }}
              itemStyle={{ fontSize: 11 }}
            />
            <Area type="monotone" dataKey="sessions" stroke="#6366f1" fill="url(#gSessions)" strokeWidth={2} name="Sessions" />
            <Area type="monotone" dataKey="users" stroke="#22d3ee" fill="url(#gUsers)" strokeWidth={2} name="Users" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Conversion Funnel — Page Views (30d)</h2>
        <div className="flex items-end gap-0">
          {data.funnel?.map((step, i) => {
            const pct = maxFunnelViews > 0 ? (step.views / maxFunnelViews) * 100 : 0
            const convPct = i > 0 && (data.funnel![i - 1].views ?? 0) > 0
              ? ((step.views / data.funnel![i - 1].views) * 100).toFixed(0)
              : null
            return (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex-1 flex flex-col items-center">
                  <div className="text-lg font-bold text-indigo-400">{step.views.toLocaleString()}</div>
                  <div
                    className="w-full rounded-t-lg mt-1 transition-all"
                    style={{
                      height: `${Math.max(pct * 1.2, 8)}px`,
                      background: `rgba(99,102,241,${0.3 + (pct / 100) * 0.7})`,
                    }}
                  />
                  <div className="text-xs text-white mt-2 font-medium">{step.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{step.path}</div>
                </div>
                {i < (data.funnel?.length ?? 0) - 1 && (
                  <div className="flex flex-col items-center px-2 pb-8">
                    <div className="text-slate-700 text-lg">›</div>
                    {convPct && <div className="text-[9px] text-emerald-500 font-bold">{convPct}%</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 2-col: Sources + Top Pages */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Traffic Sources */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Traffic Sources</h2>
          <div className="space-y-2">
            {data.sources?.slice(0, 8).map((s, i) => {
              const maxS = Math.max(...(data.sources?.map(x => x.sessions) ?? [1]))
              const pct = maxS > 0 ? (s.sessions / maxS) * 100 : 0
              return (
                <div key={s.source}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate max-w-[160px]">{s.source || '(direct)'}</span>
                    <span className="text-slate-400 font-mono">{s.sessions.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Top Pages</h2>
          <div className="space-y-1">
            {data.topPages?.slice(0, 8).map(p => (
              <div key={p.path} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
                <span className="text-xs text-slate-300 font-mono truncate max-w-[180px]">{p.path}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-indigo-400 font-mono">{p.views.toLocaleString()}</span>
                  <span className="text-xs text-slate-500">{p.users.toLocaleString()} u</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Countries Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Top Countries by Users</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.countries} layout="vertical">
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis type="category" dataKey="country" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8', fontSize: 11 }}
              itemStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="users" radius={[0, 4, 4, 0]} name="Users">
              {data.countries?.map((_, i) => (
                <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
