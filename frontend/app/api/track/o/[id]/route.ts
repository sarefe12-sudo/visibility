import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

// GET /api/track/o/[id].png — email open tracking pixel
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const leadId = id.replace(/\.(png|gif)$/i, '')

  // Mark opened only if not already further down the funnel
  try {
    const { data: lead } = await supabase
      .from('outbound_leads')
      .select('status, opened_at')
      .eq('id', leadId)
      .single()

    if (lead && !lead.opened_at && ['emailed'].includes(lead.status)) {
      await supabase
        .from('outbound_leads')
        .update({ status: 'opened', opened_at: new Date().toISOString() })
        .eq('id', leadId)
    } else if (lead && !lead.opened_at) {
      // Already clicked/converted — still record the timestamp
      await supabase.from('outbound_leads').update({ opened_at: new Date().toISOString() }).eq('id', leadId)
    }
  } catch {
    // never break the pixel
  }

  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
