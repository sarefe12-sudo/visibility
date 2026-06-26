"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";

const MODEL_PILLS = [
  { name: "Claude",     color: "#d97757", letter: "C" },
  { name: "GPT-4o",    color: "#10a37f", letter: "G" },
  { name: "Gemini",    color: "#4285f4", letter: "Ge" },
  { name: "Perplexity",color: "#20b2aa", letter: "P" },
  { name: "Grok",      color: "#a78bfa", letter: "Gr" },
  { name: "DeepSeek",  color: "#4d6bfe", letter: "D" },
];

function ModelPills({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2 ml-7">
      {MODEL_PILLS.slice(0, count).map((m) => (
        <span key={m.name} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
          style={{ backgroundColor: `${m.color}15`, borderColor: `${m.color}40`, color: m.color }}>
          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
          {m.name}
        </span>
      ))}
    </div>
  );
}

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
      { text: "2 AI models (Claude, GPT-4o)", included: true },
      { text: "Competitor tracking", included: false },
      { text: "Sentiment analysis", included: false },
      { text: "PDF report", included: false },
      { text: "AI Content Studio (Pro only)", included: false },
    ],
    cta: "Get started free",
    ctaStyle: "border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  },
  {
    name: "Pro",
    price: "$49",
    originalPrice: "$99",
    period: "/month",
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID,
    tier: "pro",
    color: "border-indigo-500 ring-2 ring-indigo-500/20",
    badge: "Most Popular",
    launchBadge: true,
    description: "For brands serious about winning the AI visibility race.",
    features: [
      { text: "10 analyses per month", included: true },
      { text: "25 prompts · 5 competitors", included: true },
      { text: "All 6 AI models incl. Gemini", included: true },
      { text: "Sentiment analysis", included: true },
      { text: "Monthly AI score alerts", included: true },
      { text: "PDF report download", included: true },
      { text: "AI Content Studio — 5 blog posts per analysis", included: true },
    ],
    cta: "Claim Launch Price →",
    ctaStyle: "bg-indigo-600 text-white hover:bg-indigo-700",
  },
  {
    name: "Agency",
    price: "$599",
    period: "/month",
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_AGENCY_VARIANT_ID,
    tier: "agency",
    color: "border-slate-800",
    badge: "White-Label",
    description: "For agencies managing multiple brands — with your logo, your domain.",
    features: [
      { text: "Unlimited analyses", included: true },
      { text: "50 prompts · 10 competitors", included: true },
      { text: "All 6 AI models incl. Gemini + sentiment", included: true },
      { text: "Monthly AI score alerts", included: true },
      { text: "White-label client portal", included: true },
      { text: "PDF reports for all clients", included: true },
      { text: "AI Content Studio — unlimited blog plans", included: true },
      { text: "API access — coming soon", included: true, soon: true },
    ],
    cta: "Start Agency",
    ctaStyle: "bg-slate-900 text-white hover:bg-slate-800",
  },
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  async function handleCta(plan: typeof PLANS[0]) {
    // Free plan → go to sign-up (or analyze if already signed in)
    if (!plan.variantId) {
      router.push(isSignedIn ? "/analyze" : "/sign-up");
      return;
    }
    // Paid plan → must be signed in first
    if (!isSignedIn) {
      router.push("/sign-up");
      return;
    }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: plan.variantId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout failed. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <AppHeader onLogoClick={() => router.push("/")} />

      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl text-center mb-14">
          {/* Launch pricing banner */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-xs font-bold text-amber-700 tracking-wide uppercase">🚀 Launch Pricing — Limited Time Only</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Know your AI score.<br />
            <span style={{ color: "#6366f1" }}>Before your competitors do.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            We're in early access. Lock in founder pricing before it goes up — no contracts, cancel anytime.
          </p>
        </div>

        {/* Plan cards — items-stretch so all cards match the tallest one */}
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-3 items-stretch">
          {PLANS.map((plan) => {
            const p = plan as typeof plan & { launchBadge?: boolean; originalPrice?: string };
            return (
              <div key={plan.name} className={`relative rounded-2xl border bg-white flex flex-col ${plan.color} ${p.launchBadge ? "pt-12 px-7 pb-7" : "pt-7 px-7 pb-7"}`}>

                {/* ── Top badge row — always same height slot ── */}
                {plan.badge && (
                  <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-2 -translate-y-1/2 px-4">
                    <span className={`rounded-full px-4 py-1 text-xs font-bold text-white shadow-sm whitespace-nowrap ${plan.tier === "agency" ? "bg-slate-800" : "bg-indigo-600"}`}>
                      {plan.badge}
                    </span>
                    {p.launchBadge && (
                      <span className="rounded-full border border-amber-300 bg-amber-400 px-3 py-1 text-[10px] font-extrabold text-amber-900 shadow-sm uppercase tracking-wide whitespace-nowrap">
                        🔥 Launch Deal
                      </span>
                    )}
                  </div>
                )}

                {/* ── Price block ── */}
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{plan.name}</p>

                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                    {p.originalPrice && (
                      <span className="text-sm font-semibold text-slate-400 line-through">{p.originalPrice}/mo</span>
                    )}
                  </div>

                  {p.launchBadge && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                      <span className="text-base leading-none">⏳</span>
                      <p className="text-[11px] font-bold text-amber-700 leading-tight">
                        Early access price — goes to <span className="line-through">{p.originalPrice}/mo</span> soon. Lock in now.
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-slate-500 mt-3 leading-relaxed">{plan.description}</p>
                </div>

                {/* ── Feature list — flex-1 pushes button to bottom ── */}
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f) => {
                    const isModelFeature = f.text.includes("AI model");
                    const modelCount = plan.tier === "free" ? 2 : 6;
                    const isSoon = (f as { soon?: boolean }).soon;
                    return (
                      <li key={f.text}>
                        <div className="flex items-center gap-2.5 text-sm">
                          {f.included ? (
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                          ) : (
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                              <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>
                            </span>
                          )}
                          <span className={f.included ? "text-slate-700" : "text-slate-400"}>
                            {isSoon ? (
                              <>API access <span className="inline-block rounded-full bg-amber-100 border border-amber-200 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 ml-1">Soon</span></>
                            ) : f.text}
                          </span>
                        </div>
                        {isModelFeature && f.included && <ModelPills count={modelCount} />}
                      </li>
                    );
                  })}
                </ul>

                {/* ── CTA — always pinned to bottom ── */}
                <div>
                  <button
                    onClick={() => handleCta(plan)}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature explainers */}
        <div className="mx-auto max-w-5xl mt-12 grid sm:grid-cols-3 gap-6">

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

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl">✍️</div>
              <div>
                <p className="text-sm font-bold text-emerald-900 mb-1.5">AI Content Studio</p>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  After every analysis, Claude writes 5 SEO-optimized blog posts tailored to your exact
                  visibility gaps — targeting the AI models where your brand is weakest. Real content,
                  ready to publish. Not templates. Not fluff.
                </p>
                <p className="text-xs text-emerald-600 mt-3 font-semibold">✓ Pro: 10 plans/mo · Agency: unlimited</p>
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
            {
              bg: "bg-indigo-50", iconBg: "bg-indigo-100",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#6366f1" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ),
              label: "No credit card", sub: "for free plan",
            },
            {
              bg: "bg-amber-50", iconBg: "bg-amber-100",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              label: "Instant results", sub: "under 60 seconds",
            },
            {
              bg: "bg-emerald-50", iconBg: "bg-emerald-100",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M23 4v6h-6" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              label: "Cancel anytime", sub: "no lock-in",
            },
            {
              bg: "bg-violet-50", iconBg: "bg-violet-100",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="#7c3aed"/>
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ),
              label: "6 AI models", sub: "Claude, GPT-4o & more",
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className={`flex items-center justify-center w-11 h-11 rounded-2xl ${item.iconBg}`}>
                {item.icon}
              </div>
              <p className="text-xs font-semibold text-slate-700">{item.label}</p>
              <p className="text-xs text-slate-400">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
