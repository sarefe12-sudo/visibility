import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = 'https://visibilityradar.ai'

// Only allow redirects back to our own domain to prevent open-redirect abuse
function safeTarget(u: string | null): string {
  if (!u) return APP_URL
  try {
    const url = new URL(u)
    if (url.hostname === 'visibilityradar.ai' || url.hostname.endsWith('.visibilityradar.ai')) {
      return url.toString()
    }
  } catch {
    // fall through
  }
  return APP_URL
}

// GET /api/track/c/[id]?u=<target> — email click tracking → redirect
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const target = safeTarget(new URL(req.url).searchParams.get('u'))

  try {
    const { data: lead } = await supabase
      .from('outbound_leads')
      .select('status, clicked_at')
      .eq('id', id)
      .single()

    if (lead && ['emailed', 'opened'].includes(lead.status)) {
      // Real send → advance the funnel status + timestamp
      await supabase
        .from('outbound_leads')
        .update({ status: 'clicked', clicked_at: new Date().toISOString() })
        .eq('id', id)
    } else if (lead && !lead.clicked_at) {
      // Test send (status still audited) → record the click timestamp only,
      // without advancing the real funnel status
      await supabase
        .from('outbound_leads')
        .update({ clicked_at: new Date().toISOString() })
        .eq('id', id)
    }
  } catch {
    // never block the redirect
  }

  return NextResponse.redirect(target, 302)
}
