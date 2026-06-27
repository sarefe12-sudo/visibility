'use client'

import { useState } from 'react'

interface Check {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  finding: string
  recommendation: string
}

interface Analysis {
  overall_score: number
  summary: string
  checks: Check[]
}

interface Props {
  brand: string
  websiteHint?: string
  tier: string
}

const STATUS = {
  pass: { icon: '✓', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  warn: { icon: '!', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  fail: { icon: '✗', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-600', dot: 'bg-red-400' },
}

function scoreColor(s: number) {
  if (s >= 70) return '#059669'
  if (s >= 40) return '#d97706'
  return '#dc2626'
}

function FreeTeaserCard({ brand }: { brand: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white overflow-hidden">
      <div className="px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Site AI Optimization</p>
              <p className="text-xs text-violet-600 mt-0.5">AI visibility audit for {brand}&apos;s website</p>
            </div>
          </div>
          <span className="flex-shrink-0 text-[10px] font-bold bg-violet-600 text-white px-2.5 py-1 rounded-full">PRO</span>
        </div>
        <div className="relative">
          <div className="space-y-2 blur-sm pointer-events-none select-none" aria-hidden>
            {['Schema.org markup missing — AI models can't identify your brand type',
              'Meta description doesn't mention brand name',
              'Brand mentioned only 2× on homepage — below recommended threshold'].map((t, i) => (
              <div key={i} className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${i === 0 ? 'border-red-200 bg-red-50' : i === 1 ? 'border-amber-200 bg-amber-50' : 'border-amber-200 bg-amber-50'}`}>
                <span className="mt-0.5 text-xs font-bold">{i === 0 ? '✗' : '!'}</span>
                <p className="text-xs text-slate-600">{t}</p>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-xl">
            <p className="text-sm font-semibold text-slate-800 mb-1">Unlock Site AI Optimization</p>
            <p className="text-xs text-slate-500 mb-3 text-center px-4">See exactly what's stopping AI models from understanding and recommending your brand.</p>
            <a href="/pricing" className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
              Upgrade to Pro
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SiteOptimizationPanel({ brand, websiteHint, tier }: Props) {
  const isPremium = tier === 'pro' || tier === 'agency'
  const [url, setUrl] = useState(websiteHint ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Analysis | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!isPremium) return <FreeTeaserCard brand={brand} />

  async function analyze() {
    if (!url.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/site-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), brand }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? 'Analysis failed')
        return
      }
      setResult(d.analysis)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const passes = result?.checks.filter(c => c.status === 'pass').length ?? 0
  const warns  = result?.checks.filter(c => c.status === 'warn').length ?? 0
  const fails  = result?.checks.filter(c => c.status === 'fail').length ?? 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Site AI Optimization</p>
            <p className="text-xs text-slate-400 mt-0.5">10-point audit — how AI models perceive your website</p>
          </div>
        </div>
        {result && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{passes} passed</span>
            {warns > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{warns} warnings</span>}
            {fails > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">{fails} failed</span>}
          </div>
        )}
      </div>

      {/* URL input + button */}
      <div className="px-5 py-4 flex gap-2 border-b border-slate-100">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={`https://${brand.toLowerCase().replace(/\s+/g, '')}.com`}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
          onKeyDown={e => e.key === 'Enter' && analyze()}
          disabled={loading}
        />
        <button
          onClick={analyze}
          disabled={loading || !url.trim()}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          {loading
            ? <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Analyzing…</>
            : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>Analyze Site</>
          }
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-600">Scanning {url} for AI visibility signals…</p>
          <p className="text-xs text-slate-400">Checking structure, schema markup, brand signals</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mx-5 my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="divide-y divide-slate-100">
          {/* Score banner */}
          <div className="px-5 py-4 flex items-center gap-5">
            <div className="flex-shrink-0 text-center">
              <span className="text-4xl font-extrabold" style={{ color: scoreColor(result.overall_score) }}>
                {result.overall_score}
              </span>
              <span className="text-sm text-slate-400">/100</span>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">AI Ready Score</p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
          </div>

          {/* Check list */}
          {result.checks.map((check) => {
            const s = STATUS[check.status]
            const isOpen = expanded === check.id
            return (
              <div key={check.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : check.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${s.badge}`}>
                    {s.icon}
                  </span>
                  <span className="flex-1 text-sm text-slate-700 font-medium">{check.label}</span>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
                    {check.status.toUpperCase()}
                  </span>
                  <svg className={`flex-shrink-0 h-4 w-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                {isOpen && (
                  <div className={`px-5 pb-4 pt-1 border-t ${s.border} ${s.bg}`}>
                    <p className="text-xs text-slate-600 mb-2"><span className="font-semibold">Finding:</span> {check.finding}</p>
                    <p className="text-xs text-slate-700 bg-white/70 rounded-lg px-3 py-2 border border-white">
                      <span className="font-semibold">Fix:</span> {check.recommendation}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="flex flex-col items-center gap-2 py-10 px-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <p className="text-sm font-medium text-slate-500">Ready to audit your website</p>
          <p className="text-xs text-slate-400 max-w-xs">
            We'll check 10 AI visibility signals — schema markup, brand density, meta tags, and more.
          </p>
        </div>
      )}
    </div>
  )
}
