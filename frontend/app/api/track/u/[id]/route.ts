import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function page(message: string): Response {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribed</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:80px 16px;"><tr><td align="center">
<table width="440" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:40px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08);">
<tr><td>
<p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">VisibilityRadar</p>
<p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${message}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

// GET /api/track/u/[id] — one-click unsubscribe. Marks the lead so the
// automated send pipeline (and any future re-import via Apollo) never
// contacts this address again.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabase
    .from('outbound_leads')
    .update({ status: 'unsubscribed', error: null })
    .eq('id', id)

  if (error) {
    return page("We couldn't process your request — please email us directly at info@visibilityradar.ai and we'll remove you manually.")
  }

  return page("You've been unsubscribed and won't receive further emails from us. Sorry for the noise.")
}
