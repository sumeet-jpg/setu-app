// @ts-nocheck
import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getEmployee } from '@/lib/employees/profiles'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PLAN_INSTRUCTIONS = `
When the user asks you to do a real task (write something, analyze something, create a report, set up a campaign, etc.), respond with:
1. A brief acknowledgment (1-2 sentences max)
2. A structured plan wrapped in <plan> tags with this exact JSON format:
<plan>
{
  "summary": "One-line summary of what you'll do",
  "steps": [
    {"id": 1, "label": "Step label", "tool": "ToolName or null", "detail": "What you'll do in this step"},
    {"id": 2, "label": "Step label", "tool": "ToolName or null", "detail": "..."}
  ]
}
</plan>
3. End with a call to action like "Approve this plan and I'll get started immediately."

For conversational questions (what can you do, how does X work, general questions), respond normally without a plan.
Only generate a plan when there's actual work to execute.

CONNECTED TOOLS: {connectedTools}
If a step requires a tool that is NOT connected, note it in the step detail so the user knows they'll need to connect it.
`

export async function POST(req: NextRequest) {
  try {
    const { slug, messages, connectedTools = [] } = await req.json()

    if (!slug || !messages) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
    }

    const employee = getEmployee(slug)
    if (!employee) {
      return new Response(JSON.stringify({ error: 'Employee not found' }), { status: 404 })
    }

    const connectedList = connectedTools.length > 0
      ? connectedTools.join(', ')
      : 'None connected yet — guide the user to connect tools from the left panel'

    const systemPrompt = `${employee.systemPrompt}

${PLAN_INSTRUCTIONS.replace('{connectedTools}', connectedList)}`

    const model = process.env.FALLBACK_REASONING_MODEL ?? 'claude-sonnet-4-6'

    const stream = await client.messages.stream({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const data = `data: ${JSON.stringify({ choices: [{ delta: { content: chunk.delta.text } }] })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
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
    console.error('[Setu workspace API]', err)
    return new Response(JSON.stringify({ error: err.message ?? 'Internal error' }), { status: 500 })
  }
}
