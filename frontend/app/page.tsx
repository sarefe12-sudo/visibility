"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import BrandForm from "@/components/BrandForm";
import PromptEditor from "@/components/PromptEditor";
import Dashboard from "@/components/Dashboard";
import AppHeader from "@/components/AppHeader";
import { useRouter } from "next/navigation";
import type { Competitor, AnalyzeResponse, PromptWithTrend } from "@/types";

type Step = "form" | "prompts" | "results";

const DEMO_COOKIE = "vr_demo_used";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

const MODEL_LOGOS: { key: string; color: string; icon: React.ReactNode }[] = [
  { key: "Claude",      color: "#d97757", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 16l2.5-7 1.5 4.5 1.5-4.5L16 16" stroke="#d97757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: "GPT-4o",     color: "#10a37f", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9.5" r="2.5" fill="#10a37f"/><path d="M7 17c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#10a37f" strokeWidth="2" strokeLinecap="round"/></svg> },
  { key: "Gemini",     color: "#4285f4", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4c0 4.42-3.58 8-8 8 4.42 0 8 3.58 8 8 0-4.42 3.58-8 8-8-4.42 0-8-3.58-8-8z" fill="#4285f4"/></svg> },
  { key: "Perplexity", color: "#20b2aa", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 8h10M7 12h10M7 16h6" stroke="#20b2aa" strokeWidth="2" strokeLinecap="round"/><circle cx="17" cy="16" r="2" fill="#20b2aa"/></svg> },
  { key: "Grok",       color: "#a78bfa", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7L7 17" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"/></svg> },
  { key: "DeepSeek",   color: "#4d6bfe", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2.5" fill="#4d6bfe"/><path d="M12 6v3M12 15v3M6 12h3M15 12h3" stroke="#4d6bfe" strokeWidth="2" strokeLinecap="round"/></svg> },
];

export default function Home() {
  const { user, isSignedIn } = useUser();
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
  const [formVisible, setFormVisible] = useState(false);
  const [demoUsed, setDemoUsed] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Check demo cookie on mount
  useEffect(() => {
    if (getCookie(DEMO_COOKIE) === "1") setDemoUsed(true);
  }, []);

  // Sync signed-in user to Supabase (upsert) — tier info comes back from DB
  useEffect(() => {
    if (!isSignedIn || !user) return;
    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.primaryEmailAddress?.emailAddress, name: user.fullName }),
    });
  }, [isSignedIn, user]);

  useEffect(() => {
    if (step !== "form") return;
    const el = formRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFormVisible(entry.isIntersecting),
      { threshold: 0.05, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [step]);

  async function handleGenerate(b: string, website: string, comps: Competitor[], selectedMarket: string) {
    // Demo already used — block
    if (demoUsed && !isSignedIn) {
      setError("You've already used the free demo. Sign up to continue.");
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

      // Mark demo as used (cookie — 365 days)
      if (!isSignedIn) {
        setCookie(DEMO_COOKIE, "1", 365);
        setDemoUsed(true);
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

  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <AppHeader
        onLogoClick={reset}
        steps={steps}
        currentStepIndex={stepKeys.indexOf(step)}
        showStartOver={step !== "form"}
        onStartOver={reset}
      />

      {/* Hero — form step */}
      {step === "form" && (
        <section className="min-h-screen bg-grid">
          <div className="pt-20" />

          <div className="mx-auto max-w-4xl px-6 pt-10 pb-4 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700 tracking-wide uppercase">Free Demo — No signup required</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-slate-900 sm:text-5xl lg:text-7xl">
              Be the brand<br />
              <span className="gradient-text">AI recommends.</span>
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-base sm:text-lg leading-relaxed text-slate-500">
              See how visible your brand is across Claude, GPT-4o, Gemini and more — in under 60 seconds.
            </p>

            <div className="mt-7" />

            <div className="mt-6 grid grid-cols-3 gap-2 sm:flex sm:items-center sm:justify-center sm:gap-3 sm:flex-wrap">
              {[
                { label: "6", sub: "AI Models", color: "indigo", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" fill="#6366f1" opacity="0.9"/><rect x="14" y="3" width="7" height="7" rx="2" fill="#6366f1" opacity="0.6"/><rect x="3" y="14" width="7" height="7" rx="2" fill="#6366f1" opacity="0.6"/><rect x="14" y="14" width="7" height="7" rx="2" fill="#6366f1" opacity="0.3"/></svg> },
                { label: "Live", sub: "AI Responses", color: "violet", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill="#7c3aed"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" opacity="0.5"/></svg> },
                { label: "0–100", sub: "Visibility Score", color: "emerald", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17l4-5 4 3 4-6 4 4" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
              ].map((s) => (
                <div key={s.sub} className={`flex flex-col items-center gap-2 rounded-2xl border border-${s.color}-100 bg-${s.color}-50 px-3 py-4 sm:px-7 sm:min-w-[130px]`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${s.color}-100`}>{s.icon}</div>
                  <div className="text-center">
                    <div className={`text-2xl font-extrabold text-${s.color}-700 leading-tight`}>{s.label}</div>
                    <div className={`text-xs font-semibold text-${s.color}-400 mt-0.5`}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-center gap-2.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Powered by</p>
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center">
                {MODEL_LOGOS.map((m) => (
                  <div key={m.key} className="flex flex-col items-center gap-1 group">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-0.5">
                      {m.icon}
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 hidden sm:block">{m.key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form or Demo-Used gate */}
          <div ref={formRef} className="mx-auto max-w-xl px-6 pb-20">

            {/* Demo used warning — not signed in */}
            {demoUsed && !isSignedIn && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
                <p className="text-2xl mb-2">🔒</p>
                <p className="text-sm font-bold text-amber-800 mb-1">You&apos;ve already used the free demo.</p>
                <p className="text-xs text-amber-600 mb-4">
                  Sign up free to get 1 full analysis — or upgrade to Pro for 9 analyses per month.
                </p>
                <div className="flex gap-2 justify-center">
                  <a href="/sign-up" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-all">
                    Sign up free →
                  </a>
                  <a href="/pricing" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                    See plans
                  </a>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            {(!demoUsed || isSignedIn) && (
              <BrandForm
                onGenerate={handleGenerate}
                loading={generatingPrompts}
                maxCompetitors={1}
              />
            )}

            {/* Demo limits banner — below form */}
            {!demoUsed && !isSignedIn && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs text-slate-400">Demo limits:</span>
                <span className="text-xs font-medium text-slate-600">1 competitor · 10 prompts · 1 use</span>
                <span className="ml-auto text-xs text-indigo-500 font-medium cursor-pointer hover:underline" onClick={() => router.push("/pricing")}>
                  Upgrade for more →
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Floating CTA */}
      {step === "form" && !demoUsed && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${formVisible ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"}`}>
          <button
            onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="flex items-center gap-2.5 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-orange-600 transition-colors"
          >
            Check your AI score — free
            <svg className="animate-bounce" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12l7 7 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Prompts step */}
      {step === "prompts" && (
        <section className="min-h-screen bg-slate-50 flex items-start justify-center px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
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
            {/* Post-demo signup nudge */}
            {demoUsed && !isSignedIn && (
              <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-indigo-900">Like what you see?</p>
                  <p className="text-xs text-indigo-600 mt-0.5">Sign up free to save this analysis + get 1 full analysis with history.</p>
                </div>
                <a href="/sign-up" className="flex-shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-all text-center">
                  Sign up free →
                </a>
              </div>
            )}
            <Dashboard data={result} market={market} />
          </div>
        </section>
      )}
    </main>
  );
}
