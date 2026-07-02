"use client";

import { useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, source: "contact_page" }),
    });
    setStatus(res.ok ? "success" : "error");
  }

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all";

  return (
    <main className="min-h-screen bg-white">
      <AppHeader />

      <section className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-4xl">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Get in Touch</span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Contact Us</h1>
            <p className="text-slate-500 max-w-md mx-auto">Questions about pricing, the product, or a custom plan for your agency? We reply within 24 hours.</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-[1fr_400px]">

            {/* Left — info cards */}
            <div className="space-y-4">
              {[
                {
                  bg: "bg-indigo-50", border: "border-indigo-100",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  iconBg: "bg-indigo-100",
                  title: "General Questions",
                  body: "Product features, how it works, or anything else. We're happy to help.",
                },
                {
                  bg: "bg-violet-50", border: "border-violet-100",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="7" width="20" height="14" rx="2" stroke="#7c3aed" strokeWidth="2"/>
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M12 12v4M10 14h4" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ),
                  iconBg: "bg-violet-100",
                  title: "Agency & Enterprise",
                  body: "Custom plans, white-label setup, volume pricing, and dedicated support.",
                },
                {
                  bg: "bg-emerald-50", border: "border-emerald-100",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="9" cy="7" r="4" stroke="#059669" strokeWidth="2"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ),
                  iconBg: "bg-emerald-100",
                  title: "Partnerships",
                  body: "Integration partners, resellers, and referral programs.",
                },
                {
                  bg: "bg-rose-50", border: "border-rose-100",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#e11d48" strokeWidth="2"/>
                      <path d="M12 8v4M12 16h.01" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ),
                  iconBg: "bg-rose-100",
                  title: "Bug Reports",
                  body: "Found something broken? Let us know and we'll fix it fast.",
                },
              ].map(c => (
                <div key={c.title} className={`flex gap-4 rounded-2xl border ${c.border} ${c.bg} px-5 py-4`}>
                  <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ${c.iconBg}`}>
                    {c.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-0.5">{c.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{c.body}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 mt-2">
                <p className="text-xs font-semibold text-indigo-700 mb-1">Response time</p>
                <p className="text-xs text-indigo-600">We typically reply within <strong>24 hours</strong> on business days.</p>
              </div>

              <a
                href="https://www.linkedin.com/company/13041414"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 hover:bg-blue-100 transition-colors group"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a66c2">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Follow us on LinkedIn</p>
                  <p className="text-xs text-blue-600">Stay updated with the latest news</p>
                </div>
              </a>

              <a
                href="https://x.com/CHARTQ110335"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 hover:bg-slate-100 transition-colors group"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-slate-200 group-hover:bg-slate-300 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Follow us on X</p>
                  <p className="text-xs text-slate-500">Updates, tips & AI visibility insights</p>
                </div>
              </a>

            </div>

            {/* Right — form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
              {status === "success" ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">✓</div>
                  <p className="text-sm font-bold text-slate-800 mb-1">Message received!</p>
                  <p className="text-xs text-slate-500 mb-5">We'll get back to you within 24 hours.</p>
                  <button onClick={() => setStatus("idle")} className="text-xs text-indigo-600 hover:underline">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</label>
                      <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Jane Smith" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</label>
                      <input value={form.company} onChange={e => update("company", e.target.value)} placeholder="Acme Inc." className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input type="email" required value={form.email} onChange={e => update("email", e.target.value)} placeholder="jane@acme.com" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea required rows={5} value={form.message} onChange={e => update("message", e.target.value)} placeholder="Tell us what you need…" className={`${inputCls} resize-none`} />
                  </div>

                  {status === "error" && (
                    <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
                  )}

                  <button type="submit" disabled={status === "loading"} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all disabled:opacity-40">
                    {status === "loading" ? "Sending…" : "Send Message →"}
                  </button>
                  <p className="text-xs text-slate-400 text-center">By submitting, you agree to our <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
