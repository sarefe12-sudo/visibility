"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import BrandForm from "@/components/BrandForm";
import PromptEditor from "@/components/PromptEditor";
import Dashboard from "@/components/Dashboard";
import AppHeader from "@/components/AppHeader";
import StepIndicator from "@/components/StepIndicator";
import DemoPreview from "@/components/DemoPreview";
import { useRouter } from "next/navigation";
import type { Competitor, AnalyzeResponse, PromptWithTrend } from "@/types";

type Step = "form" | "prompts" | "email" | "results";

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
  const [approvedPrompts, setApprovedPrompts] = useState<string[]>([]);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [market, setMarket] = useState("global");
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [demoUsed, setDemoUsed] = useState(false);
  const [emailForReport, setEmailForReport] = useState("");
  const [userTier, setUserTier] = useState<"free" | "pro" | "agency">("free");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (getCookie(DEMO_COOKIE) === "1") setDemoUsed(true);
  }, []);

  // Redirect signed-in users to the full analyze page
  useEffect(() => {
    if (isSignedIn) router.replace("/analyze");
  }, [isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.primaryEmailAddress?.emailAddress, name: user.fullName }),
    }).then(r => r.json()).then(d => { if (d.tier) setUserTier(d.tier); }).catch(() => {});
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
    if (demoUsed && !isSignedIn) {
      setError("You've already used the free demo. Sign up to continue.");
      return;
    }
    setMarket(selectedMarket);
    setGeneratingPrompts(true); setError(null); setBrand(b); setCompetitors(comps);
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

  // Called from PromptEditor — show email capture for non-signed-in users
  function handlePromptsConfirmed(prompts: string[]) {
    setApprovedPrompts(prompts);
    if (!isSignedIn) {
      setStep("email");
    } else {
      runAnalysis(prompts, "");
    }
  }

  async function runAnalysis(prompts: string[], email: string) {
    setAnalyzing(true); setError(null);

    // Check email-based demo limit for non-signed-in users
    if (!isSignedIn && email.trim()) {
      try {
        const checkRes = await fetch("/api/demo-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), action: "check" }),
        });
        const checkData = await checkRes.json();
        if (!checkData.allowed) {
          setAnalyzing(false);
          setError("Bu e-posta adresiyle daha önce ücretsiz demo kullanıldı. Pro plana geçerek sınırsız analiz yapabilirsiniz.");
          return;
        }
      } catch { /* network error — allow through */ }
    }

    try {
      const res = await fetch("https://zealous-perception-production-2d31.up.railway.app/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, competitors, prompts, email: email || undefined, tier: isSignedIn ? userTier : "free" }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.detail || `Error: ${res.status}`); }
      const data: AnalyzeResponse = await res.json();
      setResult(data); setStep("results");

      if (!isSignedIn) {
        setCookie(DEMO_COOKIE, "1", 365);
        setDemoUsed(true);
        if (email.trim()) {
          fetch("/api/demo-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), action: "record" }),
          }).catch(() => {});
        }
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setAnalyzing(false); }
  }

  function handleAnalyze(prompts: string[]) {
    runAnalysis(prompts, emailForReport);
  }

  function reset() {
    setStep("form"); setResult(null);
    setPromptsWithTrend([]); setError(null);
    setEmailForReport("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const steps = ["Enter Brand", "Review Prompts", "Results"];
  const stepKeys: Step[] = ["form", "prompts", "results"];
  const stepIndex = step === "email" ? 1 : stepKeys.indexOf(step);

  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <AppHeader onLogoClick={reset} />

      {/* ── FORM STEP ── */}
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
              Find out how often ChatGPT, Claude and Gemini mention your brand — and exactly what to fix to rank higher.
            </p>

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

          {/* Demo preview — between hero and form */}
          {!demoUsed && <DemoPreview />}

          {/* ── Per-Model Playbook Feature Section ── */}
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-xs font-bold text-violet-700 tracking-wide uppercase">New — Real-time AI Strategy</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                Every AI is different.<br />
                <span style={{ color: "#7c3aed" }}>Your strategy should be too.</span>
              </h2>
              <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Claude learns from Wikipedia and long-form articles. Gemini reads your Google footprint. Perplexity searches the web right now. Grok watches X/Twitter in real time.
                <br /><strong className="text-slate-700"> One generic SEO strategy won't fix all of them.</strong>
              </p>
            </div>

            {/* Model cards grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {[
                { name: "Claude",      color: "#d97757", icon: "C",  feeds: "Wikipedia · Long-form articles · Structured FAQs",          action: "Create authoritative reference content & Wikipedia presence" },
                { name: "GPT-4o",      color: "#10a37f", icon: "G",  feeds: "Broad web corpus · Bing · News & press releases",            action: "Get covered in industry news and high-DA publications" },
                { name: "Gemini",      color: "#4285f4", icon: "Ge", feeds: "Google Search · Google My Business · YouTube · Schema.org",  action: "Optimize Google footprint, structured data & video content" },
                { name: "Perplexity",  color: "#20b2aa", icon: "P",  feeds: "Real-time web · Reddit · Review sites · Backlink strength",  action: "Build community presence on Reddit, G2, Trustpilot" },
                { name: "Grok",        color: "#a78bfa", icon: "Gr", feeds: "X/Twitter live · Trending mentions · Influencer content",    action: "Activate X/Twitter strategy and influencer partnerships" },
                { name: "DeepSeek",    color: "#4d6bfe", icon: "D",  feeds: "Technical docs · GitHub · Developer forums · Research",      action: "Publish technical content and developer documentation" },
              ].map((m) => (
                <div key={m.name} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: m.color }}>
                      {m.icon}
                    </div>
                    <span className="text-sm font-bold text-slate-800">{m.name}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Feeds from</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{m.feeds}</p>
                  <div className="rounded-lg px-3 py-2" style={{ backgroundColor: `${m.color}10`, border: `1px solid ${m.color}25` }}>
                    <p className="text-[11px] font-semibold" style={{ color: m.color }}>→ {m.action}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA strip */}
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-600 to-indigo-600 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-base font-extrabold text-white mb-1">Get your model-by-model playbook — in real time</p>
                <p className="text-sm text-violet-200">Run one analysis. Claude reads your scores and instantly generates a custom strategy for each AI model.</p>
              </div>
              <button
                onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="flex-shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-bold text-violet-700 hover:bg-violet-50 transition-all shadow-sm whitespace-nowrap"
              >
                Try it free →
              </button>
            </div>
          </div>

          {/* Form or Demo-Used gate */}
          <div ref={formRef} className="mx-auto max-w-xl px-6 pb-20">

            {demoUsed && !isSignedIn && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
                <p className="text-2xl mb-2">🔒</p>
                <p className="text-sm font-bold text-amber-800 mb-1">You&apos;ve already used the free demo.</p>
                <p className="text-xs text-amber-600 mb-4">
                  Sign up free to get 1 full analysis — or upgrade to Pro for 10 analyses per month.
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
                maxCompetitors={isSignedIn ? undefined : 1}
              />
            )}

            {/* Demo limits banner */}
            {!demoUsed && !isSignedIn && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 flex items-center gap-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#94a3b8" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>
                <span className="text-xs text-slate-400">Demo limits:</span>
                <span className="text-xs font-medium text-slate-600">1 competitor · 10 prompts · 1 use</span>
                <span className="ml-auto text-xs text-indigo-500 font-medium cursor-pointer hover:underline" onClick={() => router.push("/pricing")}>
                  Upgrade →
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

      {/* ── ANALYZING OVERLAY ── */}
      {analyzing && (
        <section className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-sm">
            {/* Animated rings */}
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
              Querying {approvedPrompts.length} prompts across 2 AI models.<br/>
              This usually takes 20–40 seconds.
            </p>

            {/* Model pills animating */}
            <div className="flex flex-wrap justify-center gap-2">
              {["Claude", "GPT-4o"].map((m, i) => (
                <span
                  key={m}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PROMPTS STEP ── */}
      {step === "prompts" && !analyzing && (
        <section className="min-h-screen bg-slate-50 flex items-start justify-center px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
          <div className="w-full max-w-2xl">
            {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            <PromptEditor prompts={promptsWithTrend} onConfirm={handlePromptsConfirmed} analyzing={analyzing} brand={brand} market={market} />
          </div>
        </section>
      )}

      {/* ── EMAIL CAPTURE STEP (non-signed-in only) ── */}
      {step === "email" && (
        <section className="min-h-screen bg-slate-50 flex items-center justify-center px-4 sm:px-6 pt-24 pb-20">
          <div className="w-full max-w-md">
            <div className="card p-8 text-center shadow-sm">
              {/* Icon */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 mb-1">Where should we send your report?</h2>
              <p className="text-sm text-slate-500 mb-6">
                Get your full AI visibility report in your inbox. We&apos;ll also send improvement tips. No spam.
              </p>

              <div className="space-y-3 text-left mb-6">
                <input
                  type="email"
                  value={emailForReport}
                  onChange={(e) => setEmailForReport(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

              <button
                onClick={() => runAnalysis(approvedPrompts, emailForReport)}
                disabled={analyzing}
                className="btn-shine w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm mb-3"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Analyzing {approvedPrompts.length} prompts…
                  </span>
                ) : "Run Analysis & Email Report →"}
              </button>

              <button
                onClick={() => runAnalysis(approvedPrompts, "")}
                disabled={analyzing}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                Skip — show results without email
              </button>
            </div>

            {/* Social proof */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>
                No spam, ever
              </span>
              <span className="text-slate-200">·</span>
              <span>Unsubscribe anytime</span>
              <span className="text-slate-200">·</span>
              <span>Free report included</span>
            </div>
          </div>
        </section>
      )}

      {/* ── RESULTS STEP ── */}
      {step === "results" && result && (
        <section className="bg-slate-50 px-4 sm:px-6 pt-20 sm:pt-24 pb-20">
          <div className="mx-auto max-w-5xl">

            {/* ── Visibility Score Hero ── */}
            <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden relative">
              <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="relative">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-indigo-300 tracking-widest uppercase">AI Visibility Score</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {result.brand} scored{" "}
                  <span className={result.overall_score >= 60 ? "text-emerald-400" : result.overall_score >= 30 ? "text-amber-400" : "text-red-400"}>
                    {result.overall_score.toFixed(0)}/100
                  </span>
                </h2>
                <p className="text-sm text-slate-400 mt-1.5">
                  Across {result.active_models.length} AI models · {Object.keys(result.competitor_scores).length > 0 ? `vs ${Object.keys(result.competitor_scores).length} competitor(s)` : "no competitors tracked"}
                </p>
              </div>
              <div className="relative flex-shrink-0 flex flex-col items-center justify-center">
                <div className="relative h-28 w-28">
                  <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10"/>
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke={result.overall_score >= 60 ? "#34d399" : result.overall_score >= 30 ? "#fbbf24" : "#f87171"}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.overall_score / 100)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black tabular-nums ${result.overall_score >= 60 ? "text-emerald-400" : result.overall_score >= 30 ? "text-amber-400" : "text-red-400"}`}>
                      {result.overall_score.toFixed(0)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Single CTA banner — demo complete */}
            <div className="mb-6 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-white">Want to track this every month?</p>
                <p className="text-xs text-indigo-200 mt-1">Free account saves this analysis. Pro re-runs it monthly and alerts you when your score changes.</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href="/sign-up" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-all whitespace-nowrap shadow-sm">
                  Sign up free →
                </a>
                <a href="/pricing" className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all whitespace-nowrap">
                  See Pro →
                </a>
              </div>
            </div>

            {/* Content Studio teaser for non-pro users */}
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">AI Content Studio <span className="ml-1 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">PRO</span></p>
                  <p className="text-xs text-emerald-700 mt-0.5">Get 5 AI-tailored blog posts to improve {result.brand}&apos;s visibility — automatically generated from your analysis.</p>
                </div>
              </div>
              <a href="/pricing" className="flex-shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-colors whitespace-nowrap">
                Unlock Content Studio →
              </a>
            </div>

            <Dashboard data={result} market={market} locked={!isSignedIn} tier="free" />

            {/* Bottom CTA */}
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
              <p className="text-lg font-extrabold text-slate-900 mb-1">This was your free demo.</p>
              <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
                Create a free account to save this result. Upgrade to Pro for monthly tracking, 6 AI models, competitor analysis and full recommendations.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a href="/sign-up" className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all">
                  Create free account →
                </a>
                <a href="/pricing" className="rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-all">
                  View Pro — $49/mo
                </a>
                <button onClick={reset} className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all">
                  Try another brand
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
