'use client'

import { useEffect, useState } from 'react'

interface Lead {
  id: string
  email: string
  brand: string | null
  overall_score: number | null
  market: string | null
  source: string | null
  created_at: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<'single' | 'bulk' | null>(null)
  const [singleLead, setSingleLead] = useState<Lead | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    fetch('/api/admin/leads')
      .then(r => r.json())
      .then(d => { setLeads(d.leads ?? []); setLoading(false) })
  }, [])

  const filtered = leads.filter(l =>
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    (l.brand ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(l => l.id)))
    }
  }

  const openSingle = (lead: Lead) => {
    setSingleLead(lead)
    setSubject('Your AI Visibility Report — VisibilityRadar')
    setMessage(`Hi,\n\nThank you for trying VisibilityRadar! We noticed you analyzed ${lead.brand ?? 'your brand'} and wanted to follow up.\n\nWould you like to unlock the full report and track your AI visibility over time?\n\nBest,\nVisibilityRadar Team`)
    setSent(false)
    setModal('single')
  }

  const openBulk = () => {
    setSubject('Your AI Visibility Score — VisibilityRadar')
    setMessage(`Hi,\n\nThank you for trying VisibilityRadar! We'd love to help you improve your brand's visibility across ChatGPT, Claude, Gemini and more.\n\nCheck out our Pro plan for full access to all 6 AI models, competitor tracking, and monthly reports.\n\nhttps://visibilityradar.ai/pricing\n\nBest,\nVisibilityRadar Team`)
    setSent(false)
    setModal('bulk')
  }

  const send = async () => {
    setSending(true)
    const to = modal === 'single' && singleLead
      ? singleLead.email
      : filtered.filter(l => selected.has(l.id)).map(l => l.email)

    const r = await fetch('/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, message }),
    })
    setSending(false)
    if (r.ok) setSent(true)
  }

  const closeModal = () => { setModal(null); setSingleLead(null); setSent(false) }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Leads</h1>
          <p className="text-slate-500 text-sm mt-0.5">{leads.length} total · free demo users who shared their email</p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={openBulk}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Send Email to {selected.size} selected
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by email or brand..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2.5 mb-4 focus:outline-none focus:border-indigo-500"
      />

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-8">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="accent-indigo-500"
                />
              </th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Brand</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Market</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-600">No leads yet</td></tr>
            )}
            {filtered.map(lead => (
              <tr key={lead.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    className="accent-indigo-500"
                  />
                </td>
                <td className="px-4 py-3 text-slate-200 font-medium">{lead.email}</td>
                <td className="px-4 py-3 text-slate-400">{lead.brand ?? '—'}</td>
                <td className="px-4 py-3">
                  {lead.overall_score != null ? (
                    <span className={`font-bold ${lead.overall_score >= 70 ? 'text-emerald-400' : lead.overall_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {lead.overall_score}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 uppercase text-xs">{lead.market ?? '—'}</td>
                <td className="px-4 py-3">
                  {lead.source && (
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{lead.source}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(lead.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openSingle(lead)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Send Email
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Email Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[540px] max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-semibold mb-1">
              {modal === 'single' ? `Email to ${singleLead?.email}` : `Bulk Email — ${selected.size} recipients`}
            </h3>
            <p className="text-xs text-slate-500 mb-4">From: info@visibilityradar.ai</p>

            {sent ? (
              <div className="text-emerald-400 text-sm py-6 text-center">
                ✓ Email sent successfully!
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="text-xs text-slate-500 mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={10}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-3 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeModal} className="text-slate-400 text-sm px-4 py-2 hover:text-white transition-colors">
                {sent ? 'Close' : 'Cancel'}
              </button>
              {!sent && (
                <button
                  onClick={send}
                  disabled={sending || !subject || !message}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending...' : `Send${modal === 'bulk' ? ` to ${selected.size}` : ''}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
