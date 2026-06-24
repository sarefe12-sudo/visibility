const ICON_COLORS = [
  { bg: "bg-indigo-50", border: "border-indigo-100", dot: "bg-indigo-500" },
  { bg: "bg-emerald-50", border: "border-emerald-100", dot: "bg-emerald-500" },
  { bg: "bg-violet-50", border: "border-violet-100", dot: "bg-violet-500" },
  { bg: "bg-amber-50", border: "border-amber-100", dot: "bg-amber-500" },
  { bg: "bg-cyan-50", border: "border-cyan-100", dot: "bg-cyan-500" },
];

interface Props { insights: string[] }

export default function InsightsList({ insights }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Key Findings</p>
        <p className="text-xs text-slate-500 mt-0.5">{insights.length} insights from your analysis</p>
      </div>

      <div className="divide-y divide-slate-50">
        {insights.map((insight, i) => {
          const style = ICON_COLORS[i % ICON_COLORS.length];
          return (
            <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
              <div className={`flex-shrink-0 mt-0.5 h-7 w-7 rounded-xl border ${style.border} ${style.bg} flex items-center justify-center`}>
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{insight}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
