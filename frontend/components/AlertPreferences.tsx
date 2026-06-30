"use client";

import { useEffect, useState } from "react";

interface AlertPrefs {
  id: string;
  email: string;
  enabled: boolean;
}

interface Props {
  tier: "free" | "pro" | "agency";
  userEmail: string;
}

export default function AlertPreferences({ tier, userEmail }: Props) {
  const [prefs, setPrefs] = useState<AlertPrefs | null>(null);
  const [email, setEmail] = useState(userEmail);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/alert-preferences")
      .then((r) => r.json())
      .then(({ prefs: p, userEmail: ue }) => {
        if (p) {
          setPrefs(p);
          setEnabled(p.enabled);
          setEmail(p.email);
        } else {
          setEmail(ue ?? userEmail);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userEmail]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/alert-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, email }),
      });
      const data = await res.json();
      if (data.prefs) {
        setPrefs(data.prefs);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  if (tier === "free") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-slate-800">Weekly Email Digest</p>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-100">Pro</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Get a weekly email comparing your AI visibility scores — score changes, model breakdowns, competitor alerts. Available on the Pro plan.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="h-4 w-48 bg-slate-100 rounded animate-pulse mb-3" />
        <div className="h-3 w-64 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-slate-800">Weekly Email Digest</p>
          <p className="text-xs text-slate-400 mt-0.5">Sent every Monday · score changes + competitor alerts</p>
        </div>
        {/* Toggle */}
        <button
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? "bg-indigo-600" : "bg-slate-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Send to</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5">
            <p className="text-xs text-indigo-700 font-medium">
              You&apos;ll receive a weekly comparison of all your analyzed brands — score trends, per-model breakdowns, and competitor alerts.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={save}
          disabled={saving || (!!prefs && prefs.enabled === enabled && prefs.email === email)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all disabled:opacity-40"
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save preferences"}
        </button>
        {saved && <span className="text-xs text-emerald-600 font-medium">Changes saved!</span>}
      </div>
    </div>
  );
}
