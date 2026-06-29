"use client"

import { useState } from "react"
import Link from "next/link"
import AppHeader from "@/components/AppHeader"
import { useRouter } from "next/navigation"

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "quickstart", label: "Quick Start" },
  { id: "authentication", label: "Authentication" },
  { id: "mcp", label: "MCP Server" },
  { id: "endpoints", label: "API Endpoints" },
  { id: "errors", label: "Errors & Limits" },
]

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="absolute top-3 right-3 rounded-lg bg-slate-700 hover:bg-slate-600 px-2 py-1 text-[10px] text-slate-300 transition-all"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    post: "bg-blue-100 text-blue-700",
    get: "bg-emerald-100 text-emerald-700",
    delete: "bg-red-100 text-red-700",
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${colors[color] ?? "bg-slate-100 text-slate-600"}`}>
      {label}
    </span>
  )
}

export default function DocsPage() {
  const router = useRouter()
  const [active, setActive] = useState("overview")

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader onLogoClick={() => router.push("/")} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-20">
        <div className="flex gap-10">

          {/* Sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Documentation</p>
              <nav className="space-y-1">
                {SECTIONS.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={() => setActive(s.id)}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active === s.id ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
              <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-bold text-indigo-800 mb-1">Need an API key?</p>
                <p className="text-xs text-indigo-600 mb-3">Available on Pro & Agency plans.</p>
                <Link href="/profile" className="block text-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all">
                  Get API Key →
                </Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-12">

            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 mb-5 shadow-sm">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Docs</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
                API & MCP Documentation
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
                Integrate VisibilityRadar into your workflow — via MCP (Claude Desktop, Cursor, Windsurf) or directly via REST API.
              </p>
            </div>

            {/* Overview */}
            <section id="overview" className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4">Overview</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                VisibilityRadar exposes two integration surfaces:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-sm font-bold text-indigo-800 mb-1">🔌 MCP Server</p>
                  <p className="text-xs text-indigo-700 leading-relaxed">Use VisibilityRadar directly inside Claude Desktop, Cursor, or Windsurf. No browser needed — just ask your AI assistant.</p>
                  <a href="#mcp" className="mt-2 block text-xs font-bold text-indigo-600 hover:underline">MCP setup →</a>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-800 mb-1">🌐 REST API</p>
                  <p className="text-xs text-slate-600 leading-relaxed">Trigger analyses, retrieve history, and build dashboards programmatically using standard HTTP requests.</p>
                  <a href="#endpoints" className="mt-2 block text-xs font-bold text-indigo-600 hover:underline">API reference →</a>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs text-amber-800"><strong>Plan requirement:</strong> MCP and API access require a <Link href="/pricing" className="underline font-bold">Pro or Agency plan</Link>. Daily limits: Pro = 5/day, Agency = 20/day.</p>
              </div>
            </section>

            {/* Quick Start */}
            <section id="quickstart" className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4">Quick Start</h2>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">Get your API key</p>
                    <p className="text-xs text-slate-500">Go to <Link href="/profile" className="text-indigo-600 hover:underline font-semibold">Account Settings → MCP API Keys</Link> and click <strong>Generate Key</strong>. Copy it — it's shown only once.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">Choose your integration</p>
                    <p className="text-xs text-slate-500">Use the MCP server for AI assistant integration, or call the REST API directly from your app.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">Run your first analysis</p>
                    <Code>{`curl -X POST https://visibilityradar.ai/api/mcp/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: vr_your_key_here" \\
  -d '{"brand": "Nike", "market": "global", "competitors": ["Adidas"]}'`}</Code>
                  </div>
                </li>
              </ol>
            </section>

            {/* Authentication */}
            <section id="authentication" className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4">Authentication</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                All API requests require an API key passed in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">x-api-key</code> header.
              </p>
              <Code>{`x-api-key: vr_your_api_key_here`}</Code>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 text-xs text-slate-600">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 mt-0.5"><path d="M2 6l3 3 5-5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  API keys start with <code className="bg-slate-100 px-1 rounded font-mono">vr_</code> followed by 48 hex characters.
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-600">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 mt-0.5"><path d="M2 6l3 3 5-5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Keys are shown only once at creation. If lost, revoke and generate a new one.
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-600">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 mt-0.5"><path d="M2 6l3 3 5-5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  You can create up to 3 API keys per account.
                </div>
              </div>
            </section>

            {/* MCP Server */}
            <section id="mcp" className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="text-lg font-extrabold text-slate-900 mb-2">MCP Server</h2>
              <p className="text-sm text-slate-500 mb-6">Use VisibilityRadar directly from Claude Desktop, Cursor, or Windsurf.</p>

              <h3 className="text-sm font-bold text-slate-800 mb-3">Installation</h3>
              <Code>{`npx visibilityradar-mcp`}</Code>

              <h3 className="text-sm font-bold text-slate-800 mt-6 mb-3">Claude Desktop Config</h3>
              <p className="text-xs text-slate-500 mb-2">
                Edit <code className="bg-slate-100 px-1 rounded font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS) or <code className="bg-slate-100 px-1 rounded font-mono">%APPDATA%\Claude\claude_desktop_config.json</code> (Windows):
              </p>
              <Code>{`{
  "mcpServers": {
    "visibilityradar": {
      "command": "npx",
      "args": ["visibilityradar-mcp"],
      "env": {
        "VR_API_KEY": "vr_your_api_key_here"
      }
    }
  }
}`}</Code>

              <h3 className="text-sm font-bold text-slate-800 mt-6 mb-3">Cursor Config</h3>
              <p className="text-xs text-slate-500 mb-2">Edit <code className="bg-slate-100 px-1 rounded font-mono">~/.cursor/mcp.json</code>:</p>
              <Code>{`{
  "mcpServers": {
    "visibilityradar": {
      "command": "npx",
      "args": ["visibilityradar-mcp"],
      "env": {
        "VR_API_KEY": "vr_your_api_key_here"
      }
    }
  }
}`}</Code>

              <h3 className="text-sm font-bold text-slate-800 mt-6 mb-3">Available Tools</h3>
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">analyze_brand</code>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">Run a full AI visibility analysis for a brand.</p>
                  <Code>{`// Parameters
{
  brand: string,        // required — e.g. "Nike"
  market?: string,      // optional — e.g. "US", "global"
  competitors?: string[] // optional — max 3
}`}</Code>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">get_brand_history</code>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">Fetch past analysis results and score trends.</p>
                  <Code>{`// Parameters
{
  brand: string  // required — brand name to look up
}`}</Code>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-800 mt-6 mb-3">Example Usage</h3>
              <div className="rounded-xl bg-slate-900 p-4 text-xs font-mono text-slate-300 leading-relaxed">
                <p className="text-slate-500 mb-1"># In Claude Desktop or Cursor, just ask:</p>
                <p className="text-emerald-400">&quot;Analyze Nike&apos;s AI visibility in the US market vs Adidas&quot;</p>
                <p className="text-slate-500 mt-3 mb-1"># Or check history:</p>
                <p className="text-emerald-400">&quot;Show me the AI visibility history for Notion&quot;</p>
              </div>
            </section>

            {/* API Endpoints */}
            <section id="endpoints" className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="text-lg font-extrabold text-slate-900 mb-6">API Endpoints</h2>

              {/* Analyze */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Badge label="POST" color="post" />
                  <code className="text-sm font-mono font-bold text-slate-800">/api/mcp/analyze</code>
                </div>
                <p className="text-xs text-slate-500 mb-4">Run a full AI visibility analysis. Results are saved to your dashboard automatically.</p>

                <p className="text-xs font-bold text-slate-700 mb-2">Request</p>
                <Code>{`curl -X POST https://visibilityradar.ai/api/mcp/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: vr_your_key_here" \\
  -d '{
    "brand": "Nike",
    "market": "US",
    "competitors": ["Adidas", "Puma"]
  }'`}</Code>

                <p className="text-xs font-bold text-slate-700 mt-4 mb-2">Request Body</p>
                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-bold text-slate-600">Field</th>
                        <th className="text-left px-4 py-2 font-bold text-slate-600">Type</th>
                        <th className="text-left px-4 py-2 font-bold text-slate-600">Required</th>
                        <th className="text-left px-4 py-2 font-bold text-slate-600">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { field: "brand", type: "string", req: "Yes", desc: "Brand name to analyze" },
                        { field: "market", type: "string", req: "No", desc: "Target market — e.g. US, global, TR. Defaults to global" },
                        { field: "competitors", type: "string[]", req: "No", desc: "Competitor brand names. Max 3 (Pro), max 5 (Agency)" },
                      ].map(r => (
                        <tr key={r.field} className="bg-white">
                          <td className="px-4 py-2 font-mono text-indigo-700">{r.field}</td>
                          <td className="px-4 py-2 text-slate-500">{r.type}</td>
                          <td className="px-4 py-2 text-slate-500">{r.req}</td>
                          <td className="px-4 py-2 text-slate-500">{r.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs font-bold text-slate-700 mt-4 mb-2">Response</p>
                <Code>{`{
  "brand": "Nike",
  "market": "US",
  "overall_score": 78,
  "label": "Strong",
  "model_scores": [
    { "model": "Claude", "score": 82 },
    { "model": "GPT-4o", "score": 79 },
    { "model": "Gemini", "score": 74 },
    { "model": "Perplexity", "score": 80 },
    { "model": "Grok", "score": 76 },
    { "model": "DeepSeek", "score": 71 }
  ],
  "sentiment": {
    "positive": 72,
    "neutral": 21,
    "negative": 7
  },
  "competitors": [
    { "brand": "Adidas", "score": 61 },
    { "brand": "Puma", "score": 44 }
  ],
  "top_recommendations": [
    { "action": "Build a stronger Wikipedia presence", "priority": "HIGH" },
    { "action": "Earn coverage on Perplexity-indexed publications", "priority": "HIGH" }
  ],
  "dashboard_url": "https://visibilityradar.ai/dashboard"
}`}</Code>
              </div>

              {/* History */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge label="GET" color="get" />
                  <code className="text-sm font-mono font-bold text-slate-800">/api/mcp/history</code>
                </div>
                <p className="text-xs text-slate-500 mb-4">Retrieve the last 20 analyses. Filter by brand using the query parameter.</p>

                <p className="text-xs font-bold text-slate-700 mb-2">Request</p>
                <Code>{`curl https://visibilityradar.ai/api/mcp/history?brand=Nike \\
  -H "x-api-key: vr_your_key_here"`}</Code>

                <p className="text-xs font-bold text-slate-700 mt-4 mb-2">Query Parameters</p>
                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-bold text-slate-600">Parameter</th>
                        <th className="text-left px-4 py-2 font-bold text-slate-600">Required</th>
                        <th className="text-left px-4 py-2 font-bold text-slate-600">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-4 py-2 font-mono text-indigo-700">brand</td>
                        <td className="px-4 py-2 text-slate-500">No</td>
                        <td className="px-4 py-2 text-slate-500">Filter results by brand name</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-xs font-bold text-slate-700 mt-4 mb-2">Response</p>
                <Code>{`{
  "analyses": [
    {
      "overall_score": 78,
      "market": "US",
      "created_at": "2026-06-29T10:00:00Z"
    }
  ]
}`}</Code>
              </div>
            </section>

            {/* Errors */}
            <section id="errors" className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4">Errors & Rate Limits</h2>

              <h3 className="text-sm font-bold text-slate-800 mb-3">Rate Limits</h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs mb-6">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-bold text-slate-600">Plan</th>
                      <th className="text-left px-4 py-2 font-bold text-slate-600">Daily MCP limit</th>
                      <th className="text-left px-4 py-2 font-bold text-slate-600">Monthly limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-white">
                      <td className="px-4 py-2 font-semibold text-slate-700">Pro</td>
                      <td className="px-4 py-2 text-slate-500">5 / day</td>
                      <td className="px-4 py-2 text-slate-500">10 / month</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-2 font-semibold text-slate-700">Agency</td>
                      <td className="px-4 py-2 text-slate-500">20 / day</td>
                      <td className="px-4 py-2 text-slate-500">Unlimited</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-bold text-slate-800 mb-3">Error Codes</h3>
              <div className="space-y-3">
                {[
                  { code: "401", title: "Unauthorized", desc: "Missing or invalid API key." },
                  { code: "403", title: "Forbidden", desc: "API access requires Pro or Agency plan." },
                  { code: "429", title: "Rate Limited", desc: "Daily or monthly analysis limit reached. Upgrade or wait until reset." },
                  { code: "500", title: "Server Error", desc: "Analysis failed. Try again in a few seconds." },
                ].map(e => (
                  <div key={e.code} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                    <span className="flex-shrink-0 rounded-lg bg-red-50 border border-red-100 px-2 py-1 text-xs font-bold text-red-600 font-mono">{e.code}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{e.title}</p>
                      <p className="text-xs text-slate-500">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom CTA */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-8 text-center">
              <p className="text-sm font-bold text-indigo-900 mb-2">Ready to integrate?</p>
              <p className="text-xs text-indigo-600 mb-5">Get your API key from Account Settings and start in minutes.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/profile" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-all">
                  Get API Key →
                </Link>
                <Link href="/faq#mcp" className="rounded-xl border border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-all">
                  FAQ
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
