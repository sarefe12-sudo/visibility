import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand') ?? 'Your Brand'
  const score = Math.min(100, Math.max(0, parseInt(searchParams.get('score') ?? '0')))
  const market = searchParams.get('market') ?? 'Global'

  const scoreColor = score >= 70 ? '#059669' : score >= 40 ? '#d97706' : '#dc2626'
  const label = score >= 70 ? 'Strong' : score >= 40 ? 'Moderate' : score >= 20 ? 'Low' : 'Invisible'
  const bgLabel = score >= 70 ? '#ecfdf5' : score >= 40 ? '#fffbeb' : '#fef2f2'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          padding: '56px 64px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>Visibility</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#818cf8' }}>Radar</span>
          <span style={{ marginLeft: 8, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569' }}>
            AI Brand Intelligence
          </span>
        </div>

        {/* Brand name + market */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            AI Visibility Score · {market.toUpperCase()} Market
          </div>
          <div style={{ fontSize: 68, fontWeight: 900, color: '#ffffff', lineHeight: 1.05, marginBottom: 36 }}>
            {brand}
          </div>

          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 110, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
              {score}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 36, color: '#475569' }}>/100</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: bgLabel,
                  borderRadius: 8,
                  padding: '4px 12px',
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor }}>{label}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, fontSize: 15, color: '#475569' }}>
            Measured across ChatGPT, Claude, Gemini, Perplexity, Grok &amp; DeepSeek
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: 20 }}>
          <span style={{ fontSize: 13, color: '#334155' }}>visibilityradar.ai</span>
          <span style={{ fontSize: 13, color: '#334155' }}>Analyze your brand for free →</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
