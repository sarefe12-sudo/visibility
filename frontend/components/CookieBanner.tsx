'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('vr_cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('vr_cookie_consent', 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem('vr_cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-5">
        <p className="text-sm font-semibold text-slate-800 mb-1">We value your privacy</p>
        <p className="text-sm text-slate-500 mb-4">
          We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.{' '}
          <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={decline}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Reject All
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
