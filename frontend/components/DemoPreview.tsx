"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";

const MODELS = [
  { key: "Claude",      score: 72, color: "#d97757" },
  { key: "GPT-4o",     score: 65, color: "#10a37f" },
  { key: "Gemini",     score: 70, color: "#4285f4" },
  { key: "Perplexity", score: 58, color: "#20b2aa" },
];

const BRANDS = [
  { name: "Nike",   score: 68, you: true,  color: "#6366f1" },
  { name: "Adidas", score: 54, you: false, color: "#10a37f" },
  { name: "Puma",   score: 41, you: false, color: "#94a3b8" },
];

const SENTIMENTS = [
  { label: "Positive", pct: 62, bar: "bg-emerald-500", text: "text-emerald-600" },
  { label: "Neutral",  pct: 28, bar: "bg-slate-300",   text: "text-slate-500"  },
  { label: "Negative", pct: 10, bar: "bg-rose-400",    text: "text-rose-600"  },
];

export default function DemoPreview() {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setOn(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden py-24 px-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-indigo-50/50 to-white" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-gradient-to-b from-indigo-100/60 to-transparent blur-3xl" />

      <div ref={ref} className="relative mx-auto max-w-5xl">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 mb-5 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Live Example</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Here's what your report looks like
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
            Real analysis — Nike vs competitors across 4 AI models. Your brand, your data, 60 seconds.
          </p>
        </div>

        {/* Browser window */}
        <div className={`rounded-3xl border border-slate-200/80 shadow-2xl shadow-indigo-200/40 overflow-hidden bg-white transition-all duration-700 ${on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

          {/* Chrome bar */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/80 px-5 py-3.5">
            <div className="flex gap-1.5 flex-shrink-0">
              <div className="h-3 w-3 rounded-full bg-red-400/80" />
              <div className="h-3 w-3 rounded-full bg-amber-400/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="flex-1 max-w-xs mx-auto rounded-lg border border-slate-200 bg-white px-3 py-1 flex items-center gap-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#94a3b8" strokeWidth="2.5"/><path d="M12 8v4M12 16h.01" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/></svg>
              <span className="text-[11px] text-slate-400 truncate">visibilityradar.com/results</span>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-medium">Live</span>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="bg-slate-50/60 p-5 space-y-4">

            {/* Row 1: Score + Model bars */}
            <div className="grid gap-4 sm:grid-cols-[240px_1fr]">

              {/* Score card */}
              <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-200/50">
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">AI Visibility Score</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-6xl font-black leading-none tabular-nums">68</span>
                  <div className="mb-1 flex flex-col items-start gap-1">
                    <span className="text-indigo-300 text-lg">/100</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 px-2 py-0.5 text-xs font-bold text-emerald-300">↑ +12</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-white/80 transition-all duration-1000" style={{ width: on ? "68%" : "0%" }} />
                </div>
                <p className="text-xs text-indigo-200">Nike · Global · 4 AI models</p>
              </div>

              {/* Model bars */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Per-Model Score</p>
                <div className="space-y-3">
                  {MODELS.map((m, i) => (
                    <div key={m.key} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-600 w-20 flex-shrink-0">{m.key}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: on ? `${m.score}%` : "0%", backgroundColor: m.color, transitionDelay: `${i * 100 + 200}ms` }}
                        />
                      </div>
                      <span className="text-sm font-black text-slate-700 w-6 text-right tabular-nums">{m.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Competitor table + Sentiment */}
            <div className="grid gap-4 sm:grid-cols-[1fr_280px]">

              {/* Competitor bars */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Brand Comparison</p>
                <div className="space-y-3">
                  {BRANDS.map((b, i) => (
                    <div key={b.name} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${b.you ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50"}`}>
                      <div className="flex items-center gap-2 w-28 flex-shrink-0">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ backgroundColor: b.color }}>
                          {b.name[0]}
                        </div>
                        <span className={`text-xs font-bold truncate ${b.you ? "text-indigo-700" : "text-slate-600"}`}>{b.name}</span>
                        {b.you && <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-black text-white flex-shrink-0">YOU</span>}
                      </div>
                      <div className="flex-1 h-3 rounded-full bg-slate-200/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: on ? `${b.score}%` : "0%", backgroundColor: b.color, transitionDelay: `${i * 150 + 400}ms` }}
                        />
                      </div>
                      <span className={`text-base font-black w-8 text-right tabular-nums ${b.you ? "text-indigo-600" : "text-slate-400"}`}>{b.score}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <p className="text-[11px] text-amber-700 font-semibold">Adidas is 14 points ahead of you on GPT-4o</p>
                </div>
              </div>

              {/* Sentiment */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand Sentiment</p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Positive
                  </span>
                </div>
                <div className="space-y-3 mb-5">
                  {SENTIMENTS.map((s, i) => (
                    <div key={s.label} className="space-y-1">
                      <div className="flex justify-between">
                        <span className={`text-[11px] font-semibold ${s.text}`}>{s.label}</span>
                        <span className="text-[11px] font-black text-slate-600 tabular-nums">{s.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${s.bar} transition-all duration-1000`}
                          style={{ width: on ? `${s.pct}%` : "0%", transitionDelay: `${i * 120 + 600}ms` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] text-slate-500 leading-relaxed">AI models describe Nike <span className="font-bold text-slate-700">positively</span> in 62% of responses where it's mentioned.</p>
                </div>
              </div>
            </div>

            {/* Row 3: Recommendations — locked */}
            <div className="relative rounded-2xl border border-indigo-100 bg-white overflow-hidden shadow-sm">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Strategy Playbook</p>
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">7 recommendations</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { t: "Create FAQ pages targeting low-visibility prompts", p: "HIGH", c: "bg-red-50 text-red-500 border-red-200" },
                    { t: "Build Wikipedia presence for authority signals", p: "HIGH", c: "bg-red-50 text-red-500 border-red-200" },
                    { t: "Earn G2 and Trustpilot review volume", p: "MED", c: "bg-amber-50 text-amber-500 border-amber-200" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <span className="h-6 w-6 rounded-full bg-slate-900 flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">{i + 1}</span>
                      <p className="flex-1 text-xs font-medium text-slate-700">{r.t}</p>
                      <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${r.c}`}>{r.p}</span>
                    </div>
                  ))}
                  {/* Blurred items */}
                  {[4, 5, 6, 7].map((n) => (
                    <div key={n} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 select-none" style={{ filter: "blur(4px)", pointerEvents: "none" }}>
                      <span className="h-6 w-6 rounded-full bg-slate-200 flex-shrink-0" />
                      <div className="flex-1 h-3 rounded-full bg-slate-200" />
                      <div className="h-4 w-10 rounded-full bg-slate-200 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-0 top-36 flex items-end"
                style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.97) 50%, white 100%)" }}>
                <div className="w-full p-6 text-center">
                  <div className="inline-flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl border border-indigo-200 bg-indigo-50 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#6366f1" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">+4 more action items locked</p>
                      <p className="text-xs text-slate-400 mt-0.5">Enter your email above to unlock the full playbook</p>
                    </div>
                    <Link href="/" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                      Try with your brand — free →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom label */}
        <p className="text-center text-xs text-slate-400 mt-5">
          ↑ This is a real analysis. <Link href="/" className="text-indigo-500 font-semibold hover:underline">Run yours free →</Link>
        </p>
      </div>
    </section>
  );
}
