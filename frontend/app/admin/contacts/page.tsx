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

interface InboundEmail {
  id: string
  from_email: string
  to_email: string
  inbox: 'info' | 'privacy'
  subject: string
  body_text: string | null
  body_html: string | null
  received_at: string
}

type Tab = 'contact-form' | 'info' | 'privacy'

export default function ContactsPage() {
  const [tab, setTab] = useState<Tab>('contact-form')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [inbound, setInbound] = useState<InboundEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replyModal, setReplyModal] = useState<{ email: string; inbox?: string; subject?: string } | null>(null)
  const [replySubject, setReplySubject] = useState('')
  const [replyMsg, setReplyMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/contacts').then(r => r.json()),
      fetch('/api/admin/inbound-emails').then(r => r.json()),
    ]).then(([c, e]) => {
      setContacts(c.contacts ?? [])
      setInbound(e.emails ?? [])
      setLoading(false)
    })
  }, [])

  const infoEmails = inbound.filter(e => e.inbox === 'info')
  const privacyEmails = inbound.filter(e => e.inbox === 'privacy')

  const openReply = (email: string, inbox?: string, subject?: string) => {
    setReplyModal({ email, inbox, subject })
    setReplySubject(subject ? `Re: ${subject}` : 'VisibilityRadar')
    setReplyMsg(`Hi,\n\nThank you for reaching out to VisibilityRadar.\n\n`)
    setSent(false)
  }

  const sendReply = async () => {
    if (!replyModal) return
    setSending(true)
    const r = await fetch(replyModal.inbox ? '/api/admin/inbound-emails' : '/api/admin/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: replyModal.email,
        subject: replySubject,
        message: replyMsg,
        inbox: replyModal.inbox,
      }),
    })
    setSending(false)
    if (r.ok) setSent(true)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'contact-form', label: 'Contact Form', count: contacts.length },
    { key: 'info', label: 'info@', count: infoEmails.length },
    { key: 'privacy', label: 'privacy@', count: privacyEmails.length },
  ]

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-6">Contact Center</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-slate-600 text-slate-200' : 'bg-slate-800 text-slate-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Contact Form Tab */}
      {tab === 'contact-form' && (
        <div className="space-y-3">
          {contacts.length === 0 && <div className="text-slate-500 text-center py-12">No messages yet</div>}
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
                  {c.source && <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{c.source}</span>}
                  <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                  <span className="text-slate-600">{expanded === c.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expanded === c.id && (
                <div className="px-5 pb-5 border-t border-slate-800">
                  <p className="text-sm text-slate-300 mt-4 whitespace-pre-wrap">{c.message}</p>
                  <button
                    onClick={() => openReply(c.email)}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inbound Email Tabs */}
      {(tab === 'info' || tab === 'privacy') && (
        <div className="space-y-3">
          {(tab === 'info' ? infoEmails : privacyEmails).length === 0 && (
            <div className="text-slate-500 text-center py-12">
              No emails yet
              <p className="text-xs mt-2 text-slate-600">Resend inbound routing setup required — see instructions below</p>
            </div>
          )}
          {(tab === 'info' ? infoEmails : privacyEmails).map(e => (
            <div key={e.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-400 text-sm font-bold">
                    {e.from_email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">{e.subject}</div>
                    <div className="text-xs text-slate-500">{e.from_email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">{new Date(e.received_at).toLocaleDateString()}</span>
                  <span className="text-slate-600">{expanded === e.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expanded === e.id && (
                <div className="px-5 pb-5 border-t border-slate-800">
                  <p className="text-sm text-slate-300 mt-4 whitespace-pre-wrap">
                    {e.body_text ?? e.body_html ?? '(no content)'}
                  </p>
                  <button
                    onClick={() => openReply(e.from_email, e.inbox, e.subject)}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Setup notice */}
          <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-xs text-slate-500">
            <p className="font-semibold text-slate-400 mb-2">Resend Inbound Setup</p>
            <p>Webhook URL: <code className="text-indigo-400">https://visibilityradar.ai/api/webhook/inbound</code></p>
            <p className="mt-1">MX Record: <code className="text-indigo-400">@ MX 10 inbound.resend.com</code> (Cloudflare)</p>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[500px]">
            <h3 className="text-white font-semibold mb-1">Reply to {replyModal.email}</h3>
            <p className="text-xs text-slate-500 mb-4">
              From: {replyModal.inbox === 'privacy' ? 'privacy@visibilityradar.ai' : 'info@visibilityradar.ai'}
            </p>
            {sent ? (
              <div className="text-emerald-400 text-sm py-4 text-center">Email sent successfully!</div>
            ) : (
              <>
                <input
                  type="text"
                  value={replySubject}
                  onChange={e => setReplySubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-indigo-500"
                  placeholder="Subject"
                />
                <textarea
                  value={replyMsg}
                  onChange={e => setReplyMsg(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-3 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </>
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
                  {sending ? 'Sending...' : 'Send'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
