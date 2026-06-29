"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Link from "next/link";

const MODEL_PILLS = [
  { name: "Claude",      color: "#d97757" },
  { name: "GPT-4o",     color: "#10a37f" },
  { name: "Gemini",     color: "#4285f4" },
  { name: "Perplexity", color: "#20b2aa" },
  { name: "Grok",       color: "#a78bfa" },
  { name: "DeepSeek",   color: "#4d6bfe" },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "",
    variantId: null,
    tier: "free",
    badge: null,
    highlight: false,
    description: "Try it once and see what AI thinks of your brand.",
    features: [
      { text: "1 analysis total", ok: true },
      { text: "2 AI models (Claude, GPT-4o)", ok: true },
      { text: "10 prompts per analysis", ok: true },
      { text: "Basic visibility score", ok: true },
      { text: "Competitor comparison", ok: false },
      { text: "Sentiment analysis", ok: false },
      { text: "PDF export", ok: false },
      { text: "AI Content Studio", ok: false },
      { text: "Weekly email digest", ok: false },
      { text: "MCP API access", ok: false },
    ],
    cta: "Get started free",
    ctaClass: "border border-slate-200 text-slate-700 hover:bg-slate-50",
  },
  {
    name: "Pro",
    price: "$49",
    originalPrice: "$99",
    period: "/month",
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID,
    tier: "pro",
    badge: "Most Popular",
    highlight: true,
    description: "For brands serious about winning the AI visibility race.",
    features: [
      { text: "10 analyses per month", ok: true },
      { text: "All 6 AI models", ok: true },
      { text: "25 prompts · 3 competitors", ok: true },
      { text: "Full sentiment analysis", ok: true },
      { text: "AI Strategy Playbook", ok: true },
      { text: "AI Content Studio — 5 posts/analysis", ok: true },
      { text: "Custom prompt library (10 prompts)", ok: true },
      { text: "Weekly email digest", ok: true },
      { text: "PDF report export", ok: true },
      { text: "MCP API access (Claude Desktop, Cursor)", ok: true },
    ],
    cta: "Claim Launch Price →",
    ctaClass: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
  },
  {
    name: "Agency",
    price: "$99",
    period: "/month",
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_AGENCY_VARIANT_ID,
    tier: "agency",
    badge: "For Agencies",
    highlight: false,
    description: "Unlimited analyses for you and your clients.",
    features: [
      { text: "Unlimited analyses", ok: true },
      { text: "All 6 AI models", ok: true },
      { text: "50 prompts · 5 competitors", ok: true },
      { text: "Full sentiment analysis", ok: true },
      { text: "AI Strategy Playbook", ok: true },
      { text: "AI Content Studio — unlimited", ok: true },
      { text: "Custom prompt library (50 prompts)", ok: true },
      { text: "Weekly email digest", ok: true },
      { text: "PDF reports — white-label ready", ok: true },
      { text: "MCP API — higher rate limits", ok: true },
    ],
    cta: "Start Agency Plan →",
    ctaClass: "bg-slate-900 text-white hover:bg-slate-800",
  },
];

const FEATURES = [
  {
    icon: "📊",
    title: "AI Visibility Score",
    desc: "A single 0–100 score showing how well each AI model knows and recommends your brand. Measured across Claude, GPT-4o, Gemini, Perplexity, Grok, and DeepSeek.",
    tag: "All plans",
    tagColor: "bg-slate-100 text-slate-600",
  },
  {
    icon: "🎯",
    title: "AI Strategy Playbook",
    desc: "Model-specific action plan. For each AI where your score is low, you get concrete tactics — build Wikipedia presence for Claude, earn G2 reviews for Perplexity. Prioritized by impact.",
    tag: "Pro & Agency",
    tagColor: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: "✍️",
    title: "AI Content Studio",
    desc: "After every analysis, we generate 5 SEO and GEO-optimized blog posts targeting your exact visibility gaps. Real content ready to publish — not templates.",
    tag: "Pro & Agency",
    tagColor: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: "📧",
    title: "Weekly Email Digest",
    desc: "Every Monday you get a comparison of your brands — score changes, competitor movements, and which AI model shifted most. No manual tracking needed.",
    tag: "Pro & Agency",
    tagColor: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: "🔌",
    title: "MCP API Access",
    desc: "Use VisibilityRadar directly inside Claude Desktop, Cursor, or Windsurf. Ask your AI assistant to analyze any brand — results sync to your dashboard automatically.",
    tag: "Pro & Agency",
    tagColor: "bg-violet-100 text-violet-700",
  },
  {
    icon: "🌐",
    title: "Site AI Optimization",
    desc: "10-point audit of your website — schema markup, brand density, meta tags, and other signals AI models use to understand and trust your brand.",
    tag: "Pro & Agency",
    tagColor: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: "🏷️",
    title: "Custom Prompt Library",
    desc: "Save the prompts your customers actually use when searching for your category. They're automatically included in every analysis for more accurate results.",
    tag: "Pro & Agency",
    tagColor: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: "🔗",
    title: "Share & Embed",
    desc: "Share your AI Visibility Score via a public link, Twitter card, LinkedIn post, or embed it on your site. Dynamic OG images generated automatically.",
    tag: "Pro & Agency",
    tagColor: "bg-indigo-100 text-indigo-700",
  },
];

const FAQS = [
  { q: "What counts as one analysis?", a: "One analysis = scanning one brand across all active AI models with your selected prompts. Running the same brand again is a new analysis." },
  { q: "Can I change plans anytime?", a: "Yes. Upgrade or downgrade anytime from Account Settings. Changes take effect immediately." },
  { q: "Do unused analyses roll over?", a: "No — monthly credits reset on the 1st of each month. We recommend scheduling regular monthly analyses." },
  { q: "What is MCP API access?", a: "MCP (Model Context Protocol) lets you run VisibilityRadar analyses directly from Claude Desktop, Cursor, or Windsurf — no browser needed. Pro and Agency plans include API key generation." },
  { q: "Is there a free trial?", a: "The Starter plan is free and includes 1 full analysis — no credit card required. It's a real analysis, not a demo." },
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  async function handleCta(plan: typeof PLANS[0]) {
    if (!plan.variantId) {
      router.push(isSignedIn ? "/analyze" : "/sign-up");
      return;
    }
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
      if (data.url) window.location.href = data.url;
      else alert("Checkout failed. Please try again.");
    } catch {
      alert("Network error. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <AppHeader onLogoClick={() => router.push("/")} />

      {/* Hero */}
      <section className="pt-28 pb-6 px-4 sm:px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">🚀 Launch Pricing — Limited Time</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Know your AI score.<br />
            <span className="text-indigo-600">Before your competitors do.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8">
            The only platform that measures your brand across all major AI models — and tells you exactly how to improve each one.
          </p>

          {/* Model pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {MODEL_PILLS.map(m => (
              <span key={m.name} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: m.color + "12", borderColor: m.color + "30", color: m.color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="px-4 sm:px-6 pb-10">
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-3 items-stretch">
          {PLANS.map(plan => (
            <div key={plan.name} className={`relative rounded-2xl border bg-white flex flex-col ${
              plan.highlight
                ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl shadow-indigo-100"
                : "border-slate-200"
            }`}>
              {plan.badge && (
                <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                  <span className={`rounded-full px-4 py-1 text-xs font-bold text-white shadow-sm ${
                    plan.highlight ? "bg-indigo-600" : "bg-slate-700"
                  }`}>{plan.badge}</span>
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                {/* Price */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{plan.name}</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                    {"originalPrice" in plan && plan.originalPrice && (
                      <span className="text-sm text-slate-400 line-through">{plan.originalPrice}/mo</span>
                    )}
                  </div>
                  {"originalPrice" in plan && plan.originalPrice && (
                    <div className="flex items-center gap-1.5 mt-2 mb-3">
                      <span className="rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5">🔥 50% OFF launch price</span>
                    </div>
                  )}
                  <p className="text-sm text-slate-500 leading-relaxed">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map(f => (
                    <li key={f.text} className="flex items-start gap-2.5">
                      {f.ok ? (
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 mt-0.5">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 mt-0.5">
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>
                        </span>
                      )}
                      <span className={`text-sm leading-snug ${f.ok ? "text-slate-700" : "text-slate-400"}`}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCta(plan)}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all ${plan.ctaClass}`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mx-auto max-w-3xl mt-8 flex flex-wrap justify-center gap-6 text-center">
          {[
            { icon: "🔒", label: "No credit card", sub: "for free plan" },
            { icon: "⚡", label: "Results in 60s", sub: "instant analysis" },
            { icon: "🔄", label: "Cancel anytime", sub: "no lock-in" },
            { icon: "🔒", label: "Secure & private", sub: "your data stays yours" },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2 text-left">
              <span className="text-lg">{b.icon}</span>
              <div>
                <p className="text-xs font-semibold text-slate-700">{b.label}</p>
                <p className="text-xs text-slate-400">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All features */}
      <section className="px-4 sm:px-6 py-16 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Everything included</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Built for serious brand visibility</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-bold text-slate-900">{f.title}</p>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${f.tagColor}`}>{f.tag}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MCP highlight */}
      <section className="px-4 sm:px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-8 sm:p-12 flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl">🔌</div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 border border-violet-200 px-3 py-0.5 text-xs font-bold text-violet-700 mb-3">New feature</div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3">
                Analyze brands directly from Claude Desktop or Cursor
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                With the <strong>VisibilityRadar MCP server</strong>, you can ask your AI assistant to analyze any brand without opening a browser. Type <em>"analyze Nike's AI visibility"</em> in Claude and get a full score report instantly — synced to your dashboard.
              </p>
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400 mb-5">
                <span className="text-slate-500">$</span> npx visibilityradar-mcp<br />
                <span className="text-slate-500"># then ask Claude: </span><span className="text-white">analyze Nike vs Adidas in US market</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                {["Claude Desktop", "Cursor", "Windsurf", "Any MCP-compatible client"].map(t => (
                  <span key={t} className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-16 bg-slate-50">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Common questions</h2>
            <p className="text-sm text-slate-500">
              More questions? <Link href="/faq" className="text-indigo-600 hover:underline font-semibold">See full FAQ →</Link>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {FAQS.map(f => (
              <div key={f.q} className="px-6 py-5">
                <p className="text-sm font-semibold text-slate-800 mb-1.5">{f.q}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Start free. Upgrade when ready.</h2>
          <p className="text-slate-500 mb-8">No credit card needed for the free plan. Get your first AI visibility score in under 60 seconds.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push(isSignedIn ? "/analyze" : "/sign-up")}
              className="rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Analyze your brand free →
            </button>
            <Link href="/contact" className="rounded-xl border border-slate-200 px-7 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
