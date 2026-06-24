"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import BrandForm from "@/components/BrandForm";
import PromptEditor from "@/components/PromptEditor";
import Dashboard from "@/components/Dashboard";
import AppHeader from "@/components/AppHeader";
import type { Competitor, AnalyzeResponse, PromptWithTrend } from "@/types";
import { TIER_LIMITS } from "@/lib/supabase";

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

  const [appUser, setAppUser] = useState<{ tier: string; analyses_count: number } | null>(null);
  const [monthlyCount, setMonthlyCount] = useState(0);

  const formRef = useRef<HTMLDivElement>(null);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/");
  }, [isLoaded, isSignedIn, router]);

  // Load user + monthly usage
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
      const { monthly_count } = await analysesRes.json();
      setAppUser(u);
      setMonthlyCount(monthly_count ?? 0);
    }
    load();
  }, [isSignedIn, user]);

  const tier = (appUser?.tier ?? "free") as keyof typeof TIER_LIMITS;
  const limits = TIER_LIMITS[tier];
  const remaining = tier === "free"
    ? limits.analyses - (appUser?.analyses_count ?? 0)
    : limits.analyses - monthlyCount;
  const isAtLimit = remaining <= 0;

  async function handleGenerate(b: string, website: string, comps: Competitor[], selectedMarket: string) {
    if (isAtLimit) {
      setError(
        tier === "free"
          ? "You've used your free analysis. Upgrade to Pro for 9 analyses/month."
          : `Monthly limit reached (${limits.analyses} analyses). Resets on the 1st.`
      );
      return;
    }
    setMarket(selectedMarket);
    setGeneratingPrompts(true); setError(null); setBrand(b); setCompetitors(comps);
    try {
      const res = await fetch("http://localhost:8001/generate-prompts", {
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
      const res = await fetch("http://localhost:8001/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, competitors, prompts: approvedPrompts }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.detail || `Error: ${res.status}`); }
      const data: AnalyzeResponse = await res.json();
      setResult(data); setStep("results");

      // Save + enforce limits server-side
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
        setMonthlyCount(c => c + 1);
        if (appUser) setAppUser({ ...appUser, analyses_count: appUser.analyses_count + 1 });
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setAnalyzing(false); }
  }

  function reset() {
    setStep("form"); setResult(null);
    setPromptsWithTrend([]); setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const steps = ["Enter Brand", "Review Prompts", "Results"];
  const stepKeys: Step[] = ["form", "prompts", "results"];

  if (!isLoaded || !isSignedIn) return null;

  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <AppHeader
        onLogoClick={() => router.push("/")}
        steps={steps}
        currentStepIndex={stepKeys.indexOf(step)}
        showStartOver={step !== "form"}
        onStartOver={reset}
      />

      {/* Form step */}
      {step === "form" && (
        <section className="min-h-screen bg-grid pt-20">
          <div className="mx-auto max-w-xl px-6 pt-10 pb-20">

            {/* Quota bar */}
            <div className={`mb-6 rounded-2xl border p-4 flex items-center justify-between gap-4 ${
              isAtLimit ? "border-red-200 bg-red-50" :
              remaining <= 2 ? "border-amber-200 bg-amber-50" :
              "border-emerald-200 bg-emerald-50"
            }`}>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${
                  isAtLimit ? "text-red-600" : remaining <= 2 ? "text-amber-700" : "text-emerald-700"
                }`}>
                  {tier === "free" ? "Free Plan" : tier === "pro" ? "Pro Plan" : "Agency Plan"}
                </p>
                <p className={`text-sm mt-0.5 ${isAtLimit ? "text-red-600" : "text-slate-600"}`}>
                  {isAtLimit
                    ? tier === "free"
                      ? "You've used your 1 free analysis."
                      : "Monthly limit reached. Resets on the 1st."
                    : tier === "free"
                      ? `${remaining} analysis remaining (total)`
                      : `${remaining} of ${limits.analyses} analyses left this month`
                  }
                </p>
              </div>
              {(isAtLimit || remaining <= 2) && tier !== "agency" && (
                <button
                  onClick={() => router.push("/pricing")}
                  className="flex-shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
                >
                  {tier === "free" ? "Upgrade →" : "Go Agency →"}
                </button>
              )}
            </div>

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
                    ? "Upgrade to Pro for 9 analyses per month."
                    : "Your quota resets on the 1st of each month."}
                </p>
                {tier !== "agency" && (
                  <button
                    onClick={() => router.push("/pricing")}
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
                  >
                    {tier === "free" ? "Upgrade to Pro — $29/mo" : "Upgrade to Agency — $399/mo"}
                  </button>
                )}
              </div>
            ) : (
              <div ref={formRef}>
                <BrandForm onGenerate={handleGenerate} loading={generatingPrompts} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Prompts step */}
      {step === "prompts" && (
        <section className="min-h-screen bg-slate-50 flex items-start justify-center px-4 sm:px-6 pt-24 pb-20">
          <div className="w-full max-w-2xl">
            {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            <PromptEditor prompts={promptsWithTrend} onConfirm={handleAnalyze} analyzing={analyzing} />
          </div>
        </section>
      )}

      {/* Results step */}
      {step === "results" && result && (
        <section className="bg-slate-50 px-4 sm:px-6 pt-20 sm:pt-24 pb-20">
          <div className="mx-auto max-w-5xl">
            {error && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}
            <Dashboard data={result} market={market} fromHistory />
          </div>
        </section>
      )}
    </main>
  );
}
