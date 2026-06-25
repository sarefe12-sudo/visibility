import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LLM Brand Optimization (LLMO) — Complete Guide",
  description: "A complete guide to LLM Brand Optimization (LLMO) — the strategies that get your brand recommended by AI models like ChatGPT, Claude, and Gemini.",
  alternates: { canonical: "/resources/llm-brand-optimization" },
  openGraph: { title: "LLM Brand Optimization (LLMO) Guide", description: "The complete LLMO playbook — strategies to get your brand recommended by AI models.", url: "https://visibilityradar.ai/resources/llm-brand-optimization", type: "article" },
};

export default function LlmBrandOptimization() {
  return (
    <main className="min-h-screen bg-white">
      <AppHeader />
      <article className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Resource</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 leading-tight">LLM Brand Optimization</h1>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed border-b border-slate-100 pb-10">
            LLM Brand Optimization (LLMO) is the practice of improving your brand's representation in large language model training data and outputs. It's the AI-era evolution of SEO.
          </p>

          <div className="space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">The LLMO Framework</h2>
              <p>LLMO operates across three layers: <strong className="text-slate-800">presence</strong> (can AI find information about you?), <strong className="text-slate-800">authority</strong> (does AI trust that information?), and <strong className="text-slate-800">relevance</strong> (does AI associate you with the right queries?).</p>
              <p className="mt-3">Most brands score poorly on all three without realizing it. The good news: each layer is improvable with targeted actions.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Layer 1: Presence — Be Findable</h2>
              <ul className="space-y-2">
                {["Create or enhance your Wikipedia page with accurate, well-cited information", "Build profiles on all major review platforms in your category", "Get mentioned in industry publications, podcasts, and roundups", "Publish press releases on wire services that get indexed widely", "Ensure your Crunchbase, LinkedIn, and company pages are complete"].map(item => (
                  <li key={item} className="flex gap-2 text-sm"><span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Layer 2: Authority — Be Trusted</h2>
              <ul className="space-y-2">
                {["Earn backlinks from high-domain-authority news sites", "Get quoted as an expert in industry publications", "Publish original research that other sources cite", "Maintain consistent, accurate information across all sources", "Respond to and accumulate positive reviews on trusted platforms"].map(item => (
                  <li key={item} className="flex gap-2 text-sm"><span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Layer 3: Relevance — Be Associated</h2>
              <ul className="space-y-2">
                {["Create FAQ content covering every question buyers ask about your category", "Publish comparison pages (Your Brand vs Competitor)", "Use natural language that mirrors how people query AI assistants", "Implement FAQ and Product schema markup on your website", "Create content around high-intent queries in your industry"].map(item => (
                  <li key={item} className="flex gap-2 text-sm"><span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Measuring LLMO Progress</h2>
              <p>LLMO without measurement is guesswork. You need a baseline score, tracked monthly, across multiple AI models. Your score tells you which models include your brand and which don't — giving you a precise, model-specific optimization target.</p>
              <p className="mt-3">Brands that combine LLMO actions with monthly tracking see average score improvements of 15–30 points within 90 days.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Quick Start Checklist</h2>
              <div className="space-y-1.5">
                {[
                  "Run a baseline AI visibility scan (free at VisibilityRadar)",
                  "Identify which AI models score you lowest",
                  "Check your Wikipedia page — does it exist and is it accurate?",
                  "Audit your review platform presence",
                  "Create one FAQ page targeting your weakest-performing prompts",
                  "Set up monthly tracking to measure progress",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-200 text-[10px] font-bold text-slate-400 flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-7 text-center">
              <p className="text-sm font-bold text-indigo-900 mb-1">Start with your baseline score</p>
              <p className="text-xs text-indigo-600 mb-5">Free scan — see where you stand across 6 AI models.</p>
              <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all">
                Get My Score →
              </Link>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
