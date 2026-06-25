import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How AI Search Works | VisibilityRadar",
  description: "Learn how AI models like ChatGPT, Claude, and Gemini decide which brands to recommend — and what you can do to appear in their answers.",
};

export default function HowAiSearchWorks() {
  return (
    <main className="min-h-screen bg-white">
      <AppHeader />
      <article className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-4 py-1.5">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-wide">Resource</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 leading-tight">How AI Search Works</h1>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed border-b border-slate-100 pb-10">
            Understanding how AI models process and generate brand recommendations is the foundation of any AI visibility strategy.
          </p>

          <div className="space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Training Data, Not Real-Time Search</h2>
              <p>Unlike Google, AI models don't fetch live results when answering a query. They generate responses based on patterns learned from training data — a massive snapshot of the web collected months or years before you're asking the question.</p>
              <p className="mt-3">This has a critical implication: the content you publish today may not influence AI responses for 3–6 months, when the next model training cycle incorporates new data. Building AI visibility is a long-term strategy, not a quick win.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">What Sources AI Models Trust</h2>
              <div className="space-y-3">
                {[
                  { icon: "📖", title: "Wikipedia", body: "The single highest-weight source. A well-maintained Wikipedia article directly increases the probability of inclusion in AI responses." },
                  { icon: "⭐", title: "Review Platforms", body: "G2, Trustpilot, Capterra, TripAdvisor, and Booking.com are heavily indexed. High review volume signals legitimacy to AI models." },
                  { icon: "📰", title: "News & Press", body: "Coverage in TechCrunch, Forbes, Reuters, and industry publications carries high authority weight in training data." },
                  { icon: "💬", title: "Forums & Communities", body: "Reddit, Quora, and niche communities are frequently cited sources — especially for product recommendations." },
                  { icon: "📋", title: "Structured Content", body: "FAQ pages with schema markup, product pages with structured data, and comparison content are easily extracted by AI." },
                ].map(s => (
                  <div key={s.title} className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <span className="text-xl flex-shrink-0">{s.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">How Different AI Models Behave</h2>
              <p>Not all AI models behave the same. Each has different training data sources, different update frequencies, and different weightings for authority signals.</p>
              <div className="mt-4 space-y-2">
                {[
                  ["Claude", "Strong emphasis on accuracy and citation of authoritative sources. Wikipedia and established publications carry high weight."],
                  ["GPT-4o", "Broad training corpus. Review platforms and community content particularly influential."],
                  ["Gemini", "Google-trained — real-time web access on some queries. Google Business Profile and Search presence relevant."],
                  ["Perplexity", "Actively cites sources. Real-time web retrieval makes current content more impactful than other models."],
                ].map(([model, desc]) => (
                  <div key={model} className="flex gap-3 text-sm">
                    <span className="font-bold text-slate-800 w-24 flex-shrink-0">{model}</span>
                    <span className="text-slate-500">{desc}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">The Recommendation Loop</h2>
              <p>When an AI model is asked "what's the best [product category]?", it generates a response by combining brand mentions from training data with learned quality signals. Brands that appear frequently, in positive contexts, from authoritative sources get recommended. Brands with sparse coverage get ignored.</p>
              <p className="mt-3">This creates a compounding dynamic: brands that invest in AI visibility early build a larger footprint, which leads to more AI mentions, which leads to more brand awareness, which leads to more content being created about them — reinforcing the cycle.</p>
            </section>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-7 text-center">
              <p className="text-sm font-bold text-indigo-900 mb-1">See how AI models talk about your brand</p>
              <p className="text-xs text-indigo-600 mb-5">Free scan — no signup required.</p>
              <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all">
                Scan My Brand →
              </Link>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
