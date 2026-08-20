// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// /api/employees/vault/upload
//
// POST body: { userId, slug?, sourceName, sourceType, content, sourceUrl? }
//   slug: null or undefined = shared with all employees
//   sourceType: 'text' | 'sop' | 'playbook' | 'org_chart' | 'product_catalog'
//   content: plain text (PDF extraction, website scrape, or direct paste)
//
// Chunking strategy:
//   1. Split by double newline (paragraph boundary)
//   2. Merge adjacent short paragraphs until ~600 words per chunk
//   3. If a paragraph alone exceeds 600 words, split by sentence
//   Keeps semantic boundaries intact â€” no mid-sentence cuts.
//
// Documents are stored as-is (untrusted). They are never promoted to beliefs.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MAX_CHUNK_WORDS = 600
const MAX_TOTAL_WORDS = 50_000  // per upload

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function splitIntoChunks(content: string): string[] {
  const paragraphs = content
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  const chunks: string[] = []
  let current = ''
  let currentWords = 0

  for (const para of paragraphs) {
    const paraWords = countWords(para)

    if (paraWords > MAX_CHUNK_WORDS) {
      // Flush current chunk first
      if (current.trim()) { chunks.push(current.trim()); current = ''; currentWords = 0 }

      // Split long paragraph by sentence
      const sentences = para.match(/[^.!?]+[.!?]+/g) ?? [para]
      let sentBuf = ''
      let sentWords = 0
      for (const sent of sentences) {
        const sw = countWords(sent)
        if (sentWords + sw > MAX_CHUNK_WORDS && sentBuf) {
          chunks.push(sentBuf.trim())
          sentBuf = sent
          sentWords = sw
        } else {
          sentBuf += ' ' + sent
          sentWords += sw
        }
      }
      if (sentBuf.trim()) { current = sentBuf; currentWords = sentWords }
    } else if (currentWords + paraWords > MAX_CHUNK_WORDS) {
      if (current.trim()) chunks.push(current.trim())
      current = para
      currentWords = paraWords
    } else {
      current += (current ? '\n\n' : '') + para
      currentWords += paraWords
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks.filter(c => countWords(c) >= 10)  // drop trivial chunks
}

const VALID_SOURCE_TYPES = ['text', 'sop', 'playbook', 'org_chart', 'product_catalog', 'website', 'pdf', 'notion'] as const

export async function POST(req: NextRequest) {
  try {
    const { userId, slug, sourceName, sourceType, content, sourceUrl } = await req.json()

    if (!userId || !sourceName || !content) {
      return NextResponse.json({ error: 'userId, sourceName, content required' }, { status: 400 })
    }

    const type = VALID_SOURCE_TYPES.includes(sourceType) ? sourceType : 'text'
    const totalWords = countWords(content)

    if (totalWords > MAX_TOTAL_WORDS) {
      return NextResponse.json({
        error: `Document too large (${totalWords} words). Maximum is ${MAX_TOTAL_WORDS} words per upload.`
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Remove any existing chunks for this source_name (idempotent re-upload)
    await supabase
      .from('company_documents')
      .delete()
      .eq('user_id', userId)
      .eq('source_name', sourceName)

    const chunks = splitIntoChunks(content)

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No valid content after chunking' }, { status: 400 })
    }

    const rows = chunks.map((chunk, i) => ({
      user_id:       userId,
      employee_slug: slug ?? null,
      source_type:   type,
      source_name:   sourceName,
      source_url:    sourceUrl ?? null,
      content:       chunk,
      chunk_index:   i,
      total_chunks:  chunks.length,
      word_count:    countWords(chunk),
      metadata:      {},
    }))

    const { error } = await supabase.from('company_documents').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      chunks_created: chunks.length,
      total_words:    totalWords,
      source_name:    sourceName,
    })
  } catch (err) {
    console.error('[vault/upload]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
