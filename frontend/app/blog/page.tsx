import Link from "next/link";
import { posts } from "@/lib/posts";
import AppHeader from "@/components/AppHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — AI Brand Visibility & GEO Optimization",
  description: "Learn how to improve your brand's visibility in AI-generated answers from ChatGPT, Claude, Gemini, and Perplexity. Practical guides, strategy, and metrics.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "VisibilityRadar Blog — AI Brand Visibility", description: "Practical guides on GEO optimization, LLM SEO, and AI brand visibility.", url: "https://visibilityradar.ai/blog", type: "website" },
};

const CATEGORY_COLOR: Record<string, string> = {
  Fundamentals: "bg-indigo-50 text-indigo-600",
  Strategy:     "bg-violet-50 text-violet-600",
  Metrics:      "bg-emerald-50 text-emerald-600",
  Reporting:    "bg-amber-50 text-amber-600",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPage() {
  const sorted = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [featured, ...rest] = sorted;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader />

      <section className="pt-24 pb-8 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">AI Visibility Blog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Get Your Brand Into<br />
            <span className="text-indigo-600">AI Answers</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Practical guides on AI brand visibility, Share of Voice optimization, and the strategies that actually move your score.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl space-y-10">

          {/* Featured post */}
          <Link href={`/blog/${featured.slug}`} className="block group">
            <article className="rounded-2xl border border-slate-200 bg-white p-8 hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_COLOR[featured.category] ?? "bg-slate-50 text-slate-500"}`}>
                  {featured.category}
                </span>
                <span className="text-xs text-slate-400">{formatDate(featured.date)}</span>
                <span className="text-xs text-slate-400">· {featured.readTime} min read</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors leading-tight">
                {featured.title}
              </h2>
              <p className="text-slate-500 leading-relaxed mb-4">{featured.description}</p>
              <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                Read article →
              </span>
            </article>
          </Link>

          {/* Rest of posts */}
          <div className="grid gap-5 sm:grid-cols-2">
            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-200 hover:shadow-sm transition-all h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_COLOR[post.category] ?? "bg-slate-50 text-slate-500"}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-400">{post.readTime} min</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors leading-snug flex-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">{post.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{formatDate(post.date)}</span>
                    <span className="text-xs font-semibold text-indigo-600">Read →</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-8 text-center">
            <p className="text-sm font-bold text-indigo-900 mb-1">Ready to see your AI visibility score?</p>
            <p className="text-xs text-indigo-600 mb-5">Free scan — no signup required. Results in 60 seconds.</p>
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all">
              Check My Brand Score →
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
