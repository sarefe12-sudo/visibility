"use client";

import { useState } from "react";
import type { MultiModelPromptResult } from "@/types";

const MODEL_LABELS: Record<string, string> = { claude:"Claude", gpt4o:"GPT-4o", gemini:"Gemini", perplexity:"Perplexity", grok:"Grok", deepseek:"DeepSeek" };

interface Props {
  brand: string;
  results: MultiModelPromptResult[];
  activeModels: string[];
}

export default function PromptsTable({ brand, results, activeModels }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>(activeModels[0] ?? "claude");

  return (
    <div className="card p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Raw Results</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {activeModels.map((m) => (
          <button key={m} onClick={() => setActiveTab(m)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
              activeTab === m ? "bg-slate-900 text-white border-slate-900" : "text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
            }`}>
            {MODEL_LABELS[m] ?? m}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {results.map((r, i) => {
          const modelResp = r.model_responses[activeTab];
          const brandMentions = modelResp?.mentions[brand] ?? 0;
          const isOpen = expanded === i;
          return (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50">
              <button onClick={() => setExpanded(isOpen ? null : i)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:bg-slate-100">
                <span className="text-sm font-medium text-slate-700 truncate max-w-[55vw] sm:max-w-none">{r.prompt}</span>
                <div className="ml-3 flex flex-shrink-0 items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex gap-1">
                    {activeModels.map((m) => {
                      const count = r.model_responses[m]?.mentions[brand] ?? 0;
                      return <span key={m} className={`rounded px-1.5 py-0.5 text-xs font-medium ${count > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"}`}>{MODEL_LABELS[m]?.slice(0,3) ?? m}: {count}</span>;
                    })}
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${brandMentions > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-slate-200 bg-slate-100 text-slate-400"}`}>
                    {brandMentions > 0 ? `${brandMentions}×` : "0"}
                  </span>
                  <span className="text-xs text-slate-400">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>
              {isOpen && modelResp && (
                <div className="space-y-3 px-4 pb-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 pt-3">
                    {modelResp.sentiment === "positive" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Positive
                      </span>
                    )}
                    {modelResp.sentiment === "negative" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Negative
                      </span>
                    )}
                    {(!modelResp.sentiment || modelResp.sentiment === "neutral") && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Neutral
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-500">{modelResp.response}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(modelResp.mentions).map(([name, count]) => (
                      <span key={name} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">{name}: {count}×</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
