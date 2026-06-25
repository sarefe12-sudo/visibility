"use client";

import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

interface Props {
  onLogoClick?: () => void;
  steps?: string[];
  currentStepIndex?: number;
  showStartOver?: boolean;
  onStartOver?: () => void;
}

export default function AppHeader({ onLogoClick, steps, currentStepIndex = 0, showStartOver, onStartOver }: Props) {
  const { isSignedIn } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm px-4 py-3 sm:px-6 sm:py-3.5">
      <div className="mx-auto flex max-w-6xl items-center justify-between">

        {/* Logo — always navigates to / */}
        <Link href="/" onClick={onLogoClick} className="text-left">
          <div className="flex flex-col items-start">
            <span className="font-extrabold text-lg leading-none -tracking-[0.5px]">
              <span style={{ color: "#0f172a" }}>Visibility</span>
              <span style={{ color: "#6366f1" }}>Radar</span>
            </span>
            <span className="text-[10px] font-semibold tracking-[3px] text-slate-400 uppercase mt-1">
              AI Brand Intelligence
            </span>
          </div>
        </Link>

        {/* Center — step indicators + start over */}
        <div className="hidden sm:flex items-center gap-3">
          {steps && (
            <div className="flex items-center gap-1">
              {steps.map((label, i) => {
                const done = i < currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      active ? "bg-slate-900 text-white" : done ? "text-slate-400" : "text-slate-300"
                    }`}>
                      {done && <span className="text-emerald-500">✓</span>}
                      {label}
                    </div>
                    {i < steps.length - 1 && <span className="text-slate-200 text-xs mx-0.5">·</span>}
                  </div>
                );
              })}
            </div>
          )}
          {showStartOver && (
            <button
              onClick={onStartOver}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Start Over
            </button>
          )}
        </div>

        {/* Right nav */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/blog" className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all">
              Blog
            </Link>
            <Link href="/pricing" className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all">
              Pricing
            </Link>
            <Link href="/contact" className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all">
              Contact
            </Link>
            {isSignedIn && (
              <>
                <Link href="/analyze" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-all">
                  Analyze
                </Link>
                <Link href="/dashboard" className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all">
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          {/* Auth */}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-all">
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all">
                Sign up free
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "shadow-lg border border-slate-200",
                }
              }}
              userProfileUrl="/profile"
            />
          </Show>
        </div>
      </div>
    </header>
  );
}
