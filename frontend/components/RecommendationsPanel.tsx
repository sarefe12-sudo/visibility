"use client";

import { useState } from "react";
import type { AnalyzeResponse } from "@/types";

async function downloadPdf(
  brand: string, overall_score: number, market: string,
  model_scores: Record<string, number>, recommendations: Recommendation[],
  setExporting: (v: boolean) => void
) {
  setExporting(true);
  try {
    const { generateRecommendationsPdf } = await import("@/lib/exportPdf");
    await generateRecommendationsPdf(brand, overall_score, market, model_scores, recommendations);
  } finally {
    setExporting(false);
  }
}

interface Recommendation {
  title: string;
  priority: "high" | "medium" | "low";
  category: "content" | "platform" | "seo" | "pr";
  description: string;
  actions: string[];
}

interface Props { data: AnalyzeResponse; market?: string; historyMode?: boolean; }

const PRIORITY_STYLE = {
  high:   { label: "High Impact",  cls: "bg-red-50 text-red-600 border-red-200" },
  medium: { label: "Medium",       cls: "bg-amber-50 text-amber-600 border-amber-200" },
  low:    { label: "Quick Win",    cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
};

const CATEGORY_STYLE: Record<string, { label: string; color: string }> = {
  content:  { label: "Content",  color: "bg-purple-100 text-purple-600" },
  platform: { label: "Platform", color: "bg-blue-100 text-blue-600" },
  seo:      { label: "SEO",      color: "bg-emerald-100 text-emerald-600" },
  pr:       { label: "PR & Brand", color: "bg-orange-100 text-orange-600" },
};

const BENEFITS = [
  { icon: "📋", title: "Step-by-step action plan", sub: "Prioritized by impact, ready to execute" },
  { icon: "🎯", title: "Model-specific tactics", sub: "What each AI needs to rank you higher" },
  { icon: "📊", title: "Competitor gap analysis", sub: "Exactly where you're losing — and how to close it" },
  { icon: "📧", title: "Full PDF report to your inbox", sub: "Share with your team in one click" },
];

export default function RecommendationsPanel({ data, market = "global", historyMode = false }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!historyMode && !email.trim()) return;
    setLoading(true); setError(null);
    try {
      // Generate recommendations
      const res = await fetch("http://localhost:8001/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: data.brand,
          overall_score: data.overall_score,
          model_scores: data.model_scores,
          competitor_scores: data.competitor_scores,
          active_models: data.active_models,
          raw_results: data.raw_results,
          market,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || `Error: ${res.status}`); }
      const d = await res.json();
      const recommendations: Recommendation[] = d.recommendations;
      setRecs(recommendations);
      setSubmitted(true);

      // Send PDF via email (only when email was collected)
      if (!email.trim()) return;
      const emailRes = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          brand: data.brand,
          overall_score: data.overall_score,
          market,
          recommendations,
          model_scores: data.model_scores,
        }),
      });
      if (emailRes.ok) setEmailSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // ── History mode: skip email gate, show direct generate button ────────────
  if (historyMode && !submitted && !recs) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">AI Visibility Playbook</p>
            <p className="text-xs text-slate-400 mt-0.5">Generate a personalized action plan for this analysis</p>
          </div>
          <button
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all disabled:opacity-40"
          >
            {loading ? (
              <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating…</>
            ) : "✦ Get Recommendations"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  // ── Gate: email not yet submitted ──────────────────────────────────────────
  if (!submitted && !historyMode) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 p-8 shadow-xl">
        {/* Glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative">
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-300 tracking-wide uppercase">Free AI Strategy Report</span>
          </div>

          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3 leading-tight">
            Your brand scored <span className="text-indigo-400">{data.overall_score.toFixed(0)}/100.</span><br />
            Here&apos;s how to get to <span className="text-emerald-400">90+.</span>
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-7 max-w-xl">
            Claude will analyze your exact results — every model, every gap, every competitor move — and build you a personalized playbook. No fluff, no generic tips. Just the steps that will move your score.
          </p>

          {/* Benefits grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                <span className="text-xl flex-shrink-0">{b.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{b.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 backdrop-blur"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-400 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/30 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Analyzing…
                </>
              ) : "Get My Playbook →"}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <p className="mt-4 text-xs text-slate-500">
            ✓ Free &nbsp;·&nbsp; ✓ PDF delivered to your inbox &nbsp;·&nbsp; ✓ No spam, ever
          </p>
        </div>
      </div>
    );
  }

  // ── Recommendations shown ──────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Success header */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-start gap-4">
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-800">Your AI Visibility Playbook is ready</p>
          {email ? (
            emailSent
              ? <p className="text-xs text-emerald-600 mt-0.5">PDF sent to <span className="font-semibold">{email}</span> — check your inbox.</p>
              : <p className="text-xs text-emerald-600 mt-0.5">PDF will be sent to <span className="font-semibold">{email}</span> shortly.</p>
          ) : null}
        </div>
        {recs && (
          <button
            onClick={() => downloadPdf(data.brand, data.overall_score, market, data.model_scores, recs, setExporting)}
            disabled={exporting}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-all disabled:opacity-40"
          >
            {exporting ? (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/></svg>
            )}
            Download PDF
          </button>
        )}
      </div>

      {/* Recs list */}
      {recs && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Visibility Playbook</p>
              <p className="text-xs text-slate-400 mt-0.5">{recs.length} recommendations · Generated by Claude</p>
            </div>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
              {data.brand}
            </span>
          </div>

          <div className="space-y-3">
            {recs.map((rec, i) => {
              const priority = PRIORITY_STYLE[rec.priority] ?? PRIORITY_STYLE.medium;
              const category = CATEGORY_STYLE[rec.category] ?? { label: rec.category, color: "bg-slate-100 text-slate-600" };
              const isOpen = expanded === i;
              return (
                <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-800">{rec.title}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priority.cls}`}>{priority.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${category.color}`}>{category.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{rec.description}</p>
                    </div>
                    <svg className={`h-4 w-4 text-slate-300 flex-shrink-0 mt-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Action Steps</p>
                      <ol className="space-y-2">
                        {rec.actions.map((action, j) => (
                          <li key={j} className="flex gap-2.5 text-sm text-slate-600 leading-relaxed">
                            <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">{j + 1}</span>
                            {action}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
