'use client'

import { useEffect, useState } from 'react'

interface AuditLog {
  id: string
  actor_email: string
  action: string
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/audit')
      .then(r => r.json())
      .then(d => { setLogs(d.logs ?? []); setLoading(false) })
  }, [])

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      admin_update_user: 'Updated user',
      user_login: 'User login',
      analysis_created: 'Analysis generated',
      subscription_created: 'Subscription created',
      subscription_cancelled: 'Subscription cancelled',
      account_held: 'Account suspended',
    }
    return map[action] ?? action
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-6">Audit Logs</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center text-slate-500 py-16">No audit logs yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{l.actor_email}</td>
                  <td className="px-4 py-3 text-slate-300">{actionLabel(l.action)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                    {l.details ? JSON.stringify(l.details) : '—'}
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
