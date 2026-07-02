import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

// Deterministic cover art for blog posts — generated from title + category so
// every post (past and future) gets an on-brand visual with no stored assets.

const PALETTES: Record<string, { from: string; to: string; accent: string; chipBg: string }> = {
  Fundamentals: { from: '#1e1b4b', to: '#312e81', accent: '#818cf8', chipBg: 'rgba(129,140,248,0.18)' },
  Strategy:     { from: '#2e1065', to: '#4c1d95', accent: '#a78bfa', chipBg: 'rgba(167,139,250,0.18)' },
  Metrics:      { from: '#022c22', to: '#065f46', accent: '#34d399', chipBg: 'rgba(52,211,153,0.18)' },
  Reporting:    { from: '#451a03', to: '#78350f', accent: '#fbbf24', chipBg: 'rgba(251,191,36,0.18)' },
  Tactics:      { from: '#042f2e', to: '#115e59', accent: '#2dd4bf', chipBg: 'rgba(45,212,191,0.18)' },
  Tools:        { from: '#172554', to: '#1e40af', accent: '#60a5fa', chipBg: 'rgba(96,165,250,0.18)' },
}
const DEFAULT_PALETTE = { from: '#0f172a', to: '#1e293b', accent: '#818cf8', chipBg: 'rgba(129,140,248,0.18)' }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title') ?? 'AI Brand Visibility').slice(0, 120)
  const category = searchParams.get('category') ?? ''
  const p = PALETTES[category] ?? DEFAULT_PALETTE

  const titleSize = title.length > 80 ? 44 : title.length > 50 ? 52 : 62

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${p.from} 0%, ${p.to} 100%)`,
          padding: '56px 64px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative radar rings */}
        <div style={{ position: 'absolute', right: -140, top: -140, width: 480, height: 480, borderRadius: 480, border: `2px solid ${p.accent}22`, display: 'flex' }} />
        <div style={{ position: 'absolute', right: -60, top: -60, width: 320, height: 320, borderRadius: 320, border: `2px solid ${p.accent}33`, display: 'flex' }} />
        <div style={{ position: 'absolute', right: 20, top: 20, width: 160, height: 160, borderRadius: 160, border: `2px solid ${p.accent}44`, display: 'flex' }} />
        <div style={{ position: 'absolute', right: 92, top: 92, width: 16, height: 16, borderRadius: 16, background: p.accent, display: 'flex' }} />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>Visibility</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: p.accent, marginLeft: -8 }}>Radar</span>
          <span style={{ marginLeft: 10, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#64748b' }}>
            Blog
          </span>
        </div>

        {/* Category chip */}
        {category ? (
          <div style={{ display: 'flex', marginBottom: 28 }}>
            <span
              style={{
                display: 'flex',
                background: p.chipBg,
                color: p.accent,
                fontSize: 17,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '8px 20px',
                borderRadius: 999,
              }}
            >
              {category}
            </span>
          </div>
        ) : null}

        {/* Title */}
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ fontSize: titleSize, fontWeight: 900, color: '#ffffff', lineHeight: 1.12, maxWidth: 950 }}>
            {title}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 22 }}>
          <span style={{ fontSize: 15, color: '#94a3b8' }}>visibilityradar.ai/blog</span>
          <span style={{ fontSize: 15, color: '#94a3b8' }}>AI visibility, measured &amp; improved</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
