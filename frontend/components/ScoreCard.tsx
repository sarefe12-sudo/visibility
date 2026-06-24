interface Props {
  brand: string;
  score: number;
  label?: string;
  highlight?: boolean;
}

export default function ScoreCard({ brand, score, label = "Visibility Score", highlight = false }: Props) {
  const isHigh = score >= 60;
  const isMid = score >= 30;

  const color = isHigh ? "#059669" : isMid ? "#d97706" : "#dc2626";
  const bgGrad = isHigh
    ? "from-emerald-50 to-white border-emerald-200"
    : isMid
    ? "from-amber-50 to-white border-amber-200"
    : "from-red-50 to-white border-red-200";
  const barColor = isHigh ? "bg-emerald-500" : isMid ? "bg-amber-400" : "bg-red-400";
  const status = isHigh ? "Strong" : isMid ? "Growing" : "Low";
  const statusCls = isHigh
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : isMid
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-red-100 text-red-700 border-red-200";

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-6 transition-all ${highlight ? bgGrad : "border-slate-200 bg-white from-white to-white"}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <p className="text-sm font-semibold text-slate-700 truncate">{brand}</p>
        </div>
        <span className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusCls}`}>
          {status}
        </span>
      </div>

      <div className="flex items-end gap-1 mb-4">
        <span className="text-6xl font-black tabular-nums leading-none" style={{ color }}>{score.toFixed(0)}</span>
        <span className="mb-1.5 text-base font-normal text-slate-300">/100</span>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-300">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}
