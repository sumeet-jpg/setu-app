// @ts-nocheck
// POST /api/tools/connect — save an encrypted API key for a tool
// DELETE /api/tools/connect — disconnect a tool

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getTool } from '@/lib/tools/registry'
import { encrypt } from '@/lib/tools/crypto'
import { withManageAuth } from '@/lib/manage-token'

// Previously trusted a bare user_id from the request body — anyone who knew
// or guessed another user's UUID could connect (or overwrite) a third-party
// API key on their account, or read which tools they'd connected. Now
// requires a verified manage-token, same as every other private-data route.
export async function POST(req: NextRequest) {
  return withManageAuth(req, async (user_id) => connectTool(user_id, req))
}

async function connectTool(user_id: string, req: NextRequest): Promise<NextResponse> {
  try {
    const { tool_slug, api_key, config } = await req.json()

    if (!tool_slug || !api_key) {
      return NextResponse.json({ error: 'tool_slug and api_key are required' }, { status: 400 })
    }

    const toolDef = getTool(tool_slug)
    if (!toolDef) {
      return NextResponse.json({ error: `Unknown tool: ${tool_slug}` }, { status: 400 })
    }

    const encryptedKey = encrypt(api_key.trim())
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('tool_connections')
      .upsert(
        {
          user_id,
          tool_slug,
          encrypted_key: encryptedKey,
          config: config ?? {},
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,tool_slug' }
      )

    if (error) {
      console.error('[tools/connect]', error)
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, tool: toolDef.name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  return withManageAuth(req, async (user_id) => disconnectTool(user_id, req))
}

async function disconnectTool(user_id: string, req: NextRequest): Promise<NextResponse> {
  try {
    const { tool_slug } = await req.json()

    if (!tool_slug) {
      return NextResponse.json({ error: 'tool_slug required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('tool_connections')
      .delete()
      .eq('user_id', user_id)
      .eq('tool_slug', tool_slug)

    if (error) {
      return NextResponse.json({ error: 'Failed to disconnect tool' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
