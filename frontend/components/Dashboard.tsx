"use client";

import React, { useState, useEffect } from "react";
import type { AnalyzeResponse } from "@/types";
import ModelScoresCard from "./ModelScoresCard";
import MetricsStrip from "./MetricsStrip";
import CompetitorTable from "./CompetitorTable";
import VisibilityChart from "./VisibilityChart";
import InsightsList from "./InsightsList";
import PromptsTable from "./PromptsTable";
import RecommendationsPanel from "./RecommendationsPanel";
import ContentStudioPanel from "./ContentStudioPanel";
import SiteOptimizationPanel from "./SiteOptimizationPanel";

interface SavedPlaybook {
  per_model: { model: string; score: number; status: string; headline: string; why: string; actions: string[] }[];
  priority_actions: { title: string; priority: string; category: string; description: string; actions: string[] }[];
  generated_at?: string;
}

interface Props { data: AnalyzeResponse; market?: string; fromHistory?: boolean; locked?: boolean; tier?: "free" | "pro" | "agency"; previousScore?: number; analysisId?: string; savedPlaybook?: SavedPlaybook | null; previousRecommendations?: SavedPlaybook['priority_actions']; website?: string; }

const MARKET_LABELS: Record<string, string> = {
  global: "Global", TR: "Turkey", US: "USA", GB: "UK", DE: "Germany",
  FR: "France", ES: "Spain", IT: "Italy", JP: "Japan", CN: "China",
};

const MODEL_COLORS: Record<string, string> = {
  claude: "#d97757", gpt4o: "#10a37f", gemini: "#4285f4",
  perplexity: "#20b2aa", grok: "#a78bfa", deepseek: "#4d6bfe",
};
const MODEL_LABELS: Record<string, string> = {
  claude: "Claude", gpt4o: "GPT-4o", gemini: "Gemini",
  perplexity: "Perplexity", grok: "Grok", deepseek: "DeepSeek",
};
const COMP_COLORS = ["#10a37f", "#94a3b8", "#f59e0b", "#f43f5e", "#8b5cf6"];

function PremiumDashboard({ data, market = "global", fromHistory = false, locked = false, tier = "pro", previousScore, analysisId, savedPlaybook, previousRecommendations, website }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const marketLabel = MARKET_LABELS[market] ?? market.toUpperCase();
  const delta = previousScore !== undefined ? Math.round(data.overall_score - previousScore) : undefined;
  const hasCompetitors = Object.keys(data.competitor_scores).length > 0;
  const modelEntries = Object.entries(data.model_scores);

  // Competitor data: user's brand + all competitors sorted by score desc
  const competitorEntries = Object.entries(data.competitor_scores).map(([name, s]) => ({
    name,
    score: s.overall,
    you: false,
  }));
  const allBrands = [
    { name: data.brand, score: data.overall_score, you: true, color: "#6366f1" },
    ...competitorEntries.map((c, i) => ({ ...c, color: COMP_COLORS[i] ?? "#94a3b8" })),
  ].sort((a, b) => b.score - a.score);

  // Sentiment
  const summary = data.sentiment_summary;
  const sentimentTotal = summary.positive + summary.neutral + summary.negative;
  const sPct = (n: number) => sentimentTotal > 0 ? Math.round((n / sentimentTotal) * 100) : 0;
  const dominant =
    summary.positive >= summary.neutral && summary.positive >= summary.negative ? "positive" :
    summary.negative > summary.positive && summary.negative >= summary.neutral ? "negative" : "neutral";

  // Find insight about competitor gap (like DemoPreview's amber callout)
  const gapInsight = (() => {
    if (!hasCompetitors || modelEntries.length === 0) return null;
    const topComp = competitorEntries[0];
    if (!topComp || topComp.score <= data.overall_score) return null;
    const diff = Math.round(topComp.score - data.overall_score);
    return `${topComp.name} is ${diff} points ahead of you overall`;
  })();

  return (
    <div className="space-y-4">

      {/* Row 1: Score card + Model scores */}
      <div className="grid gap-4 sm:grid-cols-[240px_1fr]">

        {/* Score card — dark indigo gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-200/50">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">AI Visibility Score</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-6xl font-black leading-none tabular-nums">{data.overall_score.toFixed(0)}</span>
            <div className="mb-1 flex flex-col items-start gap-1.5">
              <span className="text-indigo-300 text-lg">/100</span>
              {delta !== undefined && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${
                  delta > 0
                    ? "bg-emerald-400/20 border-emerald-400/30 text-emerald-300"
                    : delta < 0
                      ? "bg-rose-400/20 border-rose-400/30 text-rose-300"
                      : "bg-white/10 border-white/20 text-indigo-200"
                }`}>
                  {delta > 0 ? "↑" : delta < 0 ? "↓" : "="} {delta > 0 ? `+${delta}` : delta === 0 ? "No change" : delta}
                </span>
              )}
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-white/20 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-white/80 transition-all duration-1000"
              style={{ width: animated ? `${data.overall_score}%` : "0%" }}
            />
          </div>
          <p className="text-xs text-indigo-200">
            {data.brand} · {marketLabel} · {data.active_models.length} AI models
          </p>
        </div>

        {/* Per-model scores */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Per-Model Score</p>
          <div className="space-y-3">
            {modelEntries.map(([key, score], i) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 w-24 flex-shrink-0">{MODEL_LABELS[key] ?? key}</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: animated ? `${score}%` : "0%",
                      backgroundColor: MODEL_COLORS[key] ?? "#94a3b8",
                      transitionDelay: `${i * 100 + 200}ms`,
                    }}
                  />
                </div>
                <span className="text-sm font-black text-slate-700 w-7 text-right tabular-nums">{score.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Competitor comparison + Sentiment */}
      {(hasCompetitors || sentimentTotal > 0) && (
        <div className={`grid gap-4 ${hasCompetitors && sentimentTotal > 0 ? "sm:grid-cols-[1fr_280px]" : ""}`}>

          {/* Brand comparison */}
          {hasCompetitors && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Brand Comparison</p>
              <div className="space-y-3">
                {allBrands.map((b, i) => (
                  <div key={b.name} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${b.you ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50"}`}>
                    <div className="flex items-center gap-2 w-32 flex-shrink-0">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ backgroundColor: b.color }}>
                        {b.name[0].toUpperCase()}
                      </div>
                      <span className={`text-xs font-bold truncate ${b.you ? "text-indigo-700" : "text-slate-600"}`}>{b.name}</span>
                      {b.you && <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-black text-white flex-shrink-0">YOU</span>}
                    </div>
                    <div className="flex-1 h-3 rounded-full bg-slate-200/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: animated ? `${b.score}%` : "0%",
                          backgroundColor: b.color,
                          transitionDelay: `${i * 150 + 400}ms`,
                        }}
                      />
                    </div>
                    <span className={`text-base font-black w-8 text-right tabular-nums ${b.you ? "text-indigo-600" : "text-slate-400"}`}>{b.score.toFixed(0)}</span>
                  </div>
                ))}
              </div>
              {gapInsight && (
                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <p className="text-[11px] text-amber-700 font-semibold">{gapInsight}</p>
                </div>
              )}
            </div>
          )}

          {/* Sentiment */}
          {summary && sentimentTotal > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand Sentiment</p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  dominant === "positive" ? "border-emerald-200 bg-emerald-50 text-emerald-600" :
                  dominant === "negative" ? "border-rose-200 bg-rose-50 text-rose-600" :
                  "border-slate-200 bg-slate-50 text-slate-500"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dominant === "positive" ? "bg-emerald-400" : dominant === "negative" ? "bg-rose-400" : "bg-slate-400"}`} />
                  {dominant.charAt(0).toUpperCase() + dominant.slice(1)}
                </span>
              </div>
              <div className="space-y-3 mb-4">
                {([
                  { key: "positive" as const, label: "Positive", bar: "bg-emerald-500", text: "text-emerald-600" },
                  { key: "neutral" as const, label: "Neutral", bar: "bg-slate-300", text: "text-slate-500" },
                  { key: "negative" as const, label: "Negative", bar: "bg-rose-400", text: "text-rose-600" },
                ]).map((s, i) => (
                  <div key={s.key} className="space-y-1">
                    <div className="flex justify-between">
                      <span className={`text-[11px] font-semibold ${s.text}`}>{s.label}</span>
                      <span className="text-[11px] font-black text-slate-600 tabular-nums">{sPct(summary[s.key])}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.bar} transition-all duration-1000`}
                        style={{ width: animated ? `${sPct(summary[s.key])}%` : "0%", transitionDelay: `${i * 120 + 600}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  AI models describe <span className="font-bold text-slate-700">{data.brand}</span>{" "}
                  <span className={dominant === "positive" ? "font-bold text-emerald-600" : dominant === "negative" ? "font-bold text-rose-600" : "font-bold text-slate-600"}>
                    {dominant}ly
                  </span>{" "}
                  in {sPct(summary[dominant])}% of responses where it's mentioned.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 3: Recommendations */}
      <RecommendationsPanel data={data} market={market} historyMode={fromHistory} locked={locked} tier={tier} analysisId={analysisId}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        savedPlaybook={savedPlaybook as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        previousRecommendations={previousRecommendations as any}
      />

      {/* Row 4: Content Studio */}
      <ContentStudioPanel
        data={data}
        market={market}
        tier={tier}
        analysisId={analysisId}
        playbook={savedPlaybook}
      />

      {/* Row 5: Site AI Optimization */}
      <SiteOptimizationPanel
        brand={data.brand}
        websiteHint={website}
        tier={tier}
      />

      {/* Row 5: Key findings */}
      <InsightsList insights={data.insights} />

      {/* Row 5: Raw prompt results */}
      <PromptsTable brand={data.brand} results={data.raw_results} activeModels={data.active_models} />
    </div>
  );
}

// ── Lock overlay for blurred sections ────────────────────────────────────────
function LockedSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="pointer-events-none select-none blur-sm opacity-60 p-5">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px]">
        <div className="text-center px-6">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
            <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <p className="text-sm font-bold text-slate-800 mb-1">{title}</p>
          <p className="text-xs text-slate-500 max-w-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ data, market = "global", fromHistory = false, locked = false, tier = "free", previousScore, analysisId, savedPlaybook, previousRecommendations, website }: Props) {
  // Premium layout for Pro and Agency
  if (tier !== "free") {
    return <PremiumDashboard data={data} market={market} fromHistory={fromHistory} locked={locked} tier={tier} previousScore={previousScore} analysisId={analysisId} savedPlaybook={savedPlaybook} previousRecommendations={previousRecommendations} website={website} />;
  }

  // ── Free tier — sales-optimized layout ────────────────────────────────────
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const sc = data.overall_score;
  const ALL_MODELS = ["claude", "gpt4o", "gemini", "perplexity", "grok", "deepseek"];
  const testedModels = data.active_models;
  const missingCount = ALL_MODELS.length - testedModels.length;
  const hasCompetitors = Object.keys(data.competitor_scores).length > 0;

  const competitorEntries = Object.entries(data.competitor_scores).map(([name, s]) => ({ name, score: s.overall }));
  const topComp = competitorEntries[0];
  const gap = topComp && topComp.score > sc ? Math.round(topComp.score - sc) : null;

  const urgencyColor = sc >= 60 ? "from-emerald-600 to-teal-600" : sc >= 30 ? "from-amber-500 to-orange-600" : "from-red-600 to-rose-600";
  const urgencyLabel = sc >= 60 ? "You have a solid AI presence — but gaps remain." : sc >= 30 ? "Your brand is partially visible — competitors are pulling ahead." : "Your brand is nearly invisible to AI models.";

  const summary = data.sentiment_summary;
  const sentimentTotal = summary.positive + summary.neutral + summary.negative;

  return (
    <div className="space-y-4 pb-24">

      {/* ── 1. Score banner ── */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${urgencyColor} text-white p-6`}>
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">AI Visibility Score</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-7xl font-black leading-none tabular-nums">{sc.toFixed(0)}</span>
              <span className="text-2xl text-white/50 mb-1">/100</span>
            </div>
            <p className="text-sm font-semibold text-white/80">{urgencyLabel}</p>
          </div>
          <div className="sm:ml-auto flex flex-col gap-2 sm:text-right">
            <div className="rounded-xl bg-white/15 border border-white/20 px-4 py-3">
              <p className="text-xs font-bold text-white/70 mb-0.5">Tested on</p>
              <p className="text-sm font-black">{testedModels.length} of 6 AI models</p>
            </div>
            {gap && (
              <div className="rounded-xl bg-black/20 border border-white/10 px-4 py-3">
                <p className="text-xs font-bold text-white/70 mb-0.5">Competitor gap</p>
                <p className="text-sm font-black text-red-200">{topComp.name} is +{gap} pts ahead</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. All 6 model scores — 2 real, rest locked ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Model Scores</p>
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">{testedModels.length}/6 models tested · Upgrade to test all</span>
        </div>
        <div className="space-y-3">
          {ALL_MODELS.map((key, i) => {
            const score = data.model_scores[key];
            const isTested = testedModels.includes(key);
            const label = MODEL_LABELS[key] ?? key;
            const color = MODEL_COLORS[key] ?? "#94a3b8";
            return (
              <div key={key} className={`flex items-center gap-3 ${!isTested ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-2 w-24 flex-shrink-0">
                  {!isTested && <svg className="h-3 w-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>}
                  <span className="text-xs font-bold text-slate-600">{label}</span>
                </div>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  {isTested ? (
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: animated ? `${score}%` : "0%", backgroundColor: color, transitionDelay: `${i * 100}ms` }} />
                  ) : (
                    <div className="h-full rounded-full bg-slate-200 animate-pulse" style={{ width: "60%" }} />
                  )}
                </div>
                {isTested ? (
                  <span className="text-sm font-black text-slate-700 w-7 text-right tabular-nums">{score.toFixed(0)}</span>
                ) : (
                  <span className="text-xs font-bold text-slate-300 w-7 text-right">—</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
          <p className="text-xs text-indigo-700 font-medium">Upgrade to test all 6 models — Gemini, Perplexity, Grok & DeepSeek scores unlocked.</p>
        </div>
      </div>

      {/* ── 3. Playbook (RecommendationsPanel handles free preview internally) ── */}
      <RecommendationsPanel data={data} market={market} historyMode={fromHistory} locked={locked} tier={tier} />

      {/* ── 4. Competitor section ── */}
      {hasCompetitors ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Competitor Analysis</p>
          <div className="space-y-2.5 mb-4">
            {([{ name: data.brand, score: sc, you: true as const }, ...competitorEntries.slice(0, 2).map(c => ({ ...c, you: false as const }))]).map((b, i) => (
              <div key={b.name} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${b.you ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50"}`}>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ backgroundColor: b.you ? "#6366f1" : COMP_COLORS[i] ?? "#94a3b8" }}>
                  {b.name[0].toUpperCase()}
                </div>
                <span className={`text-xs font-bold flex-1 truncate ${b.you ? "text-indigo-700" : "text-slate-600"}`}>{b.name}{b.you ? " (YOU)" : ""}</span>
                <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: animated ? `${b.score}%` : "0%", backgroundColor: b.you ? "#6366f1" : COMP_COLORS[i] ?? "#94a3b8" }} />
                </div>
                <span className={`text-sm font-black w-7 text-right ${b.you ? "text-indigo-600" : "text-slate-400"}`}>{b.score.toFixed(0)}</span>
              </div>
            ))}
            {competitorEntries.length > 2 && (
              <LockedSection title="More competitors hidden" description="Upgrade to see all competitor breakdowns per model.">
                <div className="space-y-2">
                  {competitorEntries.slice(2).map((c) => (
                    <div key={c.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-50">
                      <div className="h-7 w-7 rounded-lg bg-slate-300 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-600 flex-1">{c.name}</span>
                      <span className="text-sm font-black text-slate-400">{c.score.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </LockedSection>
            )}
          </div>
          {gap && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p className="text-xs text-amber-700 font-semibold">{topComp.name} is {gap} points ahead — upgrade to see the per-model breakdown and fix it.</p>
            </div>
          )}
        </div>
      ) : (
        <LockedSection title="Competitor Analysis" description="See how you stack up against your top 5 competitors across all 6 AI models.">
          <div className="p-5 space-y-2">
            {["Competitor A", "Competitor B", "Competitor C"].map((n, i) => (
              <div key={n} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-50">
                <div className="h-7 w-7 rounded-lg bg-slate-300 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-600 flex-1">{n}</span>
                <div className="w-24 h-2 rounded-full bg-slate-200" />
                <span className="text-sm font-black text-slate-400">{[71, 45, 28][i]}</span>
              </div>
            ))}
          </div>
        </LockedSection>
      )}

      {/* ── 5. Sentiment — locked ── */}
      <LockedSection title="Brand Sentiment Analysis" description="Find out whether AI models describe your brand positively, neutrally, or negatively — and in how many responses.">
        <div className="p-5 space-y-3">
          {[{ label: "Positive", pct: 58, color: "bg-emerald-400" }, { label: "Neutral", pct: 31, color: "bg-slate-300" }, { label: "Negative", pct: 11, color: "bg-red-400" }].map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-600">{s.label}</span><span className="font-bold text-slate-500">{s.pct}%</span></div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} /></div>
            </div>
          ))}
        </div>
      </LockedSection>

      {/* ── 6. Content Studio — locked ── */}
      <LockedSection title="AI Content Studio" description="Generate 5 AI-optimized blog posts targeting your specific visibility gaps. Built to get cited by ChatGPT, Claude, and Gemini.">
        <div className="p-5 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">5 articles ready to generate</p>
          {["Why AI Models Recommend {Brand}: A 2025 Guide", "How to Improve Your AI Visibility Score", "AI Share of Voice: What It Is and Why It Matters"].map((t) => (
            <div key={t} className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">{t.replace("{Brand}", data.brand)}</span>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">Generate</span>
            </div>
          ))}
        </div>
      </LockedSection>

      {/* ── 7. Site Audit — locked ── */}
      <LockedSection title="AI-Readiness Site Audit" description="We scan your website across 10 AI signals and tell you exactly what to fix to improve how AI models read and trust your brand.">
        <div className="p-5 space-y-2">
          {["Structured Data (Schema.org)", "Content Depth", "Brand Consistency", "AI Meta Signals", "Sitemap XML"].map((item, i) => (
            <div key={item} className="flex items-center gap-3">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${[true, false, false, false, true][i] ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>{[true, false, false, false, true][i] ? "✓" : "✗"}</span>
              <span className="text-xs text-slate-600 flex-1">{item}</span>
              <span className={`text-xs font-bold ${[true, false, false, false, true][i] ? "text-emerald-600" : "text-red-500"}`}>{[90, 40, 35, 25, 100][i]}/100</span>
            </div>
          ))}
        </div>
      </LockedSection>

    </div>
  );
}
