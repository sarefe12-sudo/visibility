"use client";

import { useState } from "react";
import type { AnalyzeResponse } from "@/types";
import ModelScoresCard from "./ModelScoresCard";
import MetricsStrip from "./MetricsStrip";
import CompetitorTable from "./CompetitorTable";
import VisibilityChart from "./VisibilityChart";
import InsightsList from "./InsightsList";
import PromptsTable from "./PromptsTable";
import RecommendationsPanel from "./RecommendationsPanel";

interface Props { data: AnalyzeResponse; market?: string; fromHistory?: boolean; }

const MARKET_LABELS: Record<string, string> = {
  global: "Global", TR: "Turkey", US: "USA", GB: "UK", DE: "Germany",
  FR: "France", ES: "Spain", IT: "Italy", JP: "Japan", CN: "China",
};

export default function Dashboard({ data, market = "global", fromHistory = false }: Props) {
  const [exporting, setExporting] = useState(false);
  const hasCompetitors = Object.keys(data.competitor_scores).length > 0;
  const competitorOverallScores = Object.fromEntries(
    Object.entries(data.competitor_scores).map(([name, s]) => [name, s.overall])
  );
  const marketLabel = MARKET_LABELS[market] ?? market.toUpperCase();
  const scoreColor = data.overall_score >= 60 ? "text-emerald-600" : data.overall_score >= 30 ? "text-amber-500" : "text-red-500";

  async function handleExportPdf() {
    setExporting(true);
    try { const { exportDashboardPdf } = await import("@/lib/exportPdf"); await exportDashboardPdf(data, market); }
    finally { setExporting(false); }
  }

  return (
    <div className="space-y-5">

      {/* ── Recommendations (top of page) ───────────────────────────────── */}
      <RecommendationsPanel data={data} market={market} historyMode={fromHistory} />

      {/* ── Metrics strip ───────────────────────────────────────────────── */}
      <MetricsStrip data={data} />

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {fromHistory ? "Analysis Report" : "Analysis Complete"}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 truncate">{data.brand}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {data.active_models.length} AI models · {marketLabel} market
          </p>
        </div>
        <div className="flex items-center gap-3">
          {fromHistory && (
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40"
            >
              {exporting ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/></svg>
              )}
              Download PDF
            </button>
          )}
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Visibility Score</p>
            <p className={`text-3xl font-black tabular-nums leading-tight ${scoreColor}`}>
              {data.overall_score.toFixed(0)}<span className="text-base font-normal text-slate-300">/100</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Competitor table (replaces old gap card) ────────────────────── */}
      {hasCompetitors && <CompetitorTable data={data} />}

      {/* ── Model scores ────────────────────────────────────────────────── */}
      <ModelScoresCard modelScores={data.model_scores} overallScore={data.overall_score} />

      {/* ── Competitor chart ────────────────────────────────────────────── */}
      {hasCompetitors && (
        <VisibilityChart
          brand={data.brand}
          brandScore={data.overall_score}
          competitorScores={competitorOverallScores}
        />
      )}

      {/* ── Insights ────────────────────────────────────────────────────── */}
      <InsightsList insights={data.insights} />

      {/* ── Raw results table ───────────────────────────────────────────── */}
      <PromptsTable brand={data.brand} results={data.raw_results} activeModels={data.active_models} />

    </div>
  );
}
