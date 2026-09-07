import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withManageAuth } from '@/lib/manage-token'
import { verifyAnthropicKey, saveCustomerAiKey, getCustomerAiKeyStatus, deleteCustomerAiKey } from '@/lib/ai-keys'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — connection status only (never the key itself).
export async function GET(req: NextRequest) {
  return withManageAuth(req, async (userId) => {
    const supabase = getSupabase()
    const status = await getCustomerAiKeyStatus(supabase, userId, 'anthropic')
    return NextResponse.json({ connected: !!status, ...(status ?? {}) })
  })
}

// POST — connect (or replace) the customer's own Anthropic key. Verified
// with a real, cheap Anthropic call before saving — a typo'd or revoked key
// should surface immediately, not on the customer's first real task.
export async function POST(req: NextRequest) {
  return withManageAuth(req, async (userId) => {
    const { apiKey } = await req.json()
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    const verified = await verifyAnthropicKey(apiKey.trim())
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error ?? 'Could not verify this key with Anthropic.' }, { status: 422 })
    }

    const supabase = getSupabase()
    await saveCustomerAiKey(supabase, userId, 'anthropic', apiKey.trim())
    return NextResponse.json({ ok: true })
  })
}

// DELETE — disconnect. Execution falls back to Setu's shared, capped key.
export async function DELETE(req: NextRequest) {
  return withManageAuth(req, async (userId) => {
    const supabase = getSupabase()
    await deleteCustomerAiKey(supabase, userId, 'anthropic')
    return NextResponse.json({ ok: true })
  })
}
