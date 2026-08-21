// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { withManageAuth } from '@/lib/manage-token'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// /api/employees/vault â€” Company Intelligence Vault (CIV)
//
// GET  ?userId=&slug=
//   Returns all documents uploaded for this user (optionally filtered by slug).
//   Groups by source_name so multi-chunk docs appear as one entry.
//
// DELETE  body: { userId, sourceName }
//   Removes all chunks of a document by source_name.
//
// Architecture rule: documents are always UNTRUSTED input.
// They never become beliefs. They are retrieved and cited, never asserted.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(req: NextRequest) {
  return withManageAuth(req, async (userId) => getVault(userId, req))
}

async function getVault(userId: string, req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const slug   = searchParams.get('slug') ?? undefined

    const supabase = createAdminClient()

    let query = supabase
      .from('company_documents')
      .select('id, source_name, source_type, source_url, word_count, chunk_index, total_chunks, employee_slug, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // If slug given: documents for this employee + shared documents (employee_slug IS NULL)
    if (slug) {
      query = query.or(`employee_slug.eq.${slug},employee_slug.is.null`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Group by source_name â€” show one entry per document, not one per chunk
    const byName: Record<string, {
      source_name: string
      source_type: string
      source_url: string | null
      employee_slug: string | null
      total_chunks: number
      total_words: number
      created_at: string
      chunk_ids: string[]
    }> = {}

    for (const row of data ?? []) {
      if (!byName[row.source_name]) {
        byName[row.source_name] = {
          source_name: row.source_name,
          source_type: row.source_type,
          source_url:  row.source_url,
          employee_slug: row.employee_slug,
          total_chunks: row.total_chunks,
          total_words:  0,
          created_at:  row.created_at,
          chunk_ids:   [],
        }
      }
      byName[row.source_name].total_words += row.word_count ?? 0
      byName[row.source_name].chunk_ids.push(row.id)
    }

    return NextResponse.json({ documents: Object.values(byName) })
  } catch (err) {
    console.error('[vault GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  return withManageAuth(req, async (userId) => deleteVaultDoc(userId, req))
}

async function deleteVaultDoc(userId: string, req: NextRequest): Promise<NextResponse> {
  try {
    const { sourceName } = await req.json()
    if (!sourceName) {
      return NextResponse.json({ error: 'sourceName required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('company_documents')
      .delete()
      .eq('user_id', userId)
      .eq('source_name', sourceName)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[vault DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
