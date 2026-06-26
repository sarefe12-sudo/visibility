interface Props {
  steps: string[]
  currentIndex: number
  onStartOver?: () => void
  showStartOver?: boolean
}

export default function StepIndicator({ steps, currentIndex, onStartOver, showStartOver }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4">
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-full px-4 py-2">
        {steps.map((label, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          return (
            <div key={i} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : done
                  ? 'text-emerald-600'
                  : 'text-slate-300'
              }`}>
                {done && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {label}
              </div>
              {i < steps.length - 1 && (
                <span className="text-slate-200 text-xs mx-0.5">›</span>
              )}
            </div>
          )
        })}
      </div>

      {showStartOver && onStartOver && (
        <button
          onClick={onStartOver}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-white transition-all"
        >
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Start over
        </button>
      )}
    </div>
  )
}
