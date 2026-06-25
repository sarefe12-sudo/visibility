"use client";

import type { AnalyzeResponse } from "@/types";

interface Props {
  data: AnalyzeResponse;
}

const SENTIMENT_CONFIG = {
  positive: { label: "Positive", color: "emerald", bar: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="#059669"/>
    </svg>
  )},
  neutral: { label: "Neutral", color: "slate", bar: "bg-slate-400", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="2"/><path d="M8.5 9.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm5 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM8 15h8" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )},
  negative: { label: "Negative", color: "rose", bar: "bg-rose-500", bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-700", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 3c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z" fill="#e11d48"/>
    </svg>
  )},
};

export default function SentimentPanel({ data }: Props) {
  const summary = data.sentiment_summary;
  const total = summary.positive + summary.neutral + summary.negative;
  if (total === 0) return null;

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  // Per-prompt sentiment breakdown
  const promptSentiments: { prompt: string; sentiments: Record<string, "positive" | "neutral" | "negative"> }[] = [];
  for (const r of data.raw_results) {
    const sentiments: Record<string, "positive" | "neutral" | "negative"> = {};
    for (const [model, mr] of Object.entries(r.model_responses)) {
      if (mr.mentions[data.brand] > 0) {
        sentiments[model] = mr.sentiment ?? "neutral";
      }
    }
    if (Object.keys(sentiments).length > 0) {
      promptSentiments.push({ prompt: r.prompt, sentiments });
    }
  }

  // Overall dominant sentiment
  const dominant =
    summary.positive >= summary.neutral && summary.positive >= summary.negative ? "positive" :
    summary.negative > summary.positive && summary.negative >= summary.neutral ? "negative" : "neutral";
  const cfg = SENTIMENT_CONFIG[dominant];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Brand Sentiment</p>
          <p className="text-[11px] text-slate-400 mt-0.5">How AI models describe {data.brand} when they mention it</p>
        </div>
        <div className={`flex items-center gap-2 rounded-full border ${cfg.border} ${cfg.bg} px-3 py-1.5`}>
          {cfg.icon}
          <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="space-y-3 mb-6">
        {(["positive", "neutral", "negative"] as const).map((key) => {
          const c = SENTIMENT_CONFIG[key];
          const count = summary[key];
          const p = pct(count);
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-20 flex-shrink-0">
                {c.icon}
                <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
              </div>
              <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                  style={{ width: `${p}%` }}
                />
              </div>
              <div className="w-16 text-right flex-shrink-0">
                <span className="text-xs font-bold text-slate-700">{p}%</span>
                <span className="text-[10px] text-slate-400 ml-1">({count})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-prompt breakdown */}
      {promptSentiments.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-2">Per Prompt</p>
          <div className="space-y-2">
            {promptSentiments.map(({ prompt, sentiments }) => (
              <div key={prompt} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="flex-1 text-xs text-slate-600 leading-relaxed truncate">{prompt}</p>
                <div className="flex gap-1 flex-shrink-0">
                  {Object.entries(sentiments).map(([model, s]) => {
                    const dot =
                      s === "positive" ? "bg-emerald-400" :
                      s === "negative" ? "bg-rose-400" : "bg-slate-300";
                    const modelLabels: Record<string, string> = { claude: "C", gpt4o: "G", gemini: "Ge", perplexity: "P", grok: "Gr", deepseek: "D" };
                    return (
                      <div key={model} className="flex items-center gap-0.5" title={`${model}: ${s}`}>
                        <span className={`h-2 w-2 rounded-full ${dot}`} />
                        <span className="text-[9px] text-slate-400">{modelLabels[model] ?? model[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400"/> Positive</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300"/> Neutral</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400"/> Negative</span>
          </div>
        </div>
      )}
    </div>
  );
}
