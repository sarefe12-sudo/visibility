"use client";

import { useState, useRef, useEffect } from "react";
import type { Competitor } from "@/types";

interface Props {
  onGenerate: (brand: string, website: string, competitors: Competitor[], market: string) => void;
  loading: boolean;
  maxCompetitors?: number;
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 transition-all focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100";

const MARKETS = [
  { value: "global", label: "🌍", name: "Global" },
  { value: "TR",     label: "🇹🇷", name: "Turkey" },
  { value: "US",     label: "🇺🇸", name: "USA" },
  { value: "GB",     label: "🇬🇧", name: "UK" },
  { value: "DE",     label: "🇩🇪", name: "Germany" },
];

const OTHER_MARKETS = [
  { value: "FR", label: "🇫🇷 France" },
  { value: "ES", label: "🇪🇸 Spain" },
  { value: "IT", label: "🇮🇹 Italy" },
  { value: "NL", label: "🇳🇱 Netherlands" },
  { value: "PL", label: "🇵🇱 Poland" },
  { value: "SE", label: "🇸🇪 Sweden" },
  { value: "NO", label: "🇳🇴 Norway" },
  { value: "DK", label: "🇩🇰 Denmark" },
  { value: "FI", label: "🇫🇮 Finland" },
  { value: "PT", label: "🇵🇹 Portugal" },
  { value: "AT", label: "🇦🇹 Austria" },
  { value: "CH", label: "🇨🇭 Switzerland" },
  { value: "BE", label: "🇧🇪 Belgium" },
  { value: "RU", label: "🇷🇺 Russia" },
  { value: "UA", label: "🇺🇦 Ukraine" },
  { value: "JP", label: "🇯🇵 Japan" },
  { value: "KR", label: "🇰🇷 South Korea" },
  { value: "CN", label: "🇨🇳 China" },
  { value: "IN", label: "🇮🇳 India" },
  { value: "SG", label: "🇸🇬 Singapore" },
  { value: "AU", label: "🇦🇺 Australia" },
  { value: "NZ", label: "🇳🇿 New Zealand" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "MX", label: "🇲🇽 Mexico" },
  { value: "BR", label: "🇧🇷 Brazil" },
  { value: "AR", label: "🇦🇷 Argentina" },
  { value: "SA", label: "🇸🇦 Saudi Arabia" },
  { value: "AE", label: "🇦🇪 UAE" },
  { value: "ZA", label: "🇿🇦 South Africa" },
  { value: "NG", label: "🇳🇬 Nigeria" },
];

const ALL_OTHERS = [...OTHER_MARKETS].sort((a, b) => a.label.localeCompare(b.label));

export default function BrandForm({ onGenerate, loading, maxCompetitors }: Props) {
  const [brand, setBrand] = useState("");
  const [website, setWebsite] = useState("");
  const [market, setMarket] = useState("global");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [compName, setCompName] = useState("");
  const [compSite, setCompSite] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [suggestedComps, setSuggestedComps] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowOther(false);
      }
    }
    if (showOther) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showOther]);

  const isPreset = MARKETS.some((m) => m.value === market);
  const selectedOther = !isPreset ? ALL_OTHERS.find((m) => m.value === market) : null;

  const compAtLimit = maxCompetitors !== undefined && competitors.length >= maxCompetitors;

  function handleBrandChange(val: string) {
    setBrand(val);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (val.trim().length < 2) { setSuggestedComps([]); return; }
    suggestTimer.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch("https://zealous-perception-production-2d31.up.railway.app/suggest-competitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand: val.trim(), market }),
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestedComps((data.competitors as string[]).slice(0, 5));
        }
      } catch { /* silent */ }
      finally { setLoadingSuggestions(false); }
    }, 800);
  }

  function addSuggestedComp(name: string) {
    if (compAtLimit || competitors.find((c) => c.name === name)) return;
    setCompetitors([...competitors, { name }]);
    setSuggestedComps((prev) => prev.filter((s) => s !== name));
  }

  function addCompetitor() {
    const name = compName.trim();
    if (!name || competitors.find((c) => c.name === name) || compAtLimit) return;
    setCompetitors([...competitors, { name, website: compSite.trim() || undefined }]);
    setCompName("");
    setCompSite("");
  }

  function removeCompetitor(name: string) {
    setCompetitors(competitors.filter((c) => c.name !== name));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brand.trim()) return;
    onGenerate(brand.trim(), website.trim(), competitors, market);
  }

  const currentMarket = MARKETS.find((m) => m.value === market);
  const currentLabel =
    currentMarket ? `${currentMarket.label} ${currentMarket.name}` :
    ALL_OTHERS.find((m) => m.value === market)?.label ??
    "Other";

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Brand
            <span className="rounded px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] normal-case tracking-normal font-bold border border-emerald-100">required</span>
          </label>
          <input value={brand} onChange={(e) => handleBrandChange(e.target.value)} placeholder="Nike" required className={inputCls} />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Website <span className="text-slate-300 normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="nike.com" className={inputCls} />
        </div>
      </div>

      {/* Market */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Market</label>
        <div className="flex items-center gap-1.5">
          {/* Preset markets — scrollable row */}
          <div className="flex gap-1.5 flex-wrap">
            {MARKETS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => { setMarket(m.value); setShowOther(false); }}
                className={`flex-shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1 ${
                  market === m.value
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                <span>{m.label}</span>
                <span>{m.name}</span>
              </button>
            ))}
          </div>

          {/* Other button — outside scroll so dropdown is never clipped */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowOther((v) => !v)}
              className={`flex-shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-all flex items-center gap-1.5 ${
                !isPreset
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {!isPreset && selectedOther ? selectedOther.label : "🌐 Other"}
              <svg className={`h-3 w-3 transition-transform ${showOther ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showOther && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto py-1">
                  {ALL_OTHERS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => { setMarket(m.value); setShowOther(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors hover:bg-slate-50 ${
                        market === m.value ? "bg-slate-50 text-slate-800 font-semibold" : "text-slate-600"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          {market === "global"
            ? "Prompts in English, Google Trends global data"
            : `Prompts & Trends focused on ${currentLabel}`}
        </p>
      </div>

      {/* Competitors divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          Add Competitors
          {maxCompetitors !== undefined ? (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${compAtLimit ? "border-red-200 bg-red-50 text-red-500" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
              {competitors.length}/{maxCompetitors}
            </span>
          ) : (
            <span className="text-slate-300">({competitors.length})</span>
          )}
        </span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      <div>
        {compAtLimit && (
          <p className="mb-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {maxCompetitors === 1
              ? "Demo limit: 1 competitor max. Upgrade to Pro for up to 5."
              : `Limit reached: max ${maxCompetitors} competitors on your plan.`
            }
          </p>
        )}

        {/* Suggested competitors */}
        {(suggestedComps.length > 0 || loadingSuggestions) && (
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              {loadingSuggestions ? (
                <><svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Finding competitors…</>
              ) : (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Suggested competitors — click to add</>
              )}
            </p>
            {suggestedComps.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestedComps.map((s) => {
                  const alreadyAdded = !!competitors.find((c) => c.name === s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSuggestedComp(s)}
                      disabled={alreadyAdded || compAtLimit}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                        alreadyAdded
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600 cursor-default"
                          : "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300"
                      }`}
                    >
                      {alreadyAdded ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <span className="font-black">+</span>
                      )}
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_1fr_auto]">
          <input value={compName} onChange={(e) => setCompName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCompetitor())} placeholder="Adidas" disabled={compAtLimit} className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`} />
          <input value={compSite} onChange={(e) => setCompSite(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCompetitor())} placeholder="adidas.com" disabled={compAtLimit} className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`} />
          <button type="button" onClick={addCompetitor} disabled={compAtLimit} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed">
            + Add
          </button>
        </div>
        {competitors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {competitors.map((c) => (
              <span key={c.name} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                {c.name}
                {c.website && <span className="text-slate-400">· {c.website}</span>}
                <button type="button" onClick={() => removeCompetitor(c.name)} className="text-slate-300 hover:text-slate-500 transition-colors ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !brand.trim()}
        className="btn-shine w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating prompts…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Generate Prompts
            <span className="opacity-60">→</span>
          </span>
        )}
      </button>
      {!brand.trim() && (
        <p className="text-center text-xs text-slate-400 -mt-1">
          ↑ Enter your brand name above to continue
        </p>
      )}
    </form>
  );
}
