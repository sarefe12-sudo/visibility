"use client";

const MODEL_LABELS: Record<string, string> = { claude: "Claude", gpt4o: "GPT-4o", gemini: "Gemini", perplexity: "Perplexity", grok: "Grok", deepseek: "DeepSeek" };
const MODEL_COLORS: Record<string, string> = { claude: "#d97757", gpt4o: "#10a37f", gemini: "#4285f4", perplexity: "#20b2aa", grok: "#a78bfa", deepseek: "#4d6bfe" };

function ModelLogo({ modelKey, size = 20 }: { modelKey: string; size?: number }) {
  const s = size;
  const c = MODEL_COLORS[modelKey] ?? "#94a3b8";
  switch (modelKey) {
    case "claude": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M8 16l2.5-7 1.5 4.5 1.5-4.5L16 16" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "gpt4o": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9.5" r="2.5" fill={c}/><path d="M7 17c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>;
    case "gemini": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 4c0 4.42-3.58 8-8 8 4.42 0 8 3.58 8 8 0-4.42 3.58-8 8-8-4.42 0-8-3.58-8-8z" fill={c}/></svg>;
    case "perplexity": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M7 8h10M7 12h10M7 16h6" stroke={c} strokeWidth="2" strokeLinecap="round"/><circle cx="17" cy="16" r="2" fill={c}/></svg>;
    case "grok": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7L7 17" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></svg>;
    case "deepseek": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2.5" fill={c}/><path d="M12 6v3M12 15v3M6 12h3M15 12h3" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>;
    default: return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#cbd5e1" strokeWidth="1.5"/></svg>;
  }
}

interface Props { modelScores: Record<string, number>; overallScore: number; }

export default function ModelScoresCard({ modelScores, overallScore }: Props) {
  const entries = Object.entries(modelScores);
  const best = entries.reduce((a, b) => b[1] > a[1] ? b : a, entries[0]);
  const worst = entries.reduce((a, b) => b[1] < a[1] ? b : a, entries[0]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Per-Model Scores</p>
          <p className="text-xs text-slate-500 mt-0.5">{entries.length} AI models tested</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
          <span className="text-xs text-slate-400">Overall</span>
          <span className="text-sm font-black text-slate-800">{overallScore}</span>
        </div>
      </div>

      {/* Bars */}
      <div className="px-6 py-5 space-y-4">
        {entries.map(([key, score]) => {
          const isBest = key === best[0] && entries.length > 1;
          const isWorst = key === worst[0] && entries.length > 1;
          return (
            <div key={key} className="group">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-36 flex-shrink-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                    <ModelLogo modelKey={key} size={15} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{MODEL_LABELS[key] ?? key}</span>
                  {isBest && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 leading-4">Best</span>}
                  {isWorst && <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-1.5 py-0.5 leading-4">Low</span>}
                </div>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, backgroundColor: MODEL_COLORS[key] ?? "#94a3b8" }}
                  />
                </div>
                <span className="text-sm font-black tabular-nums w-9 text-right" style={{ color: MODEL_COLORS[key] ?? "#94a3b8" }}>{score.toFixed(0)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
