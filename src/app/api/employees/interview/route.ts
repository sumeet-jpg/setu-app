// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getEmployee } from '@/lib/employees/profiles'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Load the last N memories for (userId, employeeSlug) and format as context string
async function loadMemories(userId: string, slug: string): Promise<string> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('employee_memories')
      .select('type, role, content, created_at')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!data || data.length === 0) return ''

    const items = data.reverse() // chronological order
    const lines = items.map(m => {
      if (m.type === 'message') {
        return `${m.role === 'user' ? 'User' : 'You'}: ${m.content}`
      }
      return `[${m.type}]: ${m.content}`
    })

    return `\n\n---\nPrevious conversations with this user:\n${lines.join('\n')}\n---\n`
  } catch {
    return '' // never block the response on memory failures
  }
}

// Write one memory entry (silent fail — never blocks the stream)
async function writeMemory(
  userId: string,
  slug: string,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
) {
  try {
    const supabase = createAdminClient()
    await supabase.from('employee_memories').insert({
      user_id: userId,
      employee_slug: slug,
      session_id: sessionId,
      type: 'message',
      role,
      content: content.slice(0, 4000),
      importance: 5,
    })
  } catch {
    // intentional silent fail
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug, messages, userId, sessionId } = await req.json()

    if (!slug || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const employee = getEmployee(slug)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Inject episodic memory into system prompt if user is identified
    const memoryContext = userId ? await loadMemories(userId, slug) : ''
    const systemPrompt = employee.systemPrompt + memoryContext

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const model = process.env.FALLBACK_REASONING_MODEL ?? 'claude-sonnet-4-6'

    const stream = await client.messages.stream({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    // Buffer the full assistant response so we can persist it after streaming
    let assistantResponse = ''

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              assistantResponse += chunk.delta.text
              const data = `data: ${JSON.stringify({ choices: [{ delta: { content: chunk.delta.text } }] })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

          // Persist both sides after the stream completes
          if (userId && sessionId) {
            const lastUserMsg = messages[messages.length - 1]
            if (lastUserMsg?.role === 'user') {
              await writeMemory(userId, slug, sessionId, 'user', lastUserMsg.content)
            }
            if (assistantResponse) {
              await writeMemory(userId, slug, sessionId, 'assistant', assistantResponse)
            }
          }
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err: any) {
    console.error('[Setu interview API]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
