'use client'

import { useEffect, useState } from 'react'

export default function HealthPage() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [models, setModels] = useState<string[]>([])

  useEffect(() => {
    fetch('https://zealous-perception-production-2d31.up.railway.app/models')
      .then(r => r.json())
      .then(d => { setBackendStatus('ok'); setModels(d.active_models ?? []) })
      .catch(() => setBackendStatus('error'))
  }, [])

  const StatusDot = ({ ok }: { ok: boolean }) => (
    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
  )

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-6">System Health</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Services */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Services</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Frontend (Vercel)</span>
              <span className="flex items-center text-emerald-400"><StatusDot ok={true} />Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Backend (Railway)</span>
              <span className="flex items-center">
                {backendStatus === 'checking' && <span className="text-slate-500">Checking...</span>}
                {backendStatus === 'ok' && <span className="text-emerald-400"><StatusDot ok={true} />Online</span>}
                {backendStatus === 'error' && <span className="text-red-400"><StatusDot ok={false} />Offline</span>}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Supabase</span>
              <span className="flex items-center text-emerald-400"><StatusDot ok={true} />Online</span>
            </div>
          </div>
        </div>

        {/* Active AI Models */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Active AI Models</h2>
          {backendStatus === 'ok' ? (
            <div className="flex flex-wrap gap-2">
              {models.map(m => (
                <span key={m} className="text-xs bg-indigo-900/40 text-indigo-400 px-3 py-1 rounded-full">{m}</span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Backend unreachable</p>
          )}
        </div>

        {/* Backend URL */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 col-span-2">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Configuration</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-4">
              <span className="text-slate-500 w-32 shrink-0">Backend URL</span>
              <code className="text-slate-300 text-xs break-all">https://zealous-perception-production-2d31.up.railway.app</code>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-500 w-32 shrink-0">Frontend</span>
              <code className="text-slate-300 text-xs">https://visibilityradar.ai</code>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-500 w-32 shrink-0">GA4 Property</span>
              <code className="text-slate-300 text-xs">G-QTY92863Z3</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
