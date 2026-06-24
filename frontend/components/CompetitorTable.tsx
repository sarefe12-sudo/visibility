"use client";

import type { AnalyzeResponse } from "@/types";

interface Props { data: AnalyzeResponse }

export default function CompetitorTable({ data }: Props) {
  const compNames = Object.keys(data.competitor_scores);
  if (compNames.length === 0) return null;

  // Compute mentions per entity
  function getMentions(name: string) {
    return data.raw_results.reduce((sum, r) =>
      sum + Object.values(r.model_responses).reduce((s, mr) => s + (mr.mentions[name] ?? 0), 0), 0);
  }

  const brandMentions = getMentions(data.brand);
  const compMentions: Record<string, number> = {};
  compNames.forEach(c => { compMentions[c] = getMentions(c); });
  const totalMentions = brandMentions + Object.values(compMentions).reduce((a, b) => a + b, 0);

  function sov(mentions: number) {
    return totalMentions > 0 ? Math.round((mentions / totalMentions) * 100) : 0;
  }

  const rows = [
    { name: data.brand, isBrand: true, mentions: brandMentions, visibility: data.overall_score },
    ...compNames.map(c => ({ name: c, isBrand: false, mentions: compMentions[c], visibility: data.competitor_scores[c].overall })),
  ].sort((a, b) => b.visibility - a.visibility);

  const maxVis = Math.max(...rows.map(r => r.visibility), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Competitor Comparison</p>
          <p className="text-xs text-slate-500 mt-0.5">{compNames.length + 1} brands · {data.active_models.length} AI models</p>
        </div>
        <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Share of Voice</span>
      </div>

      <div className="divide-y divide-slate-50">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_80px_80px_120px_64px] gap-2 px-5 py-2.5 bg-slate-50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brand</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Mentions</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Share</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visibility</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Score</span>
        </div>

        {rows.map((row) => {
          const share = sov(row.mentions);
          const barW = Math.round((row.visibility / maxVis) * 100);
          const isWinning = row.isBrand;
          return (
            <div key={row.name} className={`grid grid-cols-[1fr_80px_80px_120px_64px] gap-2 items-center px-5 py-3.5 ${isWinning ? "bg-indigo-50/40" : "hover:bg-slate-50"} transition-colors`}>
              {/* Brand name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${isWinning ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {row.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${isWinning ? "text-indigo-700" : "text-slate-700"}`}>{row.name}</p>
                  {isWinning && <p className="text-[10px] text-indigo-400 font-medium">YOU</p>}
                </div>
              </div>

              {/* Mentions */}
              <span className={`text-sm font-bold text-right ${isWinning ? "text-indigo-700" : "text-slate-600"}`}>{row.mentions}</span>

              {/* Share of Voice */}
              <span className={`text-sm font-bold text-right ${isWinning ? "text-indigo-700" : "text-slate-500"}`}>{share}%</span>

              {/* Visibility bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isWinning ? "bg-indigo-500" : "bg-slate-300"}`}
                    style={{ width: `${barW}%` }}
                  />
                </div>
              </div>

              {/* Score */}
              <span className={`text-sm font-black text-right tabular-nums ${isWinning ? "text-indigo-600" : "text-slate-500"}`}>
                {row.visibility.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
