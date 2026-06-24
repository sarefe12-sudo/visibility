"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Dashboard from "@/components/Dashboard";
import type { Analysis, AppUser } from "@/lib/supabase";
import { TIER_LIMITS } from "@/lib/supabase";
import type { AnalyzeResponse } from "@/types";

const MODEL_COLORS: Record<string, string> = {
  claude: "#d97757", gpt4o: "#10a37f", gemini: "#4285f4",
  perplexity: "#20b2aa", grok: "#a78bfa", deepseek: "#4d6bfe",
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 60 ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : score >= 30 ? "bg-amber-50 text-amber-700 border-amber-100"
    : "bg-red-50 text-red-600 border-red-100";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${color}`}>
      {score.toFixed(0)}
    </span>
  );
}

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<{ data: AnalyzeResponse; market: string } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/"); return; }

    async function load() {
      const [userRes, analysesRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/analyses"),
      ]);
      const { user: u } = await userRes.json();
      const { analyses: a } = await analysesRes.json();
      setAppUser(u);
      setAnalyses(a ?? []);
      setLoading(false);
    }
    load();
  }, [isLoaded, isSignedIn, router]);

  const tier = appUser?.tier ?? "free";
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
  const usedAnalyses = appUser?.analyses_count ?? 0;

  // ── Full report modal ────────────────────────────────────────────────────
  if (selectedAnalysis) {
    return (
      <main className="min-h-screen bg-slate-50">
        <AppHeader onLogoClick={() => router.push("/")} />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-24 pb-20">
          <button
            onClick={() => setSelectedAnalysis(null)}
            className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Dashboard
          </button>
          <Dashboard data={selectedAnalysis.data} market={selectedAnalysis.market} fromHistory />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader onLogoClick={() => router.push("/")} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-24 pb-20">

        {/* Welcome row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Your AI visibility analysis history</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all self-start sm:self-auto"
          >
            + New Analysis
          </button>
        </div>

        {/* Tier card */}
        <div className={`rounded-2xl border p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          tier === "free" ? "border-slate-200 bg-white" :
          tier === "pro" ? "border-indigo-100 bg-indigo-50" :
          "border-slate-800 bg-slate-900"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
              tier === "free" ? "bg-slate-100" : tier === "pro" ? "bg-indigo-100" : "bg-slate-700"
            }`}>
              {tier === "free" ? "🆓" : tier === "pro" ? "⚡" : "🏢"}
            </div>
            <div>
              <p className={`text-sm font-bold capitalize ${tier === "agency" ? "text-white" : "text-slate-800"}`}>
                {tier} Plan
              </p>
              <p className={`text-xs ${tier === "agency" ? "text-slate-400" : "text-slate-500"}`}>
                {tier === "free"
                  ? `${usedAnalyses} / ${limits.analyses} analyses used`
                  : `${usedAnalyses} analyses total · ${limits.prompts} prompts/analysis`}
              </p>
            </div>
          </div>
          {tier === "free" && (
            <button
              onClick={() => router.push("/pricing")}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all self-start sm:self-auto"
            >
              Upgrade to Pro →
            </button>
          )}
        </div>

        {/* Analysis list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="h-6 w-6 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : analyses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-2xl mb-3">📊</p>
            <p className="text-sm font-semibold text-slate-700 mb-1">No analyses yet</p>
            <p className="text-xs text-slate-400 mb-5">Run your first AI visibility check</p>
            <button
              onClick={() => router.push("/")}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
            >
              Start Analysis
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {analyses.length} {analyses.length === 1 ? "analysis" : "analyses"}
              {limits.history_days > 0 ? ` · last ${limits.history_days} days` : ""}
            </p>
            {analyses.map((a) => (
              <div
                key={a.id}
                onClick={() => a.result_snapshot && setSelectedAnalysis({ data: a.result_snapshot as unknown as AnalyzeResponse, market: a.market })}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-extrabold text-slate-600">
                    {a.brand[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.brand}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">{a.market.toUpperCase()}</span>
                      <span className="text-slate-200">·</span>
                      <span className="text-xs text-slate-400">{a.prompt_count} prompts</span>
                      {a.competitor_count > 0 && (
                        <>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{a.competitor_count} competitors</span>
                        </>
                      )}
                      <span className="text-slate-200">·</span>
                      <div className="flex gap-1">
                        {a.active_models.slice(0, 4).map((m) => (
                          <span key={m} className="h-2 w-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[m] ?? "#94a3b8" }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <ScoreBadge score={a.overall_score} />
                  <span className="text-xs text-slate-400">
                    {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
