"use client";

import { useState } from "react";
import type { PromptWithTrend } from "@/types";

interface Props {
  prompts: PromptWithTrend[];
  onConfirm: (prompts: string[]) => void;
  analyzing: boolean;
}

const FREE_LIMIT = 10;

export default function PromptEditor({ prompts: initial, onConfirm, analyzing }: Props) {
  const [prompts, setPrompts] = useState<PromptWithTrend[]>(initial);
  const [newPrompt, setNewPrompt] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const atLimit = prompts.length >= FREE_LIMIT;

  function remove(i: number) { setPrompts(prompts.filter((_, idx) => idx !== i)); }
  function addPrompt() {
    const val = newPrompt.trim();
    if (!val || prompts.find(p => p.prompt === val) || atLimit) return;
    setPrompts([...prompts, { prompt: val, trend_score: 0 }]);
    setNewPrompt("");
  }
  function startEdit(i: number) { setEditIndex(i); setEditValue(prompts[i].prompt); }
  function saveEdit() {
    if (editIndex === null) return;
    const val = editValue.trim();
    if (val) { const u = [...prompts]; u[editIndex] = { ...u[editIndex], prompt: val }; setPrompts(u); }
    setEditIndex(null);
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Review & Edit Prompts</h2>
            <p className="text-xs text-slate-400 mt-1">These {prompts.length} queries will be sent to all active AI models</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${atLimit ? "border-amber-200 bg-amber-50 text-amber-600" : "border-emerald-200 bg-emerald-50 text-emerald-600"}`}>
            {prompts.length} / {FREE_LIMIT} prompts
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {prompts.map((p, i) => (
          <div key={i} className="group card-sm px-4 py-3 hover:border-slate-300 transition-all">
            {editIndex === i ? (
              <div className="flex gap-2">
                <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-slate-500" />
                <button onClick={saveEdit} className="text-xs text-emerald-600 font-semibold">Save</button>
                <button onClick={() => setEditIndex(null)} className="text-xs text-slate-400">Cancel</button>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 text-xs text-slate-300 w-4">{i + 1}.</span>
                <p className="flex-1 min-w-0 text-sm text-slate-700 leading-relaxed">{p.prompt}</p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                  <button onClick={() => startEdit(i)} className="text-xs text-slate-400 hover:text-slate-600">Edit</button>
                  <button onClick={() => remove(i)} className="text-xs text-red-400 hover:text-red-500">Remove</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {prompts.length === 0 && <div className="card-sm py-8 text-center"><p className="text-sm text-slate-400">All prompts removed. Add one below.</p></div>}
      </div>

      {atLimit && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <p className="text-xs text-amber-700">Free plan: 10 prompt limit reached. <a href="/pricing" className="font-semibold underline">Upgrade to Pro</a> for 25 prompts.</p>
        </div>
      )}
      <div className="flex gap-2">
        <input value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPrompt())}
          placeholder={atLimit ? "Upgrade to add more prompts…" : "Add your own prompt…"}
          disabled={atLimit}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400" />
        <button type="button" onClick={addPrompt} disabled={atLimit} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed">+ Add</button>
      </div>

      <button onClick={() => onConfirm(prompts.map(p => p.prompt))} disabled={analyzing || prompts.length === 0}
        className="btn-shine w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30 shadow-sm">
        {analyzing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Analyzing… ({prompts.length} prompts × each model)
          </span>
        ) : `Run Analysis — ${prompts.length} prompts`}
      </button>
    </div>
  );
}
