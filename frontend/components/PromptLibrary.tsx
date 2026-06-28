"use client";

import { useEffect, useState } from "react";

interface CustomPrompt {
  id: string;
  text: string;
  category: string;
  created_at: string;
}

interface Props {
  tier: "free" | "pro" | "agency";
}

const MAX_BY_TIER = { free: 0, pro: 10, agency: 50 };

const CATEGORIES = ["custom", "comparison", "recommendation", "use-case", "competitor"];

const SAMPLE_PROMPTS = [
  { text: "What are the best CRM tools for SaaS startups?", category: "recommendation" },
  { text: "Compare the top marketing automation platforms in 2025", category: "comparison" },
  { text: "What software do growth marketing teams typically use?", category: "use-case" },
  { text: "Which tools would you recommend for email marketing?", category: "recommendation" },
  { text: "What are alternatives to HubSpot for small businesses?", category: "competitor" },
  { text: "Best project management tools for remote teams?", category: "recommendation" },
  { text: "What AI tools do content marketers use daily?", category: "use-case" },
  { text: "Which platforms are most popular for customer support?", category: "comparison" },
  { text: "What are the leading SEO tools used by agencies?", category: "recommendation" },
  { text: "Best analytics platforms for e-commerce?", category: "use-case" },
];

export default function PromptLibrary({ tier }: Props) {
  const [prompts, setPrompts] = useState<CustomPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState("custom");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const max = MAX_BY_TIER[tier];

  useEffect(() => {
    if (tier === "free") { setLoading(false); return; }
    fetch("/api/custom-prompts")
      .then((r) => r.json())
      .then(({ prompts: p }) => { setPrompts(p ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tier]);

  async function addPrompt() {
    if (!newText.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/custom-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText.trim(), category: newCategory }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setPrompts((p) => [data.prompt, ...p]);
      setNewText("");
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  }

  async function deletePrompt(id: string) {
    await fetch(`/api/custom-prompts?id=${id}`, { method: "DELETE" });
    setPrompts((p) => p.filter((x) => x.id !== id));
  }

  if (tier === "free") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-slate-800">Custom Prompt Library</p>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-100">Pro</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Add your own prompts to test — &ldquo;What tools do growth teams use?&rdquo; — and see if your brand gets mentioned across all AI models.
        </p>
        <div className="space-y-2 mb-4">
          {SAMPLE_PROMPTS.slice(0, 4).map((p, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 opacity-60 select-none">
              <span className="text-xs text-slate-500 truncate">{p.text}</span>
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-400 flex-shrink-0">{p.category}</span>
            </div>
          ))}
          <div className="text-center py-2">
            <span className="text-xs text-slate-400">+ {SAMPLE_PROMPTS.length - 4} more sample prompts</span>
          </div>
        </div>
        <a
          href="/pricing"
          className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all"
        >
          Upgrade to Pro →
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="h-4 w-48 bg-slate-100 rounded animate-pulse mb-3" />
        {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-slate-50 rounded-xl mb-2 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-slate-800">Custom Prompt Library</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {prompts.length} / {max} custom prompts
            {" · "}used in your next analysis
          </p>
        </div>
        {prompts.length < max && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
            </svg>
            Add prompt
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 mb-4">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="e.g. What are the best tools for content marketing?"
            rows={2}
            maxLength={300}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none mb-3"
          />
          <div className="flex items-center gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 focus:outline-none"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-xs text-slate-400 ml-auto">{newText.length}/300</span>
            <button
              onClick={addPrompt}
              disabled={adding || !newText.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all disabled:opacity-40"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      )}

      {/* Prompt list */}
      {prompts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">No custom prompts yet</p>
          <p className="text-xs text-slate-400">Add prompts that match how your customers search in AI</p>
        </div>
      ) : (
        <div className="space-y-2">
          {prompts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <span className="flex-1 text-sm text-slate-700 truncate">{p.text}</span>
              <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-400 flex-shrink-0">
                {p.category}
              </span>
              <button
                onClick={() => deletePrompt(p.id)}
                className="flex-shrink-0 rounded-lg p-1 text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
                title="Delete prompt"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-4">
        Custom prompts are automatically included in every new analysis you run.
      </p>
    </div>
  );
}
