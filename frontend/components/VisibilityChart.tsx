"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  brand: string;
  brandScore: number;
  competitorScores: Record<string, number>;
}

const BRAND_COLOR = "#6366f1";
const COMP_COLORS = ["#94a3b8", "#a78bfa", "#60a5fa", "#f472b6", "#fb923c"];

export default function VisibilityChart({ brand, brandScore, competitorScores }: Props) {
  const data = [
    { name: brand, score: brandScore, isBrand: true },
    ...Object.entries(competitorScores).map(([name, score]) => ({ name, score, isBrand: false })),
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Score Comparison</p>
          <p className="text-xs text-slate-500 mt-0.5">You vs competitors</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND_COLOR }} />
            <span className="text-xs text-slate-500">{brand}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500">Competitors</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barCategoryGap="32%" barGap={4}>
            <XAxis
              dataKey="name"
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#cbd5e1", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />
            <Tooltip
              cursor={{ fill: "rgba(99,102,241,0.04)", radius: 8 }}
              contentStyle={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#0f172a",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                padding: "10px 14px",
              }}
              formatter={(value) => [`${Number(value).toFixed(1)} / 100`, "AI Score"]}
            />
            <Bar dataKey="score" radius={[8, 8, 2, 2]}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.isBrand ? BRAND_COLOR : COMP_COLORS[(i - 1) % COMP_COLORS.length]}
                  fillOpacity={d.isBrand ? 1 : 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
