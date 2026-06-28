import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "Product — VisibilityRadar AI Visibility Platform",
  description: "Everything you need to dominate AI search. Per-model analysis, content studio, competitor benchmarking, sentiment tracking, white-label reports, and a full API.",
};

const MODELS = [
  { name: "Claude", color: "#D97757", desc: "Anthropic's Claude values authoritative, well-structured content. We show you exactly what it takes to get cited." },
  { name: "GPT-4o", color: "#10A37F", desc: "OpenAI's GPT-4o crawls the web via Bing. Press coverage, backlinks, and news mentions move the needle here." },
  { name: "Gemini", color: "#4285F4", desc: "Google's Gemini pulls from Search, Maps, and YouTube. Schema markup and Google ecosystem signals dominate." },
  { name: "Perplexity", color: "#20B2AA", desc: "Real-time web search. Fresh content, Reddit threads, and review sites like G2 drive your Perplexity score." },
  { name: "Grok", color: "#A78BFA", desc: "X/Twitter-native. Active brand presence, trending mentions, and influencer conversations push Grok rankings." },
  { name: "DeepSeek", color: "#4D6BFE", desc: "Technical corpus and developer communities. GitHub presence, docs, and academic citations are key signals." },
];

const FEATURES = [
  {
    tag: "Core Analysis",
    title: "Per-Model AI Visibility Score",
    subtitle: "Six models. One dashboard. Zero guesswork.",
    body: "Every AI model has different training data, ranking signals, and behavioral tendencies. We probe ChatGPT, Claude, Gemini, Perplexity, Grok, and DeepSeek with real user prompts — then score your brand 0–100 on each. You see exactly where you stand and why.",
    highlight: "Most brands are invisible on at least 3 of the 6 major AI models.",
    visual: (
      <div className="grid grid-cols-3 gap-3">
        {MODELS.map((m) => (
          <div key={m.name} className="rounded-xl bg-white border border-slate-200 p-3 text-center shadow-sm">
            <div className="text-2xl font-bold mb-1" style={{ color: m.color }}>
              {["42", "61", "18", "55", "7", "33"][MODELS.indexOf(m)]}
            </div>
            <div className="text-[10px] font-semibold text-slate-500">{m.name}</div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: ["42%","61%","18%","55%","7%","33%"][MODELS.indexOf(m)], backgroundColor: m.color }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag: "Competitive Intelligence",
    title: "Competitor Benchmarking",
    subtitle: "See who's beating you in AI — and by how much.",
    body: "Add up to 5 competitors and we run the same analysis across all of them simultaneously. You get a side-by-side breakdown: who gets mentioned more, where they outperform you, and which AI models are most competitive for your category.",
    highlight: "Know your gap before your competitor does.",
    visual: (
      <div className="space-y-2.5">
        {[
          { name: "Your Brand", score: 42, you: true },
          { name: "Competitor A", score: 71 },
          { name: "Competitor B", score: 38 },
          { name: "Competitor C", score: 24 },
        ].map((r) => (
          <div key={r.name} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${r.you ? "bg-indigo-50 border border-indigo-200" : "bg-white border border-slate-200"}`}>
            <span className={`text-xs font-semibold w-28 ${r.you ? "text-indigo-700" : "text-slate-600"}`}>{r.name}{r.you ? " (YOU)" : ""}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${r.you ? "bg-indigo-500" : "bg-slate-400"}`} style={{ width: `${r.score}%` }} />
            </div>
            <span className={`text-sm font-bold w-8 text-right ${r.you ? "text-indigo-600" : "text-slate-500"}`}>{r.score}</span>
          </div>
        ))}
        <p className="text-xs text-amber-600 font-semibold pl-1">⚡ Competitor A is 29 points ahead of you overall</p>
      </div>
    ),
  },
  {
    tag: "Brand Intelligence",
    title: "Sentiment Analysis",
    subtitle: "Not just whether you're mentioned — but how.",
    body: "Being mentioned is only half the battle. We analyze the sentiment around every brand mention across all AI responses: positive, neutral, or negative. You see what AI models actually say about you, and where the narrative needs work.",
    highlight: "A negative mention is worse than no mention.",
    visual: (
      <div className="space-y-3">
        {[
          { label: "Positive mentions", pct: 58, color: "#10B981" },
          { label: "Neutral mentions", pct: 31, color: "#94A3B8" },
          { label: "Negative mentions", pct: 11, color: "#EF4444" },
        ].map((s) => (
          <div key={s.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">{s.label}</span>
              <span className="font-bold" style={{ color: s.color }}>{s.pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
            </div>
          </div>
        ))}
        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 font-medium">
          AI models describe your brand positively in 58% of responses where you are mentioned.
        </div>
      </div>
    ),
  },
  {
    tag: "Content Engine",
    title: "AI Content Studio",
    subtitle: "Write what AI wants to cite. We generate it for you.",
    body: "We analyze your visibility gaps — the prompts where you're missing, the topics competitors own — and generate SEO-optimized blog posts specifically designed to get picked up by AI training pipelines. Each article targets a specific model's ranking signals.",
    highlight: "Content built for AI discovery, not just Google.",
    visual: (
      <div className="space-y-2">
        {[
          { title: "Why AI Models Recommend SaaS Tools: A 2025 Guide", tag: "Targets GPT-4o + Perplexity", status: "Published" },
          { title: "How to Improve Your Brand's Claude Visibility Score", tag: "Targets Claude", status: "Published" },
          { title: "AI Share of Voice: What It Is and Why It Matters", tag: "All models", status: "Draft" },
        ].map((p) => (
          <div key={p.title} className="rounded-xl bg-white border border-slate-200 px-4 py-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-800 leading-snug">{p.title}</p>
              <p className="text-[10px] text-indigo-500 font-medium mt-0.5">{p.tag}</p>
            </div>
            <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${p.status === "Published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag: "Site Optimization",
    title: "AI-Readiness Site Audit",
    subtitle: "Is your website optimized for AI crawlers?",
    body: "We scan your website and score it across 10 AI-readiness signals: structured data, sitemap accessibility, content depth, meta quality, brand consistency, and more. You get a prioritized checklist of exactly what to fix to improve how AI models read and trust your site.",
    highlight: "A site invisible to AI crawlers is a site invisible to AI answers.",
    visual: (
      <div className="space-y-2">
        {[
          { label: "Structured Data (Schema.org)", score: 90, ok: true },
          { label: "Sitemap XML", score: 100, ok: true },
          { label: "Content Depth", score: 55, ok: false },
          { label: "Brand Consistency", score: 40, ok: false },
          { label: "Robots.txt", score: 100, ok: true },
          { label: "AI Meta Signals", score: 30, ok: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${item.ok ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
              {item.ok ? "✓" : "✗"}
            </span>
            <span className="text-xs text-slate-600 flex-1">{item.label}</span>
            <span className={`text-xs font-bold ${item.ok ? "text-emerald-600" : "text-red-500"}`}>{item.score}/100</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag: "Per-Model Playbook",
    title: "Model-Specific Strategy Playbook",
    subtitle: "One-size-fits-all strategy doesn't work in AI search.",
    body: "After analyzing your scores, our AI generates a custom action plan for each of the 6 models. What works for Claude doesn't work for Grok. We give you the exact steps — tailored to each model's training signals — so you can move the needle where it matters most.",
    highlight: "6 models. 6 strategies. All in one playbook.",
    visual: (
      <div className="space-y-2">
        {[
          { model: "Claude", color: "#D97757", status: "WEAK", score: 28, action: "Add FAQ pages and structured Wikipedia-style content to your site." },
          { model: "GPT-4o", color: "#10A37F", status: "GOOD", score: 61, action: "Get featured in 3 industry publications this month." },
          { model: "Gemini", color: "#4285F4", status: "CRITICAL", score: 12, action: "Set up Google Business Profile and add schema markup." },
        ].map((m) => (
          <div key={m.model} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
              <span className="text-xs font-bold" style={{ color: m.color }}>{m.model}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${m.status === "GOOD" ? "bg-emerald-100 text-emerald-700" : m.status === "WEAK" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{m.status}</span>
              <span className="ml-auto text-xs font-bold" style={{ color: m.color }}>{m.score}/100</span>
            </div>
            <p className="text-[10px] text-slate-500 px-3 py-2">{m.action}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-white">
      <AppHeader />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white overflow-hidden pt-36 pb-28 px-6">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 40%)" }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            6 AI Models · Real-Time · Actionable
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6">
            Everything You Need to Win<br />
            <span className="text-indigo-400">AI Search</span>
          </h1>
          <p className="text-indigo-200 text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            One platform. Six AI models. Full visibility into how ChatGPT, Claude, Gemini, Perplexity, Grok, and DeepSeek talk about your brand — and exactly what to do about it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="rounded-xl bg-indigo-500 hover:bg-indigo-400 px-8 py-4 text-sm font-bold text-white transition-colors">
              Analyze Your Brand Free →
            </Link>
            <Link href="/pricing" className="rounded-xl border border-indigo-500/40 bg-white/5 hover:bg-white/10 px-8 py-4 text-sm font-bold text-indigo-200 transition-colors">
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Model pills */}
      <section className="bg-slate-50 border-b border-slate-200 py-8 px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">Powered by analysis across all major AI models</p>
          <div className="flex flex-wrap justify-center gap-3">
            {MODELS.map((m) => (
              <div key={m.name} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="text-xs font-semibold text-slate-700">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature sections */}
      {FEATURES.map((f, i) => (
        <section key={f.tag} className={`py-20 px-6 ${i % 2 === 1 ? "bg-slate-50" : "bg-white"}`}>
          <div className="mx-auto max-w-5xl">
            <div className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
              {/* Text */}
              <div>
                <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-600 mb-4">{f.tag}</span>
                <h2 className="text-3xl font-extrabold text-slate-900 leading-tight mb-3">{f.title}</h2>
                <p className="text-indigo-600 font-semibold mb-4">{f.subtitle}</p>
                <p className="text-slate-600 leading-relaxed mb-5">{f.body}</p>
                <div className="flex items-start gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
                  <span className="text-indigo-500 mt-0.5 flex-shrink-0">💡</span>
                  <p className="text-sm font-medium text-indigo-700">{f.highlight}</p>
                </div>
              </div>
              {/* Visual */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 shadow-sm">
                {f.visual}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* 6 Models deep dive */}
      <section className="bg-indigo-950 text-white py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-indigo-800 px-3 py-1 text-xs font-bold text-indigo-300 mb-4">6 Models · 6 Strategies</span>
            <h2 className="text-3xl font-extrabold mb-3">Every AI Model Is Different.<br />Your Strategy Should Be Too.</h2>
            <p className="text-indigo-300 max-w-xl mx-auto">We give you a tailored action plan for each model — because what moves your Claude score won't move your Grok score.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODELS.map((m) => (
              <div key={m.name} className="rounded-2xl bg-indigo-900/50 border border-indigo-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="font-bold text-sm" style={{ color: m.color }}>{m.name}</span>
                </div>
                <p className="text-indigo-200 text-sm leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional features grid */}
      <section className="bg-white py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Everything Else You Need</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Built for teams who take AI visibility seriously.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* API Push */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Content API Push</h3>
              <p className="text-sm text-slate-500 leading-relaxed">We generate the content — you publish it wherever you want. Push AI-optimized articles directly to your CMS via API. WordPress, Webflow, custom stack — all supported.</p>
              <span className="inline-block mt-3 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Available on Agency</span>
            </div>

            {/* Monthly alerts */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Monthly AI Score Alerts</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Get a monthly email report showing how your AI visibility scores changed. Track progress, catch drops early, and prove ROI to your team — automatically.</p>
              <span className="inline-block mt-3 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Coming Q3 2026</span>
            </div>

            {/* PDF Reports */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">PDF Report Export</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Download a beautifully formatted PDF report with your full analysis — scores, competitor benchmarks, sentiment breakdown, and complete strategy playbook. Ready to share with your team or clients.</p>
              <span className="inline-block mt-3 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Available on Pro & Agency</span>
            </div>

            {/* White-label */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
              <div className="h-10 w-10 rounded-xl bg-indigo-200 flex items-center justify-center mb-4">
                <svg className="h-5 w-5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">White-Label Client Portal</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Run AI visibility for up to 10 client brands under your logo, your domain, your brand. Deliver premium AI visibility reports to clients without them ever seeing VisibilityRadar. Starting at $599/mo.</p>
              <span className="inline-block mt-3 text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">Agency Plan · Up to 10 brands</span>
            </div>

            {/* Full API */}
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6 sm:col-span-2 lg:col-span-2">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-violet-200 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-violet-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-slate-900">Full Platform API</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-200 text-violet-700">COMING SOON</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">The entire VisibilityRadar platform — programmatically. Trigger analyses, pull scores, retrieve content, track competitors, and build your own dashboards on top of our data. Integrate AI visibility directly into your marketing stack.</p>
                  <div className="flex flex-wrap gap-2">
                    {["POST /analyze", "GET /scores", "GET /content", "POST /generate", "GET /competitors"].map((ep) => (
                      <code key={ep} className="text-[10px] font-mono bg-violet-100 text-violet-700 px-2 py-1 rounded">{ep}</code>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-white py-20 px-6 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-extrabold mb-4">Start with a Free Analysis</h2>
          <p className="text-indigo-300 mb-8">No credit card. No setup. See your AI visibility score in 2 minutes.</p>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-10 py-4 text-sm font-bold text-white transition-colors">
            Analyze Your Brand Free →
          </Link>
        </div>
      </section>
    </main>
  );
}
