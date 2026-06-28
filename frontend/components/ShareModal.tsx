"use client";

import { useState } from "react";

interface Props {
  analysisId: string;
  brand: string;
  score: number;
  market: string;
  onClose: () => void;
}

export default function ShareModal({ analysisId, brand, score, market, onClose }: Props) {
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);

  const shareUrl = `https://visibilityradar.ai/share/${analysisId}`;
  const embedCode = `<iframe src="${shareUrl}" width="600" height="400" style="border:none;border-radius:16px;" title="${brand} AI Visibility Score"></iframe>`;
  const twitterText = `${brand} scored ${score}/100 on AI Visibility — measured across ChatGPT, Claude, Gemini & more 🤖\n\nSee the full breakdown:`;
  const linkedinText = `${brand} scored ${score}/100 on AI Visibility (measured across ChatGPT, Claude, Gemini, Perplexity, Grok & DeepSeek).\n\nAI models are increasingly how people discover brands. See where ${brand} stands:\n${shareUrl}\n\n#AIMarketing #BrandVisibility #GEO`;

  function copy(text: string, type: "link" | "embed") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Share your score</h2>
            <p className="text-xs text-slate-400 mt-0.5">{brand} · {score}/100</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-800">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter / X
          </a>
          <button
            onClick={() => copy(linkedinText, "link")}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-700">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            {copied === "link" ? "Copied!" : "LinkedIn"}
          </button>
        </div>

        {/* Direct link */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Direct link</p>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <span className="flex-1 text-xs text-slate-600 truncate font-mono">{shareUrl}</span>
            <button
              onClick={() => copy(shareUrl, "link")}
              className="flex-shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all"
            >
              {copied === "link" ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Embed */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Embed on your website</p>
          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <span className="flex-1 text-xs text-slate-500 font-mono break-all leading-relaxed">{embedCode}</span>
            <button
              onClick={() => copy(embedCode, "embed")}
              className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              {copied === "embed" ? "✓" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
