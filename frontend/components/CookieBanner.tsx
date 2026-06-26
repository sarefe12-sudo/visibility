'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('vr_cookie_consent')
    if (!consent) setTimeout(() => setVisible(true), 600)
  }, [])

  function dismiss(value: 'accepted' | 'declined') {
    setClosing(true)
    setTimeout(() => {
      localStorage.setItem('vr_cookie_consent', value)
      setVisible(false)
      setClosing(false)
    }, 300)
  }

  if (!visible) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${closing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
      {/* Backdrop blur strip */}
      <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-2">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/30">
            {/* Decorative gradient top edge */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

            <div className="px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Icon + text */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug">Cookie Preferences</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    We only use essential cookies for authentication and sessions — no ads, no tracking.{' '}
                    <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => dismiss('declined')}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                >
                  Reject
                </button>
                <button
                  onClick={() => dismiss('accepted')}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/25"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
