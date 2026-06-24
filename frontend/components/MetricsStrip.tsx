"use client";

import type { AnalyzeResponse } from "@/types";

interface Props { data: AnalyzeResponse }

export default function MetricsStrip({ data }: Props) {
  // Compute total brand mentions across all prompts & models
  const brandMentions = data.raw_results.reduce((sum, r) =>
    sum + Object.values(r.model_responses).reduce((s, mr) => s + (mr.mentions[data.brand] ?? 0), 0), 0);

  // Competitor mentions
  const compNames = Object.keys(data.competitor_scores);
  const competitorTotalMentions = compNames.reduce((acc, comp) => {
    acc[comp] = data.raw_results.reduce((sum, r) =>
      sum + Object.values(r.model_responses).reduce((s, mr) => s + (mr.mentions[comp] ?? 0), 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const allMentions = brandMentions + Object.values(competitorTotalMentions).reduce((a, b) => a + b, 0);
  const shareOfVoice = allMentions > 0 ? Math.round((brandMentions / allMentions) * 100) : 100;

  const metrics = [
    {
      label: "AI Visibility",
      value: `${data.overall_score.toFixed(0)}%`,
      sub: data.overall_score >= 60 ? "Strong" : data.overall_score >= 30 ? "Moderate" : "Low",
      color: data.overall_score >= 60 ? "emerald" : data.overall_score >= 30 ? "amber" : "red",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M3 17l4-5 4 3 4-6 4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: "Brand Mentions",
      value: brandMentions.toString(),
      sub: `across ${data.raw_results.length} prompts`,
      color: "indigo",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 20c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: "Share of Voice",
      value: compNames.length > 0 ? `${shareOfVoice}%` : "—",
      sub: compNames.length > 0 ? `vs ${compNames.length} competitor${compNames.length > 1 ? "s" : ""}` : "No competitors tracked",
      color: "violet",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: "Models Tested",
      value: data.active_models.length.toString(),
      sub: data.active_models.map(m => m.toUpperCase()).join(" · "),
      color: "slate",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; sub: string; icon: string }> = {
    emerald: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", sub: "text-emerald-500", icon: "text-emerald-500" },
    amber:   { bg: "bg-amber-50 border-amber-100",   text: "text-amber-700",   sub: "text-amber-500",   icon: "text-amber-500" },
    red:     { bg: "bg-red-50 border-red-100",       text: "text-red-700",     sub: "text-red-400",     icon: "text-red-400" },
    indigo:  { bg: "bg-indigo-50 border-indigo-100", text: "text-indigo-700",  sub: "text-indigo-400",  icon: "text-indigo-400" },
    violet:  { bg: "bg-violet-50 border-violet-100", text: "text-violet-700",  sub: "text-violet-400",  icon: "text-violet-400" },
    slate:   { bg: "bg-slate-50 border-slate-200",   text: "text-slate-700",   sub: "text-slate-400",   icon: "text-slate-400" },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metrics.map((m) => {
        const c = colorMap[m.color];
        return (
          <div key={m.label} className={`rounded-2xl border ${c.bg} px-4 py-4`}>
            <div className={`${c.icon} mb-2`}>{m.icon}</div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{m.label}</p>
            <p className={`text-2xl font-black leading-none ${c.text}`}>{m.value}</p>
            <p className={`text-[11px] mt-1 ${c.sub} truncate`}>{m.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
