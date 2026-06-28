import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import AppHeader from '@/components/AppHeader'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MODEL_COLORS: Record<string, string> = {
  claude: '#d97757', gpt4o: '#10a37f', gemini: '#4285f4',
  perplexity: '#20b2aa', grok: '#a78bfa', deepseek: '#4d6bfe',
}
const MODEL_LABELS: Record<string, string> = {
  claude: 'Claude', gpt4o: 'GPT-4o', gemini: 'Gemini',
  perplexity: 'Perplexity', grok: 'Grok', deepseek: 'DeepSeek',
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await supabase
    .from('analyses')
    .select('brand, overall_score, market')
    .eq('id', id)
    .single()

  if (!data) return { title: 'AI Visibility Score — VisibilityRadar' }

  const base = 'https://visibilityradar.ai'
  const ogUrl = `${base}/api/og?brand=${encodeURIComponent(data.brand)}&score=${data.overall_score}&market=${data.market}`

  return {
    title: `${data.brand} — AI Visibility Score ${data.overall_score}/100`,
    description: `${data.brand} scored ${data.overall_score}/100 on AI Visibility. See how ChatGPT, Claude, Gemini and more mention this brand.`,
    openGraph: {
      title: `${data.brand} — ${data.overall_score}/100 AI Visibility`,
      description: `Measured across ChatGPT, Claude, Gemini, Perplexity, Grok & DeepSeek`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.brand} — ${data.overall_score}/100 AI Visibility`,
      images: [ogUrl],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const { id } = await params
  const { data } = await supabase
    .from('analyses')
    .select('brand, overall_score, market, active_models, result_snapshot, created_at')
    .eq('id', id)
    .single()

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Analysis not found or no longer public.</p>
          <Link href="/" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all">
            Analyze Your Brand
          </Link>
        </div>
      </main>
    )
  }

  const score = data.overall_score
  const scoreColor = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = score >= 70 ? 'from-emerald-600 to-teal-600' : score >= 40 ? 'from-amber-500 to-orange-500' : 'from-red-600 to-rose-600'
  const label = score >= 70 ? 'Strong' : score >= 40 ? 'Moderate' : score >= 20 ? 'Low' : 'Invisible'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapshot = data.result_snapshot as any
  const modelScores: Record<string, number> = snapshot?.model_scores ?? {}

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-24 pb-20">

        {/* Score card */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${scoreBg} p-8 text-white shadow-xl mb-6`}>
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <p className="text-xs font-black uppercase tracking-widest text-white/70 mb-1">AI Visibility Score</p>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-8xl font-black leading-none tabular-nums">{score}</span>
            <span className="text-3xl text-white/60 mb-2">/100</span>
            <span className="mb-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">{label}</span>
          </div>
          <p className="text-white/70 text-sm">
            {data.brand} · {(data.market ?? 'global').toUpperCase()} · {(data.active_models ?? []).length} AI models
          </p>
        </div>

        {/* Per-model scores */}
        {Object.keys(modelScores).length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Per-Model Score</p>
            <div className="space-y-3">
              {Object.entries(modelScores).map(([key, s]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 w-24 flex-shrink-0">{MODEL_LABELS[key] ?? key}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s}%`, backgroundColor: MODEL_COLORS[key] ?? '#94a3b8' }}
                    />
                  </div>
                  <span className="text-sm font-black text-slate-700 w-7 text-right tabular-nums">{Math.round(s)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 text-center">
          <p className="text-sm font-semibold text-indigo-800 mb-1">How does your brand rank?</p>
          <p className="text-xs text-indigo-600 mb-4">
            Measure your AI visibility across ChatGPT, Claude, Gemini & more — free.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all"
          >
            Analyze Your Brand Free →
          </Link>
          <p className="text-[11px] text-indigo-400 mt-3">No credit card · 2-minute setup</p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Shared via{' '}
          <Link href="/" className="text-indigo-500 hover:underline">VisibilityRadar</Link>
          {' '}· {new Date(data.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </main>
  )
}
