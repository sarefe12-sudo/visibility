'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AnalyzeResponse } from '@/types'
import PublishButton from './PublishButton'

interface Props {
  data: AnalyzeResponse
  market: string
  tier: string
  analysisId?: string
}

interface Asset {
  id: string
  type: string
  title: string
  content: string
  created_at?: string
}

type AssetType = 'faq' | 'schema' | 'press_release' | 'linkedin'

const KIT: { type: AssetType; label: string; desc: string; icon: string; iconClass: string }[] = [
  { type: 'faq', label: 'FAQ Content', desc: 'High-intent Q&A built from the real questions buyers ask AI.', icon: '❓', iconClass: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
  { type: 'schema', label: 'Schema Markup', desc: 'Valid JSON-LD so AI models can identify who you are. Paste & go.', icon: '{ }', iconClass: 'bg-violet-50 border-violet-100 text-violet-600' },
  { type: 'press_release', label: 'Press Release', desc: 'A draft engineered to earn coverage AI models trust and cite.', icon: '📰', iconClass: 'bg-amber-50 border-amber-100 text-amber-600' },
  { type: 'linkedin', label: 'LinkedIn Post', desc: 'A ready-to-publish post about your AI discoverability.', icon: 'in', iconClass: 'bg-sky-50 border-sky-100 text-sky-600' },
]

function copy(text: string) { navigator.clipboard.writeText(text).catch(() => {}) }

export default function GrowthKitPanel({ data, market, tier, analysisId }: Props) {
  const isPremium = tier === 'pro' || tier === 'agency'
  const [assets, setAssets] = useState<Record<string, Asset>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadExisting = useCallback(async () => {
    if (!isPremium || !analysisId) return
    const r = await fetch(`/api/growth-kit?analysis_id=${analysisId}`)
    if (!r.ok) return
    const d = await r.json()
    const map: Record<string, Asset> = {}
    for (const a of d.assets ?? []) if (!map[a.type]) map[a.type] = a
    setAssets(map)
  }, [isPremium, analysisId])

  useEffect(() => { loadExisting() }, [loadExisting])

  const generate = async (type: AssetType) => {
    setLoading(type); setError(null)
    try {
      const r = await fetch('/api/growth-kit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          analysis_id: analysisId,
          brand: data.brand,
          market,
          overall_score: data.overall_score,
          model_scores: data.model_scores,
          competitor_scores: data.competitor_scores,
        }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error === 'upgrade_required' ? 'Available on Pro & Agency plans.' : (d.error ?? 'Generation failed')); return }
      setAssets(prev => ({ ...prev, [type]: d.asset }))
      setOpen(type)
    } finally {
      setLoading(null)
    }
  }

  const doCopy = (type: string, content: string) => {
    copy(content); setCopied(type); setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-base font-extrabold text-slate-900">AI Growth Kit</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">COPILOT</span>
      </div>
      <p className="text-xs text-slate-500 mb-5">
        One click turns your analysis into the assets that get {data.brand} recommended by AI — generated for your brand, your gaps, your market.
      </p>

      {!isPremium && (
        <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-xs text-indigo-700">The AI Growth Kit is available on <strong>Pro &amp; Agency</strong> plans — generate FAQ content, schema markup, press releases and LinkedIn posts in one click.</p>
        </div>
      )}

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">{error}</div>}

      <div className="grid sm:grid-cols-2 gap-3">
        {KIT.map(item => {
          const asset = assets[item.type]
          const isLoading = loading === item.type
          return (
            <div key={item.type} className="rounded-xl border border-slate-200 p-4 flex flex-col">
              <div className="flex items-start gap-3 mb-2">
                <div className={`h-9 w-9 flex-shrink-0 rounded-lg border flex items-center justify-center text-xs font-bold ${item.iconClass}`}>{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
                  <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                </div>
              </div>

              <div className="mt-auto pt-2 flex items-center gap-2">
                {!isPremium ? (
                  <span className="text-[11px] text-slate-400">Pro &amp; Agency</span>
                ) : asset ? (
                  <>
                    <button onClick={() => setOpen(open === item.type ? null : item.type)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors">
                      {open === item.type ? 'Hide' : 'View'}
                    </button>
                    <button onClick={() => doCopy(item.type, asset.content)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors">
                      {copied === item.type ? 'Copied!' : 'Copy'}
                    </button>
                    {(item.type === 'faq' || item.type === 'press_release') && (
                      <PublishButton title={asset.title} markdown={asset.content} />
                    )}
                    <button onClick={() => generate(item.type)} disabled={isLoading}
                      className="ml-auto text-[11px] text-indigo-500 hover:text-indigo-700 disabled:opacity-50">
                      {isLoading ? 'Regenerating…' : 'Regenerate'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => generate(item.type)} disabled={isLoading}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-60">
                    {isLoading ? 'Generating…' : 'Generate'}
                  </button>
                )}
              </div>

              {asset && open === item.type && (
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 text-slate-100 p-3 text-[11px] leading-relaxed font-mono">{asset.content}</pre>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
