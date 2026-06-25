export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-2">Analytics & Funnel</h1>
      <p className="text-slate-500 text-sm mb-8">Visitor → Login → Free Analysis → Pricing → Checkout → Paid</p>

      <div className="grid grid-cols-5 gap-0 mb-10">
        {[
          { label: 'Visitors', value: '—', note: 'Google Analytics' },
          { label: 'Logins', value: '—', note: 'Clerk events' },
          { label: 'Analyses', value: '—', note: 'Free users' },
          { label: 'Pricing Views', value: '—', note: 'GA pageviews' },
          { label: 'Paid', value: '—', note: 'LemonSqueezy' },
        ].map((step, i) => (
          <div key={step.label} className="flex items-center">
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
              <div className="text-2xl font-bold text-indigo-400">{step.value}</div>
              <div className="text-sm text-white mt-1">{step.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{step.note}</div>
            </div>
            {i < 4 && <div className="text-slate-700 text-xl px-1">›</div>}
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-orange-900/40 rounded-full flex items-center justify-center">
            <span className="text-orange-400 text-sm">G</span>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200">Google Analytics Integration</div>
            <div className="text-xs text-slate-500">Connect GA4 to pull funnel & traffic data</div>
          </div>
        </div>
        <p className="text-slate-500 text-sm">
          GA4 Property: <span className="text-slate-300 font-mono">G-QTY92863Z3</span> is already tracking.
          For full funnel data in the admin panel, a GA4 Reporting API integration can be added in the next phase.
        </p>
      </div>
    </div>
  )
}
