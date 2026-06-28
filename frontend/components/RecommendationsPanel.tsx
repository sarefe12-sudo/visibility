"use client";

import { useState, useEffect, useRef } from "react";
import type { AnalyzeResponse } from "@/types";

async function downloadPdf(
  data: import("@/types").AnalyzeResponse,
  market: string,
  recommendations: PriorityAction[],
  perModel: ModelPlaybook[],
  setExporting: (v: boolean) => void
) {
  setExporting(true);
  try {
    const { exportFullReport } = await import("@/lib/exportPdf");
    await exportFullReport(data, market, recommendations, perModel);
  } finally {
    setExporting(false);
  }
}

interface PriorityAction {
  title: string;
  priority: "high" | "medium" | "low";
  category: "content" | "platform" | "seo" | "pr";
  description: string;
  actions: string[];
}

interface ModelPlaybook {
  model: string;
  score: number;
  status: "critical" | "weak" | "good" | "strong";
  headline: string;
  why: string;
  actions: string[];
}

interface PlaybookData {
  per_model: ModelPlaybook[];
  priority_actions: PriorityAction[];
}

interface Props {
  data: AnalyzeResponse;
  market?: string;
  historyMode?: boolean;
  locked?: boolean;
  tier?: string;
  analysisId?: string;
  savedPlaybook?: PlaybookData | null;
  previousRecommendations?: PriorityAction[];
}

const MODEL_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  claude:      { color: "#d97757", bg: "bg-orange-50",  border: "border-orange-200", label: "Claude" },
  gpt4o:       { color: "#10a37f", bg: "bg-emerald-50", border: "border-emerald-200", label: "GPT-4o" },
  gemini:      { color: "#4285f4", bg: "bg-blue-50",    border: "border-blue-200",   label: "Gemini" },
  perplexity:  { color: "#20b2aa", bg: "bg-teal-50",    border: "border-teal-200",   label: "Perplexity" },
  grok:        { color: "#a78bfa", bg: "bg-violet-50",  border: "border-violet-200", label: "Grok" },
  deepseek:    { color: "#4d6bfe", bg: "bg-indigo-50",  border: "border-indigo-200", label: "DeepSeek" },
};

const STATUS_CONFIG = {
  critical: { label: "Critical", dot: "bg-red-500",     badge: "bg-red-50 border-red-200 text-red-600" },
  weak:     { label: "Weak",     dot: "bg-amber-500",   badge: "bg-amber-50 border-amber-200 text-amber-700" },
  good:     { label: "Good",     dot: "bg-emerald-500", badge: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  strong:   { label: "Strong",   dot: "bg-emerald-600", badge: "bg-emerald-100 border-emerald-300 text-emerald-800" },
};

const PRIORITY_STYLE = {
  high:   { label: "High Impact", cls: "bg-red-50 text-red-600 border-red-200" },
  medium: { label: "Medium",      cls: "bg-amber-50 text-amber-600 border-amber-200" },
  low:    { label: "Quick Win",   cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
};

const CATEGORY_STYLE: Record<string, { label: string; color: string }> = {
  content:  { label: "Content",    color: "bg-purple-100 text-purple-600" },
  platform: { label: "Platform",   color: "bg-blue-100 text-blue-600" },
  seo:      { label: "SEO",        color: "bg-emerald-100 text-emerald-600" },
  pr:       { label: "PR & Brand", color: "bg-orange-100 text-orange-600" },
};

export default function RecommendationsPanel({ data, market = "global", historyMode = false, locked = false, tier, analysisId, savedPlaybook, previousRecommendations }: Props) {
  const [playbook, setPlaybook] = useState<PlaybookData | null>(savedPlaybook ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(savedPlaybook?.per_model?.[0]?.model ?? null);
  const [expandedAction, setExpandedAction] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const isPremium = tier === "pro" || tier === "agency";
  const autoFired = useRef(false);

  // Auto-generate unless: history view with saved playbook, or already generated
  useEffect(() => {
    if (autoFired.current) return;
    if (historyMode && savedPlaybook) return; // already have it from DB
    autoFired.current = true;
    generate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setLoading(true); setError(null);
    try {
      const body: Record<string, unknown> = {
        brand: data.brand,
        overall_score: data.overall_score,
        model_scores: data.model_scores,
        competitor_scores: data.competitor_scores,
        active_models: data.active_models,
        raw_results: data.raw_results,
        market,
      };
      // Pass previous recommendations so Claude avoids repeating already-done items
      if (previousRecommendations && previousRecommendations.length > 0) {
        body.previous_recommendations = previousRecommendations.map(r => r.title);
      }
      const res = await fetch("https://zealous-perception-production-2d31.up.railway.app/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const d: PlaybookData = await res.json();
      // Sort: worst score first (most urgency for the teaser)
      d.per_model.sort((a, b) => a.score - b.score);
      setPlaybook(d);
      // Auto-open the first (worst) model card
      if (d.per_model.length > 0) setExpandedModel(d.per_model[0].model);
      // Persist playbook to Supabase so it's available in history view
      if (analysisId && isPremium) {
        fetch("/api/analyses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis_id: analysisId,
            playbook: { ...d, generated_at: new Date().toISOString() },
          }),
        }).catch(() => {});
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // ── Spinner (all users) ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Generating your AI strategy playbook…</p>
        <p className="text-xs text-slate-400">We are analyzing each model&apos;s behaviour for {data.brand}</p>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">Analyzing in real-time</span>
        </div>
      </div>
    );
  }

  if (!playbook) {
    if (error) return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
    );
    return null;
  }

  const { per_model, priority_actions } = playbook;
  // Free users see Claude + GPT-4o each with 1 action step; remaining models blurred
  const FREE_PREVIEW_COUNT = 2;
  const FREE_ACTIONS_LIMIT = 1;
  const visibleModels = locked && !isPremium ? per_model.slice(0, FREE_PREVIEW_COUNT) : per_model;
  const lockedModels  = locked && !isPremium ? per_model.slice(FREE_PREVIEW_COUNT) : [];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 ${
        isPremium ? "border-emerald-200 bg-emerald-50" : "border-indigo-100 bg-indigo-50"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
            isPremium ? "bg-emerald-100" : "bg-indigo-100"
          }`}>
            {isPremium
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-semibold ${isPremium ? "text-emerald-800" : "text-indigo-800"}`}>
                {isPremium ? "AI Strategy Playbook" : "AI Strategy Playbook — Preview"}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />Real-time
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isPremium ? "text-emerald-600" : "text-indigo-500"}`}>
              {isPremium
                ? `${per_model.length} model strategies · ${priority_actions.length} priority actions`
                : `Free preview: ${visibleModels.length} of ${per_model.length} models · 1 action step each · Upgrade to unlock all`
              }
            </p>
          </div>
        </div>
        {isPremium && (
          <button onClick={() => downloadPdf(data, market, priority_actions, per_model, setExporting)} disabled={exporting}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-all disabled:opacity-40">
            {exporting
              ? <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/></svg>}
            <span className="flex flex-col items-start leading-tight">
              <span>Download PDF</span>
              <span className="text-[9px] font-normal text-emerald-500 opacity-80">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </span>
          </button>
        )}
      </div>

      {/* ── Per-model playbook ── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Per-Model Strategy</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPremium
                ? "Click each AI model to see tailored action steps"
                : "Each AI model learns differently — see what yours needs"}
            </p>
          </div>
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">{data.brand}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Visible model(s) */}
          {visibleModels.map((mp) => {
            const meta = MODEL_META[mp.model] ?? { color: "#94a3b8", bg: "bg-slate-50", border: "border-slate-200", label: mp.model };
            const status = STATUS_CONFIG[mp.status] ?? STATUS_CONFIG.weak;
            const isOpen = expandedModel === mp.model;

            return (
              <div key={mp.model}>
                <button
                  onClick={() => setExpandedModel(isOpen ? null : mp.model)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: meta.color }}>
                    {meta.label.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{meta.label}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{mp.headline}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-extrabold" style={{ color: meta.color }}>{mp.score.toFixed(0)}</span>
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                    <svg className={`h-4 w-4 text-slate-300 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </button>

                {isOpen && (
                  <div className={`px-5 pb-5 pt-1 border-t ${meta.border} ${meta.bg}`}>
                    <div className="rounded-xl border border-white/60 bg-white/70 px-4 py-3 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: meta.color }}>
                        Why {meta.label} scores {mp.score.toFixed(0)}/100
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">{mp.why}</p>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Action Steps for {meta.label}</p>
                    <ol className="space-y-2">
                      {mp.actions.map((action, i) => {
                        const isHidden = locked && !isPremium && i >= FREE_ACTIONS_LIMIT;
                        return (
                          <li key={i} className={`flex gap-2.5 text-sm leading-relaxed transition-all ${isHidden ? "pointer-events-none select-none blur-sm opacity-50" : "text-slate-700"}`}>
                            <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: meta.color }}>{i + 1}</span>
                            {action}
                          </li>
                        );
                      })}
                    </ol>
                    {locked && !isPremium && mp.actions.length > FREE_ACTIONS_LIMIT && (
                      <p className="mt-2 text-[11px] text-indigo-500 font-semibold">
                        +{mp.actions.length - FREE_ACTIONS_LIMIT} more steps — <a href="/sign-up" className="underline">unlock with Pro</a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Blurred locked models (free users) */}
          {lockedModels.length > 0 && (
            <div className="relative">
              {/* Show 2 blurred ghost cards */}
              {lockedModels.slice(0, 2).map((mp) => {
                const meta = MODEL_META[mp.model] ?? { color: "#94a3b8", bg: "bg-slate-50", border: "border-slate-200", label: mp.model };
                const status = STATUS_CONFIG[mp.status] ?? STATUS_CONFIG.weak;
                return (
                  <div key={mp.model} className="pointer-events-none select-none" style={{ filter: "blur(4px)" }}>
                    <div className="w-full flex items-center gap-4 px-5 py-4 border-t border-slate-100">
                      <div className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: meta.color }}>{meta.label.slice(0, 2)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{meta.label}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />{status.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{mp.headline}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-extrabold" style={{ color: meta.color }}>{mp.score.toFixed(0)}</span>
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Upgrade overlay */}
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(248,250,252,0.85) 30%, #f8fafc 100%)" }}>
                <div className="mx-auto max-w-sm w-full px-4 pb-4">
                  <div className="rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-100/50 p-6 text-center">
                    {/* Model pills of locked ones */}
                    <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                      {lockedModels.map((mp) => {
                        const meta = MODEL_META[mp.model] ?? { color: "#94a3b8", label: mp.model };
                        return (
                          <span key={mp.model} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border"
                            style={{ backgroundColor: meta.color + "15", borderColor: meta.color + "40", color: meta.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                            {meta.label}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-base font-extrabold text-slate-900 mb-1">
                      +{lockedModels.length} more model strategies locked
                    </p>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                      Each AI model learns from different sources — Gemini reads your Google footprint,
                      Perplexity searches the web right now, Grok watches X/Twitter live.
                      <br /><strong className="text-slate-700">Get a tailored strategy for every single one.</strong>
                    </p>
                    <a href="/pricing"
                      className="block w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
                      Upgrade to Pro — $49/mo →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Priority Actions (Pro/Agency only, or blurred for free) ── */}
      {isPremium && priority_actions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Priority Actions</p>
            <p className="text-xs text-slate-400 mt-0.5">High-impact steps that improve visibility across all AI models</p>
          </div>
          <div className="p-5 space-y-3">
            {priority_actions.map((rec, i) => {
              const priority = PRIORITY_STYLE[rec.priority] ?? PRIORITY_STYLE.medium;
              const category = CATEGORY_STYLE[rec.category] ?? { label: rec.category, color: "bg-slate-100 text-slate-600" };
              const isOpen = expandedAction === i;
              return (
                <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <button onClick={() => setExpandedAction(isOpen ? null : i)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
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

      {/* For free/locked users: blurred Priority Actions teaser */}
      {!isPremium && priority_actions.length > 0 && (
        <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Priority Actions</p>
            <p className="text-xs text-slate-400 mt-0.5">Cross-model recommendations with highest impact</p>
          </div>
          <div className="p-5 space-y-3 pointer-events-none select-none" style={{ filter: "blur(5px)" }}>
            {priority_actions.slice(0, 2).map((rec, i) => {
              const priority = PRIORITY_STYLE[rec.priority] ?? PRIORITY_STYLE.medium;
              return (
                <div key={i} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800">{rec.title}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priority.cls}`}>{priority.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{rec.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <div className="text-center px-6">
              <div className="h-10 w-10 rounded-2xl border border-indigo-200 bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#6366f1" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <p className="text-sm font-extrabold text-slate-900 mb-1">{priority_actions.length} priority actions locked</p>
              <p className="text-xs text-slate-500 mb-4">Cross-model improvements that boost your score on every AI</p>
              <a href="/pricing" className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all">
                Unlock with Pro →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
