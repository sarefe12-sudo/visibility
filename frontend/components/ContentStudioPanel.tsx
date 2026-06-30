'use client'

import { useState, useEffect } from 'react'
import type { AnalyzeResponse } from '@/types'

interface ContentPost {
  title: string
  slug: string
  meta_description: string
  target_model: string
  why: string
  priority: 'high' | 'medium' | 'low'
  keywords: string[]
  read_time: number
  content: string
}

interface Props {
  data: AnalyzeResponse
  market: string
  tier: string
  analysisId?: string
  playbook?: { priority_actions: { title: string }[] } | null
}

const MODEL_COLOR: Record<string, string> = {
  claude: 'bg-orange-50 text-orange-700 border-orange-200',
  gpt4o: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  gemini: 'bg-blue-50 text-blue-700 border-blue-200',
  perplexity: 'bg-teal-50 text-teal-700 border-teal-200',
  grok: 'bg-violet-50 text-violet-700 border-violet-200',
  deepseek: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  all: 'bg-slate-100 text-slate-700 border-slate-200',
}
const MODEL_LABEL: Record<string, string> = {
  claude: 'Claude', gpt4o: 'GPT-4o', gemini: 'Gemini',
  perplexity: 'Perplexity', grok: 'Grok', deepseek: 'DeepSeek', all: 'All Models',
}
const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-50 text-red-600 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}
const PRIORITY_LABEL: Record<string, string> = { high: 'High Impact', medium: 'Medium', low: 'Quick Win' }

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

function downloadMarkdown(post: ContentPost) {
  const md = `# ${post.title}\n\n> ${post.meta_description}\n\n**Keywords:** ${post.keywords.join(', ')}\n**Read time:** ~${post.read_time} min\n\n---\n\n${post.content}`
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${post.slug}.md`; a.click()
  URL.revokeObjectURL(url)
}

// ── Free teaser ────────────────────────────────────────────────────────────────
function FreeTeaserCard({ brand }: { brand: string }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
      <div className="px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">AI Content Studio</p>
              <p className="text-xs text-indigo-600 mt-0.5">5 blog posts tailored to your AI visibility gaps</p>
            </div>
          </div>
          <span className="flex-shrink-0 text-[10px] font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-full">PRO</span>
        </div>

        {/* Blurred preview cards */}
        <div className="relative">
          <div className="space-y-2 blur-sm pointer-events-none select-none" aria-hidden>
            {['How AI Models Discover and Recommend Brands Like Yours',
              'The Ultimate Guide to Getting Mentioned by ChatGPT',
              `${brand}: Building Topical Authority for AI Search`].map((t, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{t}</p>
                  <p className="text-xs text-slate-400 mt-0.5">~8 min read · SEO optimized</p>
                </div>
                <div className="flex-shrink-0 h-7 w-20 rounded-lg bg-indigo-100" />
              </div>
            ))}
          </div>

          {/* Overlay CTA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-xl">
            <p className="text-sm font-semibold text-slate-800 mb-1">Unlock AI Content Studio</p>
            <p className="text-xs text-slate-500 text-center px-4">Get 5 AI-tailored blog posts per analysis to improve your brand&apos;s visibility in ChatGPT, Claude, Gemini and more. Available on the Pro plan.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export default function ContentStudioPanel({ data, market, tier, analysisId, playbook }: Props) {
  const isPremium = tier === 'pro' || tier === 'agency'
  const [posts, setPosts] = useState<ContentPost[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const [usage, setUsage] = useState<{ count: number; limit: number; analysis_done: boolean } | null>(null)

  useEffect(() => {
    if (!isPremium) return
    const params = analysisId ? `?analysis_id=${analysisId}` : ''
    fetch(`/api/content-generations${params}`)
      .then(r => r.json())
      .then(d => {
        setUsage(d)
        if (d.existing_posts?.length) {
          setPosts(d.existing_posts)
          setExpanded(0)
        }
      })
      .catch(() => {})
  }, [isPremium, analysisId])

  async function generate() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/content-generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          brand: data.brand,
          market,
          overall_score: data.overall_score,
          model_scores: data.model_scores,
          competitor_scores: data.competitor_scores,
          playbook: playbook ?? null,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        if (d.error === 'monthly_limit_reached') setError('Monthly limit reached. Resets on the 1st.')
        else if (d.error === 'already_generated') setError('Content already generated for this analysis.')
        else setError(d.error || 'Generation failed')
        return
      }
      setPosts(d.plan.posts)
      setExpanded(0)
      setUsage(u => u ? { ...u, count: u.count + 1, analysis_done: true } : u)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isPremium) return <FreeTeaserCard brand={data.brand} />

  const remaining = usage ? usage.limit - usage.count : null
  const canGenerate = !usage?.analysis_done && (remaining === null || remaining > 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">AI Content Studio</p>
            <p className="text-xs text-slate-400 mt-0.5">
              5 blog posts tailored to your visibility gaps
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {usage && (
            <span className="text-xs font-medium flex items-center gap-1.5">
              {usage.limit >= 999 ? (
                <span className="text-emerald-600">Unlimited content plans</span>
              ) : usage.count >= usage.limit ? (
                <span className="text-rose-500">Monthly limit reached · resets 1st</span>
              ) : usage.count === 0 ? (
                <span className="text-emerald-600">{usage.limit} content plans included this month</span>
              ) : (
                <span className="text-slate-400">{usage.limit - usage.count} of {usage.limit} plans remaining</span>
              )}
            </span>
          )}
          {!posts && !loading && (
            <button
              onClick={generate}
              disabled={!canGenerate || loading}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {usage?.analysis_done ? 'Already Generated' : canGenerate ? 'Generate Content Plan' : 'Limit Reached'}
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-600">Generating content plan for {data.brand}…</p>
          <p className="text-xs text-slate-400">Claude is analyzing your visibility gaps</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mx-5 my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Empty state */}
      {!posts && !loading && !error && (
        <div className="flex flex-col items-center gap-2 py-10 px-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#94a3b8" strokeWidth="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <p className="text-sm font-medium text-slate-500">Ready to generate your content plan</p>
          <p className="text-xs text-slate-400 max-w-xs">We will analyze your visibility gaps and create 5 targeted blog posts to improve how AI models talk about {data.brand}.</p>
        </div>
      )}

      {/* Posts */}
      {posts && (
        <div className="divide-y divide-slate-100">
          {posts.map((post, i) => (
            <div key={i} className="overflow-hidden">
              {/* Card header */}
              <div
                className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-snug">{post.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{post.why}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${MODEL_COLOR[post.target_model] ?? MODEL_COLOR.all}`}>
                      {MODEL_LABEL[post.target_model] ?? post.target_model}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[post.priority] ?? ''}`}>
                      {PRIORITY_LABEL[post.priority] ?? post.priority}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-200 text-slate-500">
                      ~{post.read_time} min read
                    </span>
                  </div>
                </div>
                <svg className={`flex-shrink-0 mt-1 h-4 w-4 text-slate-400 transition-transform ${expanded === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>

              {/* Expanded content */}
              {expanded === i && (
                <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/50">
                  {/* Meta */}
                  <div className="pt-4 pb-3 flex flex-wrap gap-2">
                    {post.keywords.map(kw => (
                      <span key={kw} className="text-[10px] bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{kw}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 italic mb-4 border-l-2 border-indigo-300 pl-3">{post.meta_description}</p>

                  {/* Full content */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto text-xs">
                    {post.content}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { copyToClipboard(post.content); setCopied(i); setTimeout(() => setCopied(null), 2000) }}
                      className="flex items-center gap-1.5 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {copied === i
                        ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Copied!</>
                        : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/></svg> Copy Markdown</>
                      }
                    </button>
                    <button
                      onClick={() => downloadMarkdown(post)}
                      className="flex items-center gap-1.5 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Download .md
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
