'use client'

import { useEffect, useState } from 'react'

interface Contact {
  id: string
  name: string | null
  email: string
  company: string | null
  message: string
  source: string | null
  created_at: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [replyModal, setReplyModal] = useState<Contact | null>(null)
  const [replyMsg, setReplyMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/contacts')
      .then(r => r.json())
      .then(d => { setContacts(d.contacts ?? []); setLoading(false) })
  }, [])

  const openReply = (c: Contact) => {
    setReplyModal(c)
    setReplyMsg(`Hi ${c.name ?? c.email.split('@')[0]},\n\nThank you for reaching out to VisibilityRadar.\n\n`)
    setSent(false)
  }

  const sendReply = async () => {
    if (!replyModal) return
    setSending(true)
    const r = await fetch('/api/admin/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: replyModal.email,
        subject: `Re: Your message to VisibilityRadar`,
        message: replyMsg,
      }),
    })
    setSending(false)
    if (r.ok) setSent(true)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-2">Contact Center</h1>
      <p className="text-slate-500 text-sm mb-6">{contacts.length} messages total</p>

      <div className="space-y-3">
        {contacts.length === 0 && (
          <div className="text-slate-500 text-center py-12">No messages yet</div>
        )}
        {contacts.map(c => (
          <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-400 text-sm font-bold">
                  {(c.name ?? c.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">{c.name ?? '—'}</div>
                  <div className="text-xs text-slate-500">{c.email}{c.company ? ` · ${c.company}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {c.source && (
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{c.source}</span>
                )}
                <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                <span className="text-slate-600">{expanded === c.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expanded === c.id && (
              <div className="px-5 pb-5 border-t border-slate-800">
                <p className="text-sm text-slate-300 mt-4 whitespace-pre-wrap">{c.message}</p>
                <div className="mt-4">
                  <button
                    onClick={() => openReply(c)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[500px]">
            <h3 className="text-white font-semibold mb-1">Reply to {replyModal.email}</h3>
            <p className="text-xs text-slate-500 mb-4">From: info@visibilityradar.ai</p>
            {sent ? (
              <div className="text-emerald-400 text-sm py-4 text-center">Email sent successfully!</div>
            ) : (
              <textarea
                value={replyMsg}
                onChange={e => setReplyMsg(e.target.value)}
                rows={8}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-3 focus:outline-none focus:border-indigo-500 resize-none"
              />
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setReplyModal(null)} className="text-slate-400 text-sm px-4 py-2 hover:text-white transition-colors">
                {sent ? 'Close' : 'Cancel'}
              </button>
              {!sent && (
                <button
                  onClick={sendReply}
                  disabled={sending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Email'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
