export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">

        {/* Top row */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand col */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-baseline gap-0 mb-3 w-fit">
              <span className="text-xl font-extrabold tracking-tight" style={{ color: "#0f172a" }}>Visibility</span>
              <span className="text-xl font-extrabold tracking-tight" style={{ color: "#6366f1" }}>Radar</span>
            </a>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              VisibilityRadar measures how often your brand appears in AI-generated responses
              across Claude, GPT-4o, Gemini, Perplexity, Grok and DeepSeek. Track your AI
              visibility score, benchmark against competitors, and get actionable recommendations
              to grow your brand in the age of AI search.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://twitter.com"
                aria-label="Follow VisibilityRadar on X (Twitter)"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                aria-label="Follow VisibilityRadar on LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product col */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Product</h3>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><a href="#" className="hover:text-slate-800 transition-colors">AI Visibility Score</a></li>
              <li><a href="#" className="hover:text-slate-800 transition-colors">Competitor Analysis</a></li>
              <li><a href="#" className="hover:text-slate-800 transition-colors">Multi-Model Tracking</a></li>
              <li><a href="#" className="hover:text-slate-800 transition-colors">AI Recommendations</a></li>
              <li><a href="#" className="hover:text-slate-800 transition-colors">PDF Reports</a></li>
            </ul>
          </div>

          {/* Resources col */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Resources</h3>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><a href="#" className="hover:text-slate-800 transition-colors">What is AI Visibility?</a></li>
              <li><a href="#" className="hover:text-slate-800 transition-colors">How AI Search Works</a></li>
              <li><a href="#" className="hover:text-slate-800 transition-colors">LLM Brand Optimization</a></li>
              <li><a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-800 transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            © {year} VisibilityRadar. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 text-center sm:text-right">
            Powered by Claude · GPT-4o · Gemini · Perplexity · Grok · DeepSeek
          </p>
        </div>

      </div>
    </footer>
  );
}
