"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Dashboard from "@/components/Dashboard";
import type { Analysis, AppUser } from "@/lib/supabase";
import { TIER_LIMITS } from "@/lib/supabase";
import type { AnalyzeResponse } from "@/types";

const CANCEL_REASONS = [
  "Too expensive",
  "Not using it enough",
  "Missing features I need",
  "Switching to a competitor",
  "Technical issues",
  "Just testing / exploring",
  "Other",
];

function CancelModal({ tier, onClose, onConfirm }: {
  tier: string;
  onClose: () => void;
  onConfirm: (reason: string, note: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setLoading(true);
    await onConfirm(reason, note);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Cancel your {tier} subscription</h2>
        <p className="text-sm text-slate-500 mb-5">
          We're sorry to see you go. Let us know why — it helps us improve.
        </p>

        <div className="space-y-2 mb-4">
          {CANCEL_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left rounded-xl border px-4 py-2.5 text-sm transition-all ${
                reason === r
                  ? "border-indigo-500 bg-indigo-50 text-indigo-800 font-medium"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {reason === "Other" || reason === "Missing features I need" ? (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={reason === "Missing features I need" ? "Which features?" : "Tell us more..."}
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-4 resize-none"
          />
        ) : null}

        <div className="flex gap-3 mt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            Keep my plan
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || loading}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-all disabled:opacity-40"
          >
            {loading ? "Cancelling..." : "Confirm cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [selectedAnalysis, setSelectedAnalysis] = useState<{ data: AnalyzeResponse; market: string; previousScore?: number } | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

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

  async function handleCancelConfirm(reason: string, note: string) {
    const res = await fetch("/api/cancel-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, customNote: note }),
    });
    if (res.ok) {
      setShowCancel(false);
      setCancelDone(true);
      setAppUser((u) => u ? { ...u, tier: "free" } : u);
    } else {
      alert("Something went wrong. Please contact support.");
    }
  }

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
          <Dashboard data={selectedAnalysis.data} market={selectedAnalysis.market} fromHistory tier={tier as "free" | "pro" | "agency"} previousScore={selectedAnalysis.previousScore} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {showCancel && (
        <CancelModal
          tier={tier}
          onClose={() => setShowCancel(false)}
          onConfirm={handleCancelConfirm}
        />
      )}
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
            onClick={() => router.push("/analyze")}
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
          {(tier === "pro" || tier === "agency") && !cancelDone && (
            <button
              onClick={() => setShowCancel(true)}
              className="rounded-xl border border-red-200 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-all self-start sm:self-auto"
            >
              Cancel subscription
            </button>
          )}
          {cancelDone && (
            <span className="text-xs text-slate-400 italic self-start sm:self-auto">Subscription cancelled — active until end of billing period</span>
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
              onClick={() => router.push("/analyze")}
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
            {analyses.map((a) => {
              const brandKey = a.brand.toLowerCase().trim();
              const aTime = new Date(a.created_at).getTime();

              // Find the most recent earlier analysis of the same brand (compare by timestamp, not array index)
              const prevForBrand = analyses
                .filter(p => p.brand.toLowerCase().trim() === brandKey && new Date(p.created_at).getTime() < aTime)
                .sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime())[0];

              // Absolute point difference — scores are 0-100 so this is already interpretable
              const delta = prevForBrand
                ? Math.round(a.overall_score - prevForBrand.overall_score)
                : undefined;

              const deltaLabel = prevForBrand
                ? `vs ${new Date(prevForBrand.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                : "";

              return (
                <div
                  key={a.id}
                  onClick={() => a.result_snapshot && setSelectedAnalysis({
                    data: a.result_snapshot as unknown as AnalyzeResponse,
                    market: a.market,
                    previousScore: prevForBrand?.overall_score,
                  })}
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
                          {a.active_models.map((m) => (
                            <span key={m} className="h-2 w-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[m] ?? "#94a3b8" }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ScoreBadge score={a.overall_score} />
                    {delta !== undefined && (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          delta > 0
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : delta < 0
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : "bg-slate-50 text-slate-400 border border-slate-100"
                        }`}>
                          {delta > 0 ? "↑" : delta < 0 ? "↓" : "="}{delta > 0 ? `+${delta}` : delta === 0 ? "0" : delta}
                        </span>
                        <span className="text-[9px] text-slate-400 leading-none">{deltaLabel}</span>
                      </div>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
