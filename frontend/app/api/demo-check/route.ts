import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/demo-check
// Body: { email: string, action: "check" | "record" }
// Returns: { allowed: boolean, reason?: string }
export async function POST(req: Request) {
  try {
    const { email, action } = await req.json()
    if (!email?.trim()) return NextResponse.json({ allowed: true })

    const normalized = email.trim().toLowerCase()

    if (action === 'check') {
      const { data } = await supabase
        .from('demo_emails')
        .select('id')
        .eq('email', normalized)
        .maybeSingle()

      if (data) {
        return NextResponse.json({ allowed: false, reason: 'already_used' })
      }
      return NextResponse.json({ allowed: true })
    }

    if (action === 'record') {
      await supabase
        .from('demo_emails')
        .upsert({ email: normalized }, { onConflict: 'email', ignoreDuplicates: true })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ allowed: true })
  } catch {
    return NextResponse.json({ allowed: true })
  }
}
