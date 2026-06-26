'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface GSCData {
  configured: boolean
  error?: string
  siteUrl?: string
  overview?: { clicks: number; impressions: number; ctr: number; position: number }
  trend?: { clicksDelta: string; impressionsDelta: string }
  queries?: { query: string; clicks: number; impressions: number; ctr: string; position: string }[]
  pages?: { page: string; clicks: number; impressions: number; ctr: string; position: string }[]
  daily?: { date: string; clicks: number; impressions: number }[]
  countries?: { country: string; clicks: number; impressions: number }[]
  devices?: { device: string; clicks: number; impressions: number }[]
}

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f472b6', '#a78bfa']

function delta(val: string) {
  const n = parseFloat(val)
  const pos = n >= 0
  return (
    <span className={`text-xs font-semibold ml-1 ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
      {pos ? '▲' : '▼'} {Math.abs(n).toFixed(1)}%
    </span>
  )
}

function positionBadge(pos: string) {
  const n = parseFloat(pos)
  const color = n <= 3 ? 'text-emerald-400 bg-emerald-950 border-emerald-800'
    : n <= 10 ? 'text-amber-400 bg-amber-950 border-amber-800'
    : 'text-slate-400 bg-slate-800 border-slate-700'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono border ${color}`}>
      #{pos}
    </span>
  )
}

export default function SEOPage() {
  const [data, setData] = useState<GSCData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/search-console')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-white mb-2">SEO — Search Console</h1>
        <div className="flex items-center gap-3 text-slate-400 mt-8">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          Loading Search Console data...
        </div>
      </div>
    )
  }

  if (!data?.configured) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-xl font-bold text-white mb-2">SEO — Search Console</h1>
        <p className="text-slate-500 text-sm mb-8">Google Search Console API — setup required</p>

        <div className="bg-slate-900 border border-amber-800/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-900/40 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">SC</div>
            <div>
              <div className="text-sm font-semibold text-white">Google Search Console — Setup Required</div>
              <div className="text-xs text-slate-500">Same service account as GA4 works here too</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 text-sm">
            <p className="font-semibold text-white mb-2">Already have a service account?</p>
            <p className="text-slate-400 text-xs mb-3">If you set up GA4 reporting already, the same JSON key works. Just add 2 env vars:</p>
            <div className="font-mono text-xs text-emerald-400 space-y-1">
              <p>GA4_SERVICE_ACCOUNT_JSON=<span className="text-slate-300">{"{"}&quot;type&quot;:&quot;service_account&quot;,...{"}"}</span></p>
              <p>GOOGLE_SEARCH_CONSOLE_SITE=<span className="text-slate-300">https://visibilityradar.ai/</span></p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 text-sm">
            <p className="font-semibold text-white mb-2">Grant Search Console access</p>
            <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside">
              <li>Go to <span className="font-mono text-slate-300">search.google.com/search-console</span></li>
              <li>Select <strong className="text-slate-200">visibilityradar.ai</strong> property</li>
              <li>Settings → Users and permissions → Add user</li>
              <li>Paste service account email (ends in <span className="font-mono">@...iam.gserviceaccount.com</span>)</li>
              <li>Set permission to <strong className="text-slate-200">Owner</strong> → Add</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-white mb-2">SEO — Search Console</h1>
        <div className="bg-red-950 border border-red-800 rounded-xl p-6 mt-6">
          <p className="text-red-400 font-semibold mb-2">Search Console API Error</p>
          <pre className="text-xs text-red-300 whitespace-pre-wrap">{data.error}</pre>
        </div>
      </div>
    )
  }

  const ov = data.overview!
  const maxClicks = Math.max(...(data.daily ?? []).map(d => d.clicks), 1)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">SEO — Search Console</h1>
          <p className="text-slate-500 text-xs mt-0.5">{data.siteUrl} · Last 28 days · Google Search</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950 border border-emerald-900 px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Clicks</div>
          <div className="text-2xl font-bold text-white">{ov.clicks.toLocaleString()}</div>
          {data.trend && <div className="mt-0.5">{delta(data.trend.clicksDelta)} <span className="text-xs text-slate-600">vs prev 7d</span></div>}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Impressions</div>
          <div className="text-2xl font-bold text-white">{ov.impressions.toLocaleString()}</div>
          {data.trend && <div className="mt-0.5">{delta(data.trend.impressionsDelta)} <span className="text-xs text-slate-600">vs prev 7d</span></div>}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avg CTR</div>
          <div className="text-2xl font-bold text-white">{(ov.ctr * 100).toFixed(2)}%</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avg Position</div>
          <div className={`text-2xl font-bold ${ov.position <= 10 ? 'text-emerald-400' : ov.position <= 20 ? 'text-amber-400' : 'text-white'}`}>
            #{ov.position.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Daily Clicks Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Daily Clicks & Impressions — Last 28 Days</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.daily}>
            <defs>
              <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gImpressions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8', fontSize: 11 }}
              itemStyle={{ fontSize: 11 }}
            />
            <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#6366f1" fill="url(#gClicks)" strokeWidth={2} name="Clicks" />
            <Area yAxisId="right" type="monotone" dataKey="impressions" stroke="#22d3ee" fill="url(#gImpressions)" strokeWidth={2} name="Impressions" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Queries Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Top Search Queries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="pb-3 pr-4">Query</th>
                <th className="pb-3 pr-4 text-right">Clicks</th>
                <th className="pb-3 pr-4 text-right">Impressions</th>
                <th className="pb-3 pr-4 text-right">CTR</th>
                <th className="pb-3 text-right">Position</th>
              </tr>
            </thead>
            <tbody>
              {data.queries?.map(q => (
                <tr key={q.query} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                  <td className="py-2.5 pr-4 text-slate-200">{q.query}</td>
                  <td className="py-2.5 pr-4 text-right text-indigo-400 font-mono">{q.clicks.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-right text-slate-400 font-mono">{q.impressions.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-right text-slate-400 font-mono">{q.ctr}%</td>
                  <td className="py-2.5 text-right">{positionBadge(q.position)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-col: Pages + Devices/Countries */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Top Pages */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Top Pages by Clicks</h2>
          <div className="space-y-1">
            {data.pages?.slice(0, 10).map(p => (
              <div key={p.page} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                <div className="min-w-0 flex-1 mr-3">
                  <div className="text-xs text-slate-300 font-mono truncate">{p.page}</div>
                  <div className="text-[10px] text-slate-600">{p.impressions.toLocaleString()} impr · CTR {p.ctr}%</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-indigo-400 font-mono">{p.clicks}</span>
                  {positionBadge(p.position)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Countries + Devices */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">By Device</h2>
            <div className="space-y-2">
              {data.devices?.map((d, i) => {
                const maxD = Math.max(...(data.devices?.map(x => x.clicks) ?? [1]))
                const pct = maxD > 0 ? (d.clicks / maxD) * 100 : 0
                return (
                  <div key={d.device}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 capitalize">{d.device.toLowerCase()}</span>
                      <span className="text-slate-400 font-mono">{d.clicks} clicks</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">By Country</h2>
            <div className="space-y-1">
              {data.countries?.slice(0, 6).map((c, i) => (
                <div key={c.country} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-300">{c.country}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.max((c.clicks / (data.countries![0].clicks || 1)) * 80, 4)}px`, backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-slate-400 font-mono w-10 text-right">{c.clicks}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEO Insights */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">SEO Opportunities</h2>
        <div className="grid grid-cols-3 gap-4">
          {/* High impressions, low CTR */}
          {(() => {
            const lowCtr = data.queries?.filter(q => q.impressions > 50 && parseFloat(q.ctr) < 2).slice(0, 3) ?? []
            return lowCtr.length > 0 ? (
              <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-4">
                <div className="text-xs font-semibold text-amber-400 mb-2">⚡ Low CTR — Improve Title/Meta</div>
                <ul className="space-y-1">
                  {lowCtr.map(q => (
                    <li key={q.query} className="text-xs text-slate-300">
                      &ldquo;{q.query}&rdquo; — <span className="text-amber-400">{q.ctr}% CTR</span> · {q.impressions} impr
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          })()}

          {/* Position 4-20 — close to page 1 top */}
          {(() => {
            const nearTop = data.queries?.filter(q => parseFloat(q.position) > 3 && parseFloat(q.position) <= 20 && q.clicks > 0).slice(0, 3) ?? []
            return nearTop.length > 0 ? (
              <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-4">
                <div className="text-xs font-semibold text-indigo-400 mb-2">🚀 Near Top 3 — Push Higher</div>
                <ul className="space-y-1">
                  {nearTop.map(q => (
                    <li key={q.query} className="text-xs text-slate-300">
                      &ldquo;{q.query}&rdquo; — pos <span className="text-indigo-400">#{q.position}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          })()}

          {/* High impressions, zero clicks */}
          {(() => {
            const noClicks = data.queries?.filter(q => q.impressions > 100 && q.clicks === 0).slice(0, 3) ?? []
            return noClicks.length > 0 ? (
              <div className="bg-rose-950/40 border border-rose-800/40 rounded-xl p-4">
                <div className="text-xs font-semibold text-rose-400 mb-2">🎯 Zero Clicks — Content Gap</div>
                <ul className="space-y-1">
                  {noClicks.map(q => (
                    <li key={q.query} className="text-xs text-slate-300">
                      &ldquo;{q.query}&rdquo; — {q.impressions} impressions
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          })()}
        </div>
      </div>
    </div>
  )
}
