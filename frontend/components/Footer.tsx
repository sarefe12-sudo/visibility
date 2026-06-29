import Link from "next/link";

const MODEL_DOTS = [
  { name: "Claude",     color: "#d97757" },
  { name: "GPT-4o",    color: "#10a37f" },
  { name: "Gemini",    color: "#4285f4" },
  { name: "Perplexity",color: "#20b2aa" },
  { name: "Grok",      color: "#a78bfa" },
  { name: "DeepSeek",  color: "#4d6bfe" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-extrabold text-slate-900">Visibility<span className="text-indigo-600">Radar</span></span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Know how every major AI model sees your brand — and get a model-specific strategy to rank higher.
            </p>
            <div className="flex gap-1.5 flex-wrap mb-4">
              {MODEL_DOTS.map((m) => (
                <span key={m.name} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                  style={{ backgroundColor: m.color + "12", borderColor: m.color + "30", color: m.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.name}
                </span>
              ))}
            </div>
            <a
              href="https://www.linkedin.com/company/13041414"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Follow on LinkedIn
            </a>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Product</p>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Free Demo" },
                { href: "/analyze", label: "Analyze Your Brand" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/pricing", label: "Pricing" },
                { href: "/blog", label: "Blog" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Features */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Key Features</p>
            <ul className="space-y-2.5">
              {[
                "6 AI Model Scoring",
                "Per-Model Strategy Playbook",
                "Competitor Comparison",
                "Sentiment Analysis",
                "Month-over-Month Tracking",
                "PDF Report Export",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-500">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                    <path d="M2 6l3 3 5-5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Why Per-Model Playbook */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Why Per-Model?</p>
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
              <p className="text-xs font-bold text-violet-800 mb-2">Each AI learns differently</p>
              <ul className="space-y-1.5">
                {[
                  { model: "Claude",     tip: "Wikipedia & long-form", color: "#d97757" },
                  { model: "Gemini",     tip: "Google ecosystem",      color: "#4285f4" },
                  { model: "Perplexity", tip: "Real-time web search",  color: "#20b2aa" },
                  { model: "Grok",       tip: "X/Twitter live feed",   color: "#a78bfa" },
                ].map((m) => (
                  <li key={m.model} className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                    <span style={{ color: m.color }} className="font-bold">{m.model}:</span> {m.tip}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="mt-3 block text-center rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-violet-700 transition-all">
                Get your playbook
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} VisibilityRadar. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Link href="/contact" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Contact</Link>
              <Link href="/terms" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Terms</Link>
              <Link href="/privacy" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Privacy</Link>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Real-time AI analysis across 6 models</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
