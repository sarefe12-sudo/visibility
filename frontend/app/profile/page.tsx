"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ApiKeyCard from "@/components/ApiKeyCard";
import type { AppUser, UserType } from "@/lib/supabase";

const CANCEL_REASONS = [
  "Too expensive",
  "Not using it enough",
  "Missing features I need",
  "Switching to a competitor",
  "Technical issues",
  "Just testing / exploring",
  "Other",
];

function CancelModal({ tier, onClose, onConfirm }: {
  tier: string;
  onClose: () => void;
  onConfirm: (reason: string, note: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setLoading(true);
    await onConfirm(reason, note);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Cancel your {tier} subscription</h2>
        <p className="text-sm text-slate-500 mb-5">
          We&apos;re sorry to see you go. Let us know why — it helps us improve.
        </p>
        <div className="space-y-2 mb-4">
          {CANCEL_REASONS.map((r) => (
            <button key={r} onClick={() => setReason(r)}
              className={`w-full text-left rounded-xl border px-4 py-2.5 text-sm transition-all ${
                reason === r
                  ? "border-indigo-500 bg-indigo-50 text-indigo-800 font-medium"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}>
              {r}
            </button>
          ))}
        </div>
        {(reason === "Other" || reason === "Missing features I need") && (
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={reason === "Missing features I need" ? "Which features?" : "Tell us more..."}
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-4 resize-none"
          />
        )}
        <div className="flex gap-3 mt-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
            Keep my plan
          </button>
          <button onClick={handleSubmit} disabled={!reason || loading}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-all disabled:opacity-40">
            {loading ? "Cancelling..." : "Confirm cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

const USER_TYPES: { value: UserType; label: string; desc: string; icon: string }[] = [
  { value: "individual", label: "Individual",  desc: "Freelancer or solo marketer tracking their own brand", icon: "👤" },
  { value: "corporate",  label: "Corporate",   desc: "In-house team managing a company brand",             icon: "🏢" },
  { value: "agency",     label: "Agency",      desc: "Marketing agency managing multiple client brands",   icon: "🚀" },
];

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<UserType>("individual");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/"); return; }

    fetch("/api/user").then(r => r.json()).then(({ user: u }) => {
      if (u) {
        setAppUser(u);
        setName(u.name ?? user?.fullName ?? "");
        setUserType(u.user_type ?? "individual");
      }
    });
  }, [isLoaded, isSignedIn, router, user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, user_type: userType }),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    setSaving(false);
  }

  const tier = appUser?.tier ?? "free";

  async function handleCancelConfirm(reason: string, note: string) {
    const res = await fetch("/api/cancel-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, customNote: note }),
    });
    if (res.ok) {
      setShowCancel(false);
      setCancelDone(true);
      setAppUser((u) => u ? { ...u, tier: "free" } : u);
    } else {
      alert("Something went wrong. Please contact support.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {showCancel && (
        <CancelModal
          tier={tier}
          onClose={() => setShowCancel(false)}
          onConfirm={handleCancelConfirm}
        />
      )}
      <AppHeader onLogoClick={() => router.push("/")} />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-24 pb-20">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-8">Account Settings</h1>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Subscription */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Subscription</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tier === "free" ? "🆓" : tier === "pro" ? "⚡" : "🏢"}</span>
                <div>
                  <p className="text-sm font-bold capitalize text-slate-800">{tier} Plan</p>
                  <p className="text-xs text-slate-400">
                    {tier === "free" ? "1 analysis included" : tier === "pro" ? "$29/month" : "$99/month"}
                  </p>
                </div>
              </div>
              {tier === "free" && (
                <button type="button" onClick={() => router.push("/pricing")}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all">
                  Upgrade →
                </button>
              )}
              {(tier === "pro" || tier === "agency") && !cancelDone && (
                <button type="button" onClick={() => setShowCancel(true)}
                  className="rounded-xl border border-red-200 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-all">
                  Cancel subscription
                </button>
              )}
              {cancelDone && (
                <span className="text-xs text-slate-400 italic">Cancelled — active until billing period ends</span>
              )}
            </div>
          </div>

          {/* Profile info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile</p>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                {user?.primaryEmailAddress?.emailAddress ?? "—"}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          {/* Account type */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Account Type</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {USER_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setUserType(t.value)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    userType === t.value
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <p className={`text-sm font-semibold mt-2 ${userType === t.value ? "text-indigo-700" : "text-slate-700"}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-all"
          >
            {saved ? "✓ Saved" : saving ? "Saving…" : "Save Changes"}
          </button>
        </form>

        {/* MCP API Keys */}
        <div className="mt-6">
          <ApiKeyCard tier={tier} />
        </div>

        {/* MCP explainer */}
        {(tier === "pro" || tier === "agency") && (
          <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">What is MCP?</p>
            <p className="text-sm text-indigo-800 leading-relaxed mb-3">
              <strong>MCP (Model Context Protocol)</strong> lets you use VisibilityRadar directly inside AI tools like Claude Desktop, Cursor, and Windsurf — without opening a browser.
            </p>
            <p className="text-sm text-indigo-700 leading-relaxed mb-3">
              Once set up, you can simply ask your AI assistant: <em>&quot;Analyze Nike&apos;s AI visibility&quot;</em> and get a full score report instantly. Results are automatically saved to your dashboard.
            </p>
            <div className="space-y-2">
              {[
                "Analyze any brand directly from your AI chat",
                "Compare competitors without leaving your workflow",
                "Results sync to your VisibilityRadar dashboard",
                "Uses your existing monthly analysis credits",
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-indigo-700">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
