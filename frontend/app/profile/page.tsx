"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import type { AppUser, UserType } from "@/lib/supabase";

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

  return (
    <main className="min-h-screen bg-slate-50">
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
      </div>
    </main>
  );
}
