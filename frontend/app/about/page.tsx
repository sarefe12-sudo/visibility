import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "About VisibilityRadar — AI Visibility Intelligence",
  description: "VisibilityRadar measures how AI models mention and perceive your brand, then helps you improve that visibility across Claude, GPT-4o, Gemini, Perplexity, and more.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <AppHeader />
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 text-white pt-36 pb-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-indigo-300 text-sm font-semibold uppercase tracking-widest mb-4">About Us</p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            The Future of Search Is AI.<br />
            <span className="text-indigo-300">Is Your Brand Ready?</span>
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed max-w-2xl mx-auto">
            Millions of people now ask AI instead of searching Google. VisibilityRadar helps brands understand — and improve — how AI models talk about them.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Mission</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-4">
            AI models like Claude, GPT-4o, and Gemini are becoming the primary interface between brands and their customers. Yet most brands have no idea how — or whether — they appear in AI responses.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed mb-4">
            VisibilityRadar was built to change that. We give brands real data: how often you are mentioned, how you are described, how you compare to competitors, and exactly what to do to improve your standing across every major AI model.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed">
            We believe AI visibility is the next SEO — and the brands that understand it early will have an enormous competitive advantage.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">How VisibilityRadar Works</h2>
          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "We probe every major AI model",
                body: "We send hundreds of realistic user prompts across Claude, GPT-4o, Gemini, Perplexity, Grok, and DeepSeek — the same questions real customers ask every day.",
              },
              {
                step: "02",
                title: "We measure your brand's presence",
                body: "We count how often your brand is mentioned, analyze the sentiment (positive, neutral, or negative), and benchmark you against your top competitors.",
              },
              {
                step: "03",
                title: "We generate a model-by-model strategy",
                body: "Each AI model has different training data, ranking signals, and behavioral tendencies. Our AI-powered playbook gives you tailored action steps for each one.",
              },
              {
                step: "04",
                title: "We help you create the content that moves the needle",
                body: "Our Content Studio generates SEO-optimized articles designed to get picked up by AI training pipelines — so your brand gets cited more, and cited better.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-600">{step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Vision</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-4">
            We are building the intelligence layer for the AI era of brand marketing. Just as Google Analytics became standard for web measurement, we believe AI visibility analytics will become standard for every brand that takes its digital presence seriously.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed mb-4">
            Our roadmap includes deeper competitive intelligence, white-label agency tooling, real-time alerts when your brand sentiment shifts, and an API so teams can integrate AI visibility data into their existing marketing stack.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed">
            The brands winning in AI search are the ones with the clearest, most consistent, most credible presence across the web. VisibilityRadar helps you build exactly that.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-950 text-white py-20 px-6 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-bold mb-4">See Where You Stand</h2>
          <p className="text-indigo-300 mb-8">Run a free analysis and find out how AI models talk about your brand today.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-8 py-4 text-sm font-bold text-white transition-colors"
          >
            Analyze Your Brand — Free
          </Link>
        </div>
      </section>
    </main>
  );
}
