'use client'

import { useEffect, useState } from 'react'

interface BillingEvent {
  id: string
  event_type: string
  amount_cents: number
  lemon_subscription_id: string
  created_at: string
  users: { email: string; tier: string } | null
}

interface SubStats { events: BillingEvent[]; mrr: number; pro: number; agency: number }

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/subscriptions').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const eventLabel: Record<string, string> = {
    subscription_created: 'New Subscription',
    subscription_updated: 'Subscription Updated',
    subscription_cancelled: 'Cancelled',
    subscription_expired: 'Expired',
    subscription_payment_success: 'Payment Success',
    subscription_payment_failed: 'Payment Failed',
  }

  const eventColor: Record<string, string> = {
    subscription_created: 'text-emerald-400',
    subscription_payment_success: 'text-emerald-400',
    subscription_cancelled: 'text-red-400',
    subscription_expired: 'text-red-400',
    subscription_updated: 'text-blue-400',
    subscription_payment_failed: 'text-amber-400',
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>
  if (!data) return <div className="p-8 text-red-400">Failed to load</div>

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-6">Subscription Management</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">MRR</div>
          <div className="text-2xl font-bold text-white">${data.mrr.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">ARR</div>
          <div className="text-2xl font-bold text-white">${(data.mrr * 12).toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pro Subscribers</div>
          <div className="text-2xl font-bold text-indigo-400">{data.pro}</div>
          <div className="text-xs text-slate-500 mt-1">${data.pro * 49}/mo</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Agency Subscribers</div>
          <div className="text-2xl font-bold text-amber-400">{data.agency}</div>
          <div className="text-xs text-slate-500 mt-1">${data.agency * 199}/mo</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Products</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-white">Pro Plan · $49/mo</div>
                <div className="text-xs text-slate-500">Product ID: 1168029</div>
              </div>
              <span className="text-xs bg-indigo-900/40 text-indigo-400 px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-white">Agency Plan · $199/mo</div>
                <div className="text-xs text-slate-500">Product ID: 1168012</div>
              </div>
              <span className="text-xs bg-amber-900/40 text-amber-400 px-2 py-1 rounded-full">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Webhook Events Configured</div>
          <div className="space-y-1.5 text-sm">
            {Object.keys(eventLabel).map(e => (
              <div key={e} className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                <code className={`text-xs ${eventColor[e] ?? 'text-slate-300'}`}>{e}</code>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300">Recent Billing Events</h2>
        </div>
        {data.events.length === 0 ? (
          <div className="text-center text-slate-500 py-12 text-sm">No billing events yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map(e => (
                <tr key={e.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-300">{e.users?.email ?? '—'}</td>
                  <td className={`px-4 py-3 font-medium text-xs ${eventColor[e.event_type] ?? 'text-slate-400'}`}>
                    {eventLabel[e.event_type] ?? e.event_type}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {e.amount_cents > 0 ? `$${(e.amount_cents / 100).toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
