"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "",
    variantId: null,
    tier: "free",
    color: "border-slate-200",
    badge: null,
    description: "Try it once, see what AI thinks of your brand.",
    features: [
      { text: "1 analysis total", included: true },
      { text: "10 prompts per analysis", included: true },
      { text: "2 AI models (Claude + GPT-4o)", included: true },
      { text: "0 competitor tracking", included: false },
      { text: "Monthly AI score alerts", included: false },
      { text: "PDF report via email", included: false },
    ],
    cta: "Get started free",
    ctaStyle: "border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID,
    tier: "pro",
    color: "border-indigo-500 ring-2 ring-indigo-500/20",
    badge: "Most Popular",
    description: "For brands tracking their AI visibility month over month.",
    features: [
      { text: "9 analyses per month", included: true },
      { text: "25 prompts per analysis", included: true },
      { text: "All 6 AI models", included: true },
      { text: "Up to 3 competitors", included: true },
      { text: "Monthly AI score alerts", included: true },
      { text: "PDF report via email", included: true },
    ],
    cta: "Start Pro",
    ctaStyle: "bg-indigo-600 text-white hover:bg-indigo-700",
  },
  {
    name: "Agency",
    price: "$399",
    period: "/month",
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_AGENCY_VARIANT_ID,
    tier: "agency",
    color: "border-slate-800",
    badge: "White-Label",
    description: "For agencies managing multiple brands — with your logo, your domain.",
    features: [
      { text: "999 analyses per month", included: true },
      { text: "50 prompts per analysis", included: true },
      { text: "All 6 AI models", included: true },
      { text: "Up to 10 competitors", included: true },
      { text: "Monthly AI score alerts", included: true },
      { text: "White-label client portal", included: true },
    ],
    cta: "Start Agency",
    ctaStyle: "bg-slate-900 text-white hover:bg-slate-800",
  },
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  async function handleCta(plan: typeof PLANS[0]) {
    if (!plan.variantId) { router.push("/"); return; }
    if (!isSignedIn) { router.push("/?signup=true"); return; }
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: plan.variantId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <main className="min-h-screen bg-white">
      <AppHeader onLogoClick={() => router.push("/")} />

      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 mb-5">
            <span className="text-xs font-bold text-indigo-600 tracking-wide uppercase">Simple pricing</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Know your AI score.<br />
            <span style={{ color: "#6366f1" }}>Before your competitors do.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Start free, upgrade when you need more. No contracts, cancel anytime.
          </p>
        </div>

        {/* Plan cards */}
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl border bg-white p-7 flex flex-col ${plan.color}`}>
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className={`rounded-full px-4 py-1 text-xs font-bold text-white shadow-sm ${plan.tier === "agency" ? "bg-slate-800" : "bg-indigo-600"}`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-7 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>
                      </span>
                    )}
                    <span className={f.included ? "text-slate-700" : "text-slate-400"}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => handleCta(plan)} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${plan.ctaStyle}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Feature explainers */}
        <div className="mx-auto max-w-5xl mt-12 grid sm:grid-cols-2 gap-6">

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xl">📈</div>
              <div>
                <p className="text-sm font-bold text-indigo-900 mb-1.5">Monthly AI Score Alerts</p>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  Every month we automatically re-run your analysis and email you a comparison report.
                  Score improved? We show what worked. Dropped? We pinpoint exactly which AI model stopped
                  recommending you — and why. No manual tracking needed.
                </p>
                <p className="text-xs text-indigo-500 mt-3 font-semibold">✓ Pro & Agency plans</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-700 text-xl">🏢</div>
              <div>
                <p className="text-sm font-bold text-white mb-1.5">White-Label Client Portal</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Give your clients a branded experience — your logo, your domain, your colors.
                  Each client gets their own login to run queries, view their AI score, and receive
                  monthly reports. They see your brand. You control everything behind the scenes.
                </p>
                <p className="text-xs text-slate-400 mt-3 font-semibold">✓ Agency plan only · up to 10 client brands · 999 analyses/mo</p>
              </div>
            </div>
          </div>

        </div>

        {/* Trust row */}
        <div className="mx-auto max-w-3xl mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { icon: "🔒", label: "No credit card", sub: "for free plan" },
            { icon: "⚡", label: "Instant results", sub: "under 60 seconds" },
            { icon: "🔄", label: "Cancel anytime", sub: "no lock-in" },
            { icon: "🤖", label: "6 AI models", sub: "Claude, GPT-4o & more" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{item.icon}</span>
              <p className="text-xs font-semibold text-slate-700">{item.label}</p>
              <p className="text-xs text-slate-400">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
