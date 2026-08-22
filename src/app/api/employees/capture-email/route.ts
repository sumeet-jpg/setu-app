import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { RATE_LIMITS, getClientIp } from '@/lib/security/rate-limiter'

// POST { userId, slug, email }
// Soft, skippable lead capture shown mid-interview (see interview/_client.tsx)
// after real engagement, not a pre-chat gate. Best-effort: failures here
// should never interrupt the chat itself.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rateCheck = RATE_LIMITS.leadCapture(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { userId, slug, email } = await req.json()
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!userId || !slug || !email || !emailRx.test(email)) {
      return NextResponse.json({ error: 'userId, slug, and a valid email are required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { error } = await supabase
      .from('interview_leads')
      .upsert({ user_id: userId, employee_slug: slug, email: email.trim().toLowerCase() }, { onConflict: 'user_id,email' })

    if (error) {
      console.error('[capture-email]', error.message)
      return NextResponse.json({ error: 'Could not save' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[capture-email]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
