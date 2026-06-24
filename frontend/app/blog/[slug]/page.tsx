import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, posts } from "@/lib/posts";
import AppHeader from "@/components/AppHeader";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return posts.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} | VisibilityRadar Blog`,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: "article", publishedTime: post.date },
  };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-xl font-bold text-slate-900 mt-10 mb-4 leading-snug">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-base font-bold text-slate-800 mt-6 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("- **")) {
      const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
      if (match) {
        elements.push(
          <li key={i} className="flex gap-2 text-slate-600 text-sm leading-relaxed mb-1.5 ml-4">
            <span className="text-indigo-400 flex-shrink-0 mt-0.5">→</span>
            <span><strong className="text-slate-800">{match[1]}:</strong> {match[2]}</span>
          </li>
        );
      }
    } else if (line.startsWith("- ")) {
      elements.push(<li key={i} className="text-slate-600 text-sm leading-relaxed mb-1.5 ml-4 list-disc list-inside">{line.slice(2)}</li>);
    } else if (line.startsWith("| ") && line.includes("|")) {
      // Table
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!lines[i].includes("---")) tableLines.push(lines[i]);
        i++;
      }
      const [headerRow, ...bodyRows] = tableLines;
      const headers = headerRow.split("|").filter(Boolean).map(h => h.trim());
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-6 rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              {headers.map((h, j) => <th key={j} className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {bodyRows.map((row, ri) => (
                <tr key={ri}>{row.split("|").filter(Boolean).map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-slate-600">{cell.trim()}</td>
                ))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    } else if (line.startsWith("**")) {
      const text = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      elements.push(<p key={i} className="text-slate-600 text-sm leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: text }} />);
    } else if (line.trim() === "") {
      // empty line — skip
    } else {
      const text = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
      elements.push(<p key={i} className="text-slate-600 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: text }} />);
    }
    i++;
  }

  return elements;
}

const CATEGORY_COLOR: Record<string, string> = {
  Fundamentals: "bg-indigo-50 text-indigo-600",
  Strategy:     "bg-violet-50 text-violet-600",
  Metrics:      "bg-emerald-50 text-emerald-600",
  Reporting:    "bg-amber-50 text-amber-600",
};

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <AppHeader />

      <article className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-2xl">

          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-8">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Blog
          </Link>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-5">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_COLOR[post.category] ?? "bg-slate-50 text-slate-500"}`}>
              {post.category}
            </span>
            <span className="text-xs text-slate-400">{formatDate(post.date)}</span>
            <span className="text-xs text-slate-400">· {post.readTime} min read</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-5">{post.title}</h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-10 border-b border-slate-100 pb-10">{post.description}</p>

          {/* Content */}
          <div className="prose-content">
            {renderMarkdown(post.content)}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-2xl border border-indigo-100 bg-indigo-50 p-7 text-center">
            <p className="text-sm font-bold text-indigo-900 mb-1">See your brand&apos;s AI visibility score</p>
            <p className="text-xs text-indigo-600 mb-5">Free scan — no signup, results in 60 seconds across 6 AI models.</p>
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all">
              Check My Brand →
            </Link>
          </div>

        </div>
      </article>
    </main>
  );
}
