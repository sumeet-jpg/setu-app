import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withManageAuth } from '@/lib/manage-token'
import { auditLog } from '@/lib/governance/audit-logger'
import { collectUserData } from '@/lib/manage/data-scope'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/manage/export — a customer's complete data bundle, manage-token
// gated like every other private route (src/lib/manage-token.ts). Contains
// only this customer's own rows across the tables in data-scope.ts — never
// Setu's system prompts/character-cores/registry/calibration formula, and
// never a decrypted (or even encrypted) tool credential, only connection
// metadata (see TOOL_CONNECTIONS_EXPORT_COLUMNS in data-scope.ts).
export async function GET(req: NextRequest) {
  return withManageAuth(req, async (userId) => {
    const supabase = getSupabase()
    const { data, errors } = await collectUserData(supabase, userId)

    const tableCount = Object.keys(data).filter(k => (data[k]?.length ?? 0) > 0).length
    auditLog.dataExported(userId, tableCount).catch(() => {})

    const bundle = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      note: 'This export contains only your own data — your task and chat history, memory, documents, and usage records. It never includes Setu\'s system prompts, employee designs, or the decrypted contents of any connected tool credential.',
      data,
      ...(Object.keys(errors).length ? { partial_export_warnings: errors } : {}),
    }

    return NextResponse.json(bundle, {
      headers: {
        'Content-Disposition': `attachment; filename="setu-data-export-${userId}.json"`,
      },
    })
  })
}
