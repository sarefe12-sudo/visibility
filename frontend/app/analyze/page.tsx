"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import BrandForm from "@/components/BrandForm";
import PromptEditor from "@/components/PromptEditor";
import Dashboard from "@/components/Dashboard";
import AppHeader from "@/components/AppHeader";
import StepIndicator from "@/components/StepIndicator";
import ShareModal from "@/components/ShareModal";
import type { Competitor, AnalyzeResponse, PromptWithTrend } from "@/types";
import type { Analysis } from "@/lib/supabase";
import { TIER_LIMITS } from "@/lib/supabase";

const MODEL_COLORS: Record<string, string> = {
  claude: "#d97757", gpt4o: "#10a37f", gemini: "#4285f4",
  perplexity: "#20b2aa", grok: "#a78bfa", deepseek: "#4d6bfe",
};

type Step = "form" | "prompts" | "results";

export default function AnalyzePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [brand, setBrand] = useState("");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [promptsWithTrend, setPromptsWithTrend] = useState<PromptWithTrend[]>([]);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [market, setMarket] = useState("global");
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [appUser, setAppUser] = useState<{ id: string; tier: string; analyses_count: number } | null>(null);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [pastAnalyses, setPastAnalyses] = useState<Analysis[]>([]);
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | undefined>(undefined);
  const [previousRecommendations, setPreviousRecommendations] = useState<{ title: string; priority: string; category: string; description: string; actions: string[] }[]>([]);
  const [shareTarget, setShareTarget] = useState<{ id: string; brand: string; score: number; market: string } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    async function load() {
      const [userRes, analysesRes] = await Promise.all([
        fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user!.primaryEmailAddress?.emailAddress, name: user!.fullName }),
        }),
        fetch("/api/analyses"),
      ]);
      const { user: u } = await userRes.json();
      const { monthly_count, analyses } = await analysesRes.json();
      setAppUser(u);
      setMonthlyCount(monthly_count ?? 0);
      setPastAnalyses(analyses ?? []);
    }
    load();
  }, [isSignedIn, user]);

  const tier = (appUser?.tier ?? "free") as keyof typeof TIER_LIMITS;
  const limits = TIER_LIMITS[tier];
  const remaining = tier === "free"
    ? limits.analyses - (appUser?.analyses_count ?? 0)
    : limits.analyses - monthlyCount;
  const isAtLimit = remaining <= 0;

  const now = new Date();
  const firstOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilReset = Math.ceil((firstOfNext.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  async function handleGenerate(b: string, website: string, comps: Competitor[], selectedMarket: string) {
    if (isAtLimit) {
      setError(
        tier === "free"
          ? "You've used your free analysis. Upgrade to Pro for 10 analyses/month."
          : `Monthly limit reached (${limits.analyses} analyses). Resets on the 1st.`
      );
      return;
    }
    setMarket(selectedMarket);
    setGeneratingPrompts(true); setError(null); setBrand(b); setCompetitors(comps);

    // Capture the most recent past score for this brand (for delta display)
    const brandLower = b.toLowerCase().trim();
    const prev = pastAnalyses.find(a => a.brand.toLowerCase().trim() === brandLower);
    setPreviousScore(prev ? prev.overall_score : undefined);

    try {
      const res = await fetch("https://zealous-perception-production-2d31.up.railway.app/generate-prompts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: b, website, market: selectedMarket }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.detail || `Error: ${res.status}`); }
      const data = await res.json();
      setPromptsWithTrend(data.prompts);
      setStep("prompts");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setGeneratingPrompts(false); }
  }

  async function handleAnalyze(approvedPrompts: string[]) {
    setAnalyzing(true); setError(null);
    try {
      // Pre-flight limit check before spending API budget on backend models
      const preCheck = await fetch("/api/analyses", { method: "HEAD" });
      if (preCheck.status === 403) {
        setError(
          tier === "free"
            ? "You've used your free analysis. Upgrade to Pro for 10 analyses/month."
            : `Monthly limit reached (${limits.analyses} analyses). Resets on the 1st.`
        );
        return;
      }

      const res = await fetch("https://zealous-perception-production-2d31.up.railway.app/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, competitors, prompts: approvedPrompts, tier, user_id: appUser?.id ?? null }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.detail || `Error: ${res.status}`); }
      const data: AnalyzeResponse = await res.json();
      setResult(data); setStep("results");

      const saveRes = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand, market,
          overall_score: data.overall_score,
          active_models: data.active_models,
          competitor_count: Object.keys(data.competitor_scores).length,
          prompt_count: approvedPrompts.length,
          result_snapshot: data,
        }),
      });
      const saveData = await saveRes.json();
      if (saveData.error === "monthly_limit_reached" || saveData.error === "free_limit_reached") {
        setError("Limit reached — this analysis was not saved.");
      } else {
        setCurrentAnalysisId(saveData.analysis?.id);
        setMonthlyCount(c => c + 1);
        if (appUser) setAppUser({ ...appUser, analyses_count: appUser.analyses_count + 1 });
        // Collect previous recommendations for same brand to avoid repeating
        const brandLower = brand.toLowerCase().trim();
        const prevAnalysisForBrand = pastAnalyses.find(a => a.brand.toLowerCase().trim() === brandLower && a.playbook);
        if (prevAnalysisForBrand?.playbook) {
          setPreviousRecommendations(prevAnalysisForBrand.playbook.priority_actions ?? []);
        }
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setAnalyzing(false); }
  }

  function reset() {
    setStep("form"); setResult(null);
    setPromptsWithTrend([]); setError(null); setPreviousScore(undefined);
    setCurrentAnalysisId(undefined); setPreviousRecommendations([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const steps = ["Enter Brand", "Review Prompts", "Results"];
  const stepKeys: Step[] = ["form", "prompts", "results"];

  if (!isLoaded || !isSignedIn) return null;

  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <AppHeader onLogoClick={() => router.push("/")} />
      {shareTarget && (
        <ShareModal
          analysisId={shareTarget.id}
          brand={shareTarget.brand}
          score={shareTarget.score}
          market={shareTarget.market}
          onClose={() => setShareTarget(null)}
        />
      )}

      {/* Form step */}
      {step === "form" && (
        <section className="min-h-screen bg-grid pt-20">
          <StepIndicator
            steps={steps}
            currentIndex={stepKeys.indexOf(step)}
            showStartOver={step !== "form"}
            onStartOver={reset}
          />
          <div className="mx-auto max-w-xl px-6 pt-6 pb-20">

            {/* Quota bar */}
            {(() => {
              // For pro/agency: warn when ≤2 left. For free: only show red when at limit (1 total, no "almost" state)
              const showAmber = tier !== "free" && !isAtLimit && remaining <= 2;
              const barStyle = isAtLimit
                ? "border-red-200 bg-red-50"
                : showAmber
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50";
              const labelStyle = isAtLimit ? "text-red-600" : showAmber ? "text-amber-700" : "text-emerald-700";
              return (
                <div className={`mb-6 rounded-2xl border p-4 flex items-center justify-between gap-4 ${barStyle}`}>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${labelStyle}`}>
                      {tier === "free" ? "Free Plan" : tier === "pro" ? "Pro Plan" : "Agency Plan"}
                    </p>
                    <p className={`text-sm mt-0.5 ${isAtLimit ? "text-red-600" : "text-slate-600"}`}>
                      {isAtLimit
                        ? tier === "free"
                          ? "You've used your 1 free analysis."
                          : `Monthly limit reached — resets in ${daysUntilReset} day${daysUntilReset !== 1 ? "s" : ""}`
                        : tier === "free"
                          ? "1 free analysis available"
                          : `${remaining} of ${limits.analyses} left this month · resets in ${daysUntilReset}d`
                      }
                    </p>
                  </div>
                  {(isAtLimit || showAmber) && tier !== "agency" && (
                    <button
                      onClick={() => router.push("/pricing")}
                      className="flex-shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
                    >
                      {tier === "free" ? "Upgrade →" : "Go Agency →"}
                    </button>
                  )}
                </div>
              );
            })()}

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            {isAtLimit ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <p className="text-3xl mb-3">🔒</p>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {tier === "free" ? "Free analysis used" : "Monthly limit reached"}
                </p>
                <p className="text-xs text-slate-400 mb-5">
                  {tier === "free"
                    ? "Upgrade to Pro for 10 analyses per month."
                    : "Your quota resets on the 1st of each month."}
                </p>
                {tier !== "agency" && (
                  <button
                    onClick={() => router.push("/pricing")}
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
                  >
                    {tier === "free" ? "Upgrade to Pro — $49/mo" : "Upgrade to Agency — $599/mo"}
                  </button>
                )}
              </div>
            ) : (
              <div ref={formRef}>
                <BrandForm onGenerate={handleGenerate} loading={generatingPrompts} maxCompetitors={limits.competitors} />
              </div>
            )}

            {/* Past analyses */}
            {pastAnalyses.length > 0 && (
              <div className="mt-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Recent analyses
                </p>
                <div className="space-y-2">
                  {pastAnalyses.slice(0, 5).map((a) => {
                    const score = a.overall_score;
                    const scoreColor = score >= 60
                      ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                      : score >= 30
                        ? "text-amber-600 bg-amber-50 border-amber-100"
                        : "text-red-500 bg-red-50 border-red-100";

                    return (
                      <div
                        key={a.id}
                        onClick={() => {
                          if (!a.result_snapshot) return;
                          const brandLower = a.brand.toLowerCase().trim();
                          const aTime = new Date(a.created_at).getTime();
                          const prev = pastAnalyses.find(
                            p => p.brand.toLowerCase().trim() === brandLower && new Date(p.created_at).getTime() < aTime
                          );
                          setPreviousScore(prev?.overall_score);
                          setCurrentAnalysisId(a.id);
                          setResult(a.result_snapshot as unknown as AnalyzeResponse);
                          setMarket(a.market);
                          setBrand(a.brand);
                          setStep("results");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all group"
                      >
                        <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                          {a.brand[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{a.brand}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400">{a.market.toUpperCase()}</span>
                            <span className="text-slate-200">·</span>
                            <div className="flex gap-0.5">
                              {a.active_models.map((m) => (
                                <span key={m} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: MODEL_COLORS[m] ?? "#94a3b8" }} />
                              ))}
                            </div>
                            <span className="text-slate-200">·</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-black ${scoreColor}`}>
                            {score.toFixed(0)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareTarget({ id: a.id, brand: a.brand, score: a.overall_score, market: a.market });
                            }}
                            className="rounded-lg p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                            title="Share"
                          >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                            </svg>
                          </button>
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-slate-300 group-hover:text-slate-400 transition-colors">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                  {pastAnalyses.length > 5 && (
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="w-full rounded-xl border border-dashed border-slate-200 py-2.5 text-xs font-semibold text-slate-400 hover:text-indigo-500 hover:border-indigo-200 transition-all"
                    >
                      View all {pastAnalyses.length} analyses →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Analyzing overlay */}
      {analyzing && (
        <section className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="relative mx-auto mb-8 h-24 w-24">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-violet-400 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="#6366f1"/>
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Analyzing {brand}</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Querying prompts across {tier === "free" ? "2" : "all 6"} AI models.<br/>This usually takes 1–5 minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {(tier === "free"
                ? [{ label: "Claude", color: "#d97757" }, { label: "GPT-4o", color: "#10a37f" }]
                : [
                    { label: "Claude",      color: "#d97757" },
                    { label: "GPT-4o",     color: "#10a37f" },
                    { label: "Gemini",     color: "#4285f4" },
                    { label: "Perplexity", color: "#20b2aa" },
                    { label: "Grok",       color: "#a78bfa" },
                    { label: "DeepSeek",   color: "#4d6bfe" },
                  ]
              ).map((m, i) => (
                <span key={m.label} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                  <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                  {m.label}
                </span>
              ))}
            </div>
            {tier === "free" && (
              <p className="mt-4 text-xs text-slate-400">
                Upgrade to Pro to also analyze on Gemini, Perplexity, Grok & DeepSeek →
              </p>
            )}
          </div>
        </section>
      )}

      {/* Prompts step */}
      {step === "prompts" && !analyzing && (
        <>
        <StepIndicator steps={steps} currentIndex={1} showStartOver onStartOver={reset} />
        <section className="min-h-screen bg-slate-50 flex items-start justify-center px-4 sm:px-6 pt-4 pb-20">
          <div className="w-full max-w-2xl">
            {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            <PromptEditor prompts={promptsWithTrend} onConfirm={handleAnalyze} analyzing={analyzing} promptLimit={limits.prompts} brand={brand} market={market} />
          </div>
        </section>
        </>
      )}

      {/* Results step */}
      {step === "results" && result && (
        <>
        <StepIndicator steps={steps} currentIndex={2} showStartOver onStartOver={reset} />
        <section className="bg-slate-50 px-4 sm:px-6 pt-4 pb-20">
          <div className="mx-auto max-w-5xl">
            {error && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}
            <Dashboard data={result} market={market} tier={tier} locked={tier === "free"} previousScore={previousScore} analysisId={currentAnalysisId} previousRecommendations={previousRecommendations} />
          </div>
        </section>
        </>
      )}
    </main>
  );
}
