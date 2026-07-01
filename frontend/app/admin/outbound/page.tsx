'use client'

import { useEffect, useState, useCallback } from 'react'

interface Lead {
  id: string
  email: string
  name: string | null
  title: string | null
  company: string | null
  brand: string | null
  domain: string | null
  market: string | null
  status: string
  overall_score: number | null
  worst_model: string | null
  worst_score: number | null
  top_recommendation: string | null
  competitor_scores: { name: string; score: number }[] | null
  last_send_result: string | null
  email_sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  error: string | null
  source: string | null
  created_at: string
}

interface Funnel {
  total: number; pending: number; audited: number; emailed: number
  opened: number; clicked: number; signed_up: number; converted: number; failed: number
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-slate-800 text-slate-400',
  audited: 'bg-blue-500/15 text-blue-400',
  emailed: 'bg-indigo-500/15 text-indigo-400',
  opened: 'bg-amber-500/15 text-amber-400',
  clicked: 'bg-violet-500/15 text-violet-400',
  signed_up: 'bg-emerald-500/15 text-emerald-400',
  converted: 'bg-emerald-500/25 text-emerald-300',
  failed: 'bg-red-500/15 text-red-400',
}

const DEFAULT_SUBJECT = `{{brand}}: how to get recommended by ChatGPT in 30 days`

const DEFAULT_BODY = `Hi {{first_name}},

When someone asks ChatGPT or Claude "{{query}}", they get a recommendation on the spot — and right now, it often isn't {{brand}}.

I ran {{brand}} through the AI models your buyers actually use. Here's where you stand:

• Your AI visibility score: {{score}}/100
• Competitors on the same questions: {{competitors}}

The good news: this is very fixable. Based on your results, three changes would move the needle most over the next 30 days:

1. Publish a structured FAQ that answers the exact questions people ask AI in your space
2. Add schema markup so AI models can clearly identify who you are and what you offer
3. Earn a few authoritative mentions (blog, press, LinkedIn) that AI models trust and cite

Here's what makes VisibilityRadar different: it's not just a report. It's an AI Growth Copilot. With one click it generates the assets to actually make those changes for you:

✓ An SEO blog post tailored to your visibility gaps
✓ FAQ content built from the real questions buyers ask AI
✓ Schema markup, ready to paste into your site
✓ A press release draft
✓ A LinkedIn post

Make these changes and your odds of being the brand AI recommends for queries like "{{query}}" go up — and we track that score for you month over month.

Want me to generate your growth kit for {{brand}}?`

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 ${accent ?? 'text-white'}`}>{value}</div>
    </div>
  )
}

export default function OutboundPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/outbound')
    const d = await r.json()
    setLeads(d.leads ?? [])
    setFunnel(d.funnel ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000) }

  const filtered = leads.filter(l => {
    const matchSearch = l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.brand ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.company ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchStatus
  })

  const toggle = (id: string) => setSelected(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(l => l.id)))
  }

  const selectedIds = () => Array.from(selected)

  const runAudit = async () => {
    if (selected.size === 0) return
    setBusy('audit')
    const ids = selectedIds()
    let done = 0
    // Each audit runs Claude + GPT-4o (~90s) → backend processes one lead per
    // request. Loop through the selection until it's drained.
    for (const id of ids) {
      flash(`Auditing ${done + 1}/${ids.length}… (~90s each)`)
      const r = await fetch('/api/admin/outbound/audit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      if (!r.ok) { const d = await r.json().catch(() => ({})); flash(d.error ?? 'Audit failed'); break }
      done++
      load()
    }
    setBusy(null)
    flash(`Audited ${done}/${ids.length}`)
  }

  const del = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} leads?`)) return
    setBusy('delete')
    const r = await fetch('/api/admin/outbound', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds() }),
    })
    setBusy(null)
    if (r.ok) { setSelected(new Set()); flash('Deleted'); load() }
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>

  return (
    <div className="p-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 border border-slate-700 text-slate-100 text-sm px-4 py-3 rounded-lg shadow-xl">{toast}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Outbound Engine</h1>
          <p className="text-slate-500 text-sm mt-0.5">Cold-audit outreach · import → audit → personalized email → track</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)} className="bg-slate-800 hover:bg-slate-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">+ Import Leads</button>
        </div>
      </div>

      {/* Funnel */}
      {funnel && (
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <StatCard label="Total" value={funnel.total} />
          <StatCard label="Pending" value={funnel.pending} accent="text-slate-300" />
          <StatCard label="Audited" value={funnel.audited} accent="text-blue-400" />
          <StatCard label="Emailed" value={funnel.emailed} accent="text-indigo-400" />
          <StatCard label="Opened" value={funnel.opened} accent="text-amber-400" />
          <StatCard label="Clicked" value={funnel.clicked} accent="text-violet-400" />
          <StatCard label="Signed up" value={funnel.signed_up} accent="text-emerald-400" />
          <StatCard label="Converted" value={funnel.converted} accent="text-emerald-300" />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text" placeholder="Search email / brand / company..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500">
          {['all','pending','audited','emailed','opened','clicked','signed_up','converted','failed'].map(s =>
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5">
          <span className="text-sm text-slate-400">{selected.size} selected</span>
          <div className="flex-1" />
          <button onClick={runAudit} disabled={busy !== null}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {busy === 'audit' ? 'Auditing...' : 'Run Audit'}
          </button>
          <button onClick={() => setSendOpen(true)} disabled={busy !== null}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            Compose & Send
          </button>
          <button onClick={del} disabled={busy !== null}
            className="bg-slate-800 hover:bg-red-900/50 text-red-400 text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            Delete
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-8">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-indigo-500" />
              </th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Brand</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Weakest</th>
              <th className="px-4 py-3 text-left">Sent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-600">No leads. Import some to get started.</td></tr>
            )}
            {filtered.map(l => (
              <tr key={l.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} className="accent-indigo-500" /></td>
                <td className="px-4 py-3">
                  <div className="text-slate-200 font-medium">{l.name ?? l.email}</div>
                  <div className="text-slate-500 text-xs">{l.title ? `${l.title} · ` : ''}{l.email}</div>
                  {l.error && <div className="text-red-400/70 text-xs mt-0.5">⚠ {l.error}</div>}
                  {l.last_send_result && (
                    <div className={`text-[10px] mt-0.5 ${l.last_send_result.startsWith('FAILED') ? 'text-red-400/70' : 'text-emerald-400/70'}`}>{l.last_send_result}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400">{l.brand ?? l.company ?? '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLE[l.status] ?? 'bg-slate-800 text-slate-400'}`}>{l.status}</span></td>
                <td className="px-4 py-3">
                  {l.overall_score != null
                    ? <span className={`font-bold ${l.overall_score >= 70 ? 'text-emerald-400' : l.overall_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{Math.round(l.overall_score)}</span>
                    : <span className="text-slate-600">—</span>}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {l.worst_model ? `${l.worst_model} (${Math.round(l.worst_score ?? 0)})` : '—'}
                  {l.competitor_scores && l.competitor_scores.length > 0 && (
                    <div className="text-slate-600 mt-1">vs {l.competitor_scores.slice(0, 3).map(c => `${c.name} ${Math.round(c.score)}`).join(' · ')}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="text-slate-500">{l.email_sent_at ? new Date(l.email_sent_at).toLocaleDateString() : '—'}</div>
                  {(l.opened_at || l.clicked_at) && (
                    <div className="flex gap-1 mt-1">
                      {l.opened_at && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400" title={new Date(l.opened_at).toLocaleString()}>opened</span>}
                      {l.clicked_at && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400" title={new Date(l.clicked_at).toLocaleString()}>clicked</span>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} onDone={(m) => { flash(m); load() }} />}
      {sendOpen && <SendModal count={selected.size} ids={selectedIds()} onClose={() => setSendOpen(false)} onDone={(m) => { setSendOpen(false); setSelected(new Set()); flash(m); load() }} />}
    </div>
  )
}

/* ---------- Import Modal ---------- */
function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: (m: string) => void }) {
  const [tab, setTab] = useState<'apollo' | 'manual'>('manual')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Apollo filters
  const [titles, setTitles] = useState('Head of Marketing, CMO, Brand Manager, Marketing Director')
  const [industries, setIndustries] = useState('')
  const [employees, setEmployees] = useState('11,50')
  const [locations, setLocations] = useState('')
  const [perPage, setPerPage] = useState(25)

  // Manual paste — CSV-ish: email, name, company, domain per line
  const [paste, setPaste] = useState('')

  const importApollo = async () => {
    setBusy(true); setErr(null)
    const r = await fetch('/api/admin/outbound/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'apollo',
        filters: {
          titles: titles.split(',').map(s => s.trim()).filter(Boolean),
          industries: industries.split(',').map(s => s.trim()).filter(Boolean),
          employeeRanges: employees.split(';').map(s => s.trim()).filter(Boolean),
          locations: locations.split(',').map(s => s.trim()).filter(Boolean),
          perPage,
        },
      }),
    })
    const d = await r.json(); setBusy(false)
    if (r.ok) onDone(`Imported ${d.imported} new leads (${d.found} found)`)
    else setErr(d.error ?? 'Import failed')
  }

  const importManual = async () => {
    setBusy(true); setErr(null)
    const leads = paste.split('\n').map(line => {
      const [email, name, company, domain] = line.split(',').map(s => s?.trim())
      return { email, name, company, domain }
    }).filter(l => l.email)
    const r = await fetch('/api/admin/outbound/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'manual', leads }),
    })
    const d = await r.json(); setBusy(false)
    if (r.ok) onDone(`Imported ${d.imported} new leads (${d.found} valid)`)
    else setErr(d.error ?? 'Import failed')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[580px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-white font-semibold mb-4">Import Leads</h3>

        <div className="flex gap-1 mb-4 bg-slate-800 rounded-lg p-1 w-fit">
          {(['manual', 'apollo'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>
              {t === 'manual' ? 'Paste / CSV' : 'Apollo.io'}
            </button>
          ))}
        </div>

        {err && <div className="text-red-400 text-xs mb-3 bg-red-500/10 rounded-lg px-3 py-2">{err}</div>}

        {tab === 'manual' ? (
          <>
            <label className="text-xs text-slate-500 mb-1 block">One lead per line: <code className="text-slate-400">email, name, company, domain</code></label>
            <textarea value={paste} onChange={e => setPaste(e.target.value)} rows={10}
              placeholder="jane@acme.com, Jane Doe, Acme Inc, acme.com&#10;bob@nike.com, Bob Smith, Nike, nike.com"
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-3 focus:outline-none focus:border-indigo-500 resize-none font-mono text-xs" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onClose} className="text-slate-400 text-sm px-4 py-2 hover:text-white">Cancel</button>
              <button onClick={importManual} disabled={busy || !paste.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">{busy ? 'Importing...' : 'Import'}</button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Job titles (comma-separated)</label>
                <input value={titles} onChange={e => setTitles(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Industry keywords (optional)</label>
                <input value={industries} onChange={e => setIndustries(e.target.value)} placeholder="e-commerce, saas" className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Employee range (min,max ; ...)</label>
                  <input value={employees} onChange={e => setEmployees(e.target.value)} placeholder="11,50;51,200" className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Results (max 100)</label>
                  <input type="number" value={perPage} onChange={e => setPerPage(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Locations (optional)</label>
                <input value={locations} onChange={e => setLocations(e.target.value)} placeholder="United States, United Kingdom" className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">Requires <code className="text-slate-500">APOLLO_API_KEY</code> in Vercel env. Only leads with unlocked emails are imported.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onClose} className="text-slate-400 text-sm px-4 py-2 hover:text-white">Cancel</button>
              <button onClick={importApollo} disabled={busy} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">{busy ? 'Fetching...' : 'Fetch from Apollo'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------- Send Modal ---------- */
function SendModal({ count, ids, onClose, onDone }: { count: number; ids: string[]; onClose: () => void; onDone: (m: string) => void }) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [body, setBody] = useState(DEFAULT_BODY)
  const [testMode, setTestMode] = useState(true)
  const [testEmail, setTestEmail] = useState('sarefe12@gmail.com')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const send = async () => {
    setBusy(true); setErr(null)
    const r = await fetch('/api/admin/outbound/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, subject, body, testEmail: testMode ? testEmail : undefined }),
    })
    const d = await r.json(); setBusy(false)
    if (r.ok) onDone(`${testMode ? 'TEST · ' : ''}Sent ${d.sent}${d.failed ? ` · ${d.failed} failed` : ''}${d.remaining ? ` · ${d.remaining} left` : ''}`)
    else setErr(d.error ?? 'Send failed')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[600px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-white font-semibold mb-1">Compose & Send — {count} recipients</h3>
        <p className="text-xs text-slate-500 mb-4">From: info@visibilityradar.ai · Tokens: <code className="text-slate-400">{'{{first_name}} {{brand}} {{score}} {{query}} {{worst_model}} {{worst_score}} {{competitors}} {{recommendation}}'}</code></p>

        {err && <div className="text-red-400 text-xs mb-3 bg-red-500/10 rounded-lg px-3 py-2">{err}</div>}

        <div className="mb-3">
          <label className="text-xs text-slate-500 mb-1 block">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={14} className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-3 focus:outline-none focus:border-indigo-500 resize-none" />
        </div>
        <p className="text-xs text-slate-600 mt-2">A tracked CTA button and open-pixel are added automatically. Best results: audit leads first so scores fill in.</p>

        {/* Test mode */}
        <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={testMode} onChange={e => setTestMode(e.target.checked)} className="accent-amber-500" />
            Test mode — send all to one inbox (lead status unchanged)
          </label>
          {testMode && (
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
              className="w-full mt-2 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500" />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="text-slate-400 text-sm px-4 py-2 hover:text-white">Cancel</button>
          <button onClick={send} disabled={busy || !subject || !body} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">{busy ? 'Sending...' : `Send to ${count}`}</button>
        </div>
      </div>
    </div>
  )
}
