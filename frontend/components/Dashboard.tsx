"use client";

import { useState, useEffect } from "react";
import type { AnalyzeResponse } from "@/types";
import ModelScoresCard from "./ModelScoresCard";
import MetricsStrip from "./MetricsStrip";
import CompetitorTable from "./CompetitorTable";
import VisibilityChart from "./VisibilityChart";
import InsightsList from "./InsightsList";
import PromptsTable from "./PromptsTable";
import RecommendationsPanel from "./RecommendationsPanel";

interface Props { data: AnalyzeResponse; market?: string; fromHistory?: boolean; locked?: boolean; tier?: "free" | "pro" | "agency"; previousScore?: number; }

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

function PremiumDashboard({ data, market = "global", fromHistory = false, locked = false, tier = "pro", previousScore }: Props) {
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
      <RecommendationsPanel data={data} market={market} historyMode={fromHistory} locked={locked} tier={tier} />

      {/* Row 4: Key findings */}
      <InsightsList insights={data.insights} />

      {/* Row 5: Raw prompt results */}
      <PromptsTable brand={data.brand} results={data.raw_results} activeModels={data.active_models} />
    </div>
  );
}

export default function Dashboard({ data, market = "global", fromHistory = false, locked = false, tier = "free", previousScore }: Props) {
  // Premium layout for Pro and Agency
  if (tier !== "free") {
    return <PremiumDashboard data={data} market={market} fromHistory={fromHistory} locked={locked} tier={tier} previousScore={previousScore} />;
  }

  // Legacy layout for free tier (landing page demo — do not touch)
  const hasCompetitors = Object.keys(data.competitor_scores).length > 0;
  const competitorOverallScores = Object.fromEntries(
    Object.entries(data.competitor_scores).map(([name, s]) => [name, s.overall])
  );
  const marketLabel = MARKET_LABELS[market] ?? market.toUpperCase();
  const scoreColor = data.overall_score >= 60 ? "text-emerald-600" : data.overall_score >= 30 ? "text-amber-500" : "text-red-500";

  return (
    <div className="space-y-5">
      <RecommendationsPanel data={data} market={market} historyMode={fromHistory} locked={locked} tier={tier} />
      <MetricsStrip data={data} />
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {fromHistory ? "Analysis Report" : "Analysis Complete"}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 truncate">{data.brand}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{data.active_models.length} AI models · {marketLabel} market</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Visibility Score</p>
            <p className={`text-3xl font-black tabular-nums leading-tight ${scoreColor}`}>
              {data.overall_score.toFixed(0)}<span className="text-base font-normal text-slate-300">/100</span>
            </p>
          </div>
        </div>
      </div>
      {hasCompetitors && <CompetitorTable data={data} />}
      <ModelScoresCard modelScores={data.model_scores} overallScore={data.overall_score} />
      {hasCompetitors && (
        <VisibilityChart
          brand={data.brand}
          brandScore={data.overall_score}
          competitorScores={competitorOverallScores}
        />
      )}
      <InsightsList insights={data.insights} />
      <PromptsTable brand={data.brand} results={data.raw_results} activeModels={data.active_models} />
    </div>
  );
}
