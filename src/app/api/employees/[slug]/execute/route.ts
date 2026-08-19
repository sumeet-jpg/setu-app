// @ts-nocheck
// ── Setu Agentic Execution Loop ───────────────────────────────────────────────
// Real multi-turn Claude tool_use loop. Claude calls tools → we execute them →
// results fed back → Claude continues. Approval gates pause everything.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server'
import { getEmployee } from '@/lib/employees/profiles'
import { getTool, buildToolContext } from '@/lib/tools/registry'
import { executeHttpRequest } from '@/lib/tools/executor'
import { decrypt } from '@/lib/tools/crypto'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Claude tool definitions ──────────────────────────────────────────────────

const APPROVAL_TOOL: Anthropic.Tool = {
  name: 'request_approval',
  description: `ALWAYS call this before creating, sending, publishing, deleting, or spending anything on behalf of the user.
Show exactly what you're about to do, what it will affect, and any cost or irreversibility.
Do NOT proceed with the action until the user explicitly approves.
Call this even if the user said "just do it" — one final confirmation before real-world actions is non-negotiable.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        description: 'Short title of what you are about to do (e.g. "Send Halloween email to 4,200 contacts")',
      },
      details: {
        type: 'string',
        description: 'Full breakdown: what exactly will be created/sent/changed, with all key values (recipient count, budget, schedule, content preview)',
      },
      affected: {
        type: 'string',
        description: 'What this will affect (e.g. "Mailchimp list: Halloween-2024, 4,200 subscribers")',
      },
      reversible: {
        type: 'boolean',
        description: 'Whether this action can be undone',
      },
    },
    required: ['action', 'details', 'affected', 'reversible'],
  },
}

const HTTP_REQUEST_TOOL: Anthropic.Tool = {
  name: 'http_request',
  description: `Make a real HTTP request to a connected tool's API. You have full knowledge of each tool's API.
Use the correct endpoint paths, request bodies, and parameters for the tool you're calling.
Always use the exact tool slug from the connected tools list.
For GET requests, use query params. For POST/PUT/PATCH, use body.
Return the response data to understand what happened before deciding the next step.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      tool: {
        type: 'string',
        description: 'Tool slug from the connected tools list (e.g. "hubspot", "mailchimp", "slack")',
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        description: 'HTTP method',
      },
      path: {
        type: 'string',
        description: 'API path relative to the tool base URL (e.g. "/campaigns" or "/crm/v3/objects/contacts")',
      },
      body: {
        type: 'object',
        description: 'Request body for POST/PUT/PATCH requests',
        additionalProperties: true,
      },
      query: {
        type: 'object',
        description: 'Query string parameters as key-value pairs',
        additionalProperties: { type: 'string' },
      },
    },
    required: ['tool', 'method', 'path'],
  },
}

const TASK_COMPLETE_TOOL: Anthropic.Tool = {
  name: 'task_complete',
  description: 'Call this when the task is fully done. Provide a clear summary of everything that was accomplished.',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: {
        type: 'string',
        description: 'What was accomplished, with links, IDs, or confirmation numbers where relevant',
      },
      results: {
        type: 'object',
        description: 'Key results as structured data (campaign IDs, URLs, counts, etc.)',
        additionalProperties: true,
      },
    },
    required: ['summary'],
  },
}

// ── SSE helpers ──────────────────────────────────────────────────────────────

function sseEvent(type: string, payload: unknown): string {
  return `data: ${JSON.stringify({ type, ...( typeof payload === 'string' ? { content: payload } : payload) })}\n\n`
}

// ── Main route ───────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const employee = getEmployee(slug)
  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  const body = await req.json()
  const { task, user_id, task_id: existingTaskId } = body

  if (!task || !user_id) {
    return NextResponse.json({ error: 'task and user_id required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Load user's connected tools for this employee
  const { data: connections } = await supabase
    .from('tool_connections')
    .select('tool_slug, encrypted_key, config')
    .eq('user_id', user_id)

  const connectedSlugs = (connections ?? []).map(c => c.tool_slug)
  const connectionMap = new Map(
    (connections ?? []).map(c => [c.tool_slug, { key: c.encrypted_key, config: c.config ?? {} }])
  )

  // Create or load task record
  let taskId = existingTaskId
  if (!taskId) {
    const { data: newTask, error } = await supabase
      .from('employee_tasks')
      .insert({
        user_id,
        employee_slug: slug,
        title: task.slice(0, 120),
        status: 'planning',
        messages: [],
        tool_calls: [],
        results: {},
        context: { connectedTools: connectedSlugs },
      })
      .select('id')
      .single()

    if (error || !newTask) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }
    taskId = newTask.id
  }

  // Build system prompt with tool context
  const toolContext = buildToolContext(connectedSlugs)
  const systemPrompt = `${employee.systemPrompt}

EXECUTION MODE — you now have real tools connected and are executing a real task.

RULES:
1. ALWAYS call request_approval before any create/send/publish/delete/spend action.
2. Use http_request to call APIs. You know the API docs for each connected tool.
3. After reading data (GET requests), you may proceed to plan or draft without approval.
4. Call task_complete when the task is fully done.
5. If a required tool is not connected, tell the user which tool they need to add and what permissions are needed.
6. Never fabricate API responses — only report what the API actually returned.
7. If an API call fails, explain the error clearly and suggest the fix.
${toolContext}`

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: task },
  ]

  // ── SSE stream ──────────────────────────────────────────────────────────────
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk))

      // Send task ID first so client can track
      send(sseEvent('task_created', { task_id: taskId }))

      const toolCalls: unknown[] = []
      let loopCount = 0
      const MAX_LOOPS = 20

      try {
        while (loopCount < MAX_LOOPS) {
          loopCount++

          // Update task status
          await supabase
            .from('employee_tasks')
            .update({ status: 'executing', messages, updated_at: new Date().toISOString() })
            .eq('id', taskId)

          // Stream Claude response
          let textBuffer = ''
          const toolUseBlocks: Anthropic.ToolUseBlock[] = []

          const claudeStream = await anthropic.messages.stream({
            model: process.env.FALLBACK_REASONING_MODEL ?? 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: systemPrompt,
            tools: [APPROVAL_TOOL, HTTP_REQUEST_TOOL, TASK_COMPLETE_TOOL],
            messages,
          })

          for await (const event of claudeStream) {
            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                textBuffer += event.delta.text
                send(sseEvent('text', event.delta.text))
              } else if (event.delta.type === 'input_json_delta') {
                // Tool input streaming — accumulate silently
              }
            } else if (event.type === 'content_block_start') {
              if (event.content_block.type === 'tool_use') {
                send(sseEvent('tool_start', { tool: event.content_block.name, tool_use_id: event.content_block.id }))
              }
            }
          }

          const finalMsg = await claudeStream.finalMessage()
          const stopReason = finalMsg.stop_reason

          // Collect tool_use blocks from final message
          for (const block of finalMsg.content) {
            if (block.type === 'tool_use') {
              toolUseBlocks.push(block)
            }
          }

          // Add assistant turn to messages
          messages.push({ role: 'assistant', content: finalMsg.content })

          if (stopReason !== 'tool_use' || toolUseBlocks.length === 0) {
            // Natural end — task complete
            await supabase
              .from('employee_tasks')
              .update({ status: 'complete', messages, updated_at: new Date().toISOString() })
              .eq('id', taskId)
            send(sseEvent('complete', { task_id: taskId, message: textBuffer }))
            break
          }

          // Process tool calls
          const toolResults: Anthropic.ToolResultBlockParam[] = []
          let needsApproval = false

          for (const block of toolUseBlocks) {
            const toolBlock = block as Anthropic.ToolUseBlock

            if (toolBlock.name === 'request_approval') {
              const input = toolBlock.input as any
              // Store approval request
              await supabase
                .from('task_approvals')
                .insert({
                  task_id: taskId,
                  sequence: toolCalls.length,
                  action: input.action,
                  preview: {
                    details: input.details,
                    affected: input.affected,
                    reversible: input.reversible,
                  },
                  status: 'pending',
                })

              await supabase
                .from('employee_tasks')
                .update({ status: 'awaiting_approval', messages, updated_at: new Date().toISOString() })
                .eq('id', taskId)

              send(sseEvent('approval_required', {
                task_id: taskId,
                action: input.action,
                details: input.details,
                affected: input.affected,
                reversible: input.reversible,
                tool_use_id: toolBlock.id,
              }))

              needsApproval = true
              // Don't add tool result yet — execution pauses here
              break
            }

            if (toolBlock.name === 'task_complete') {
              const input = toolBlock.input as any
              toolCalls.push({ tool: 'task_complete', ...input })

              await supabase
                .from('employee_tasks')
                .update({
                  status: 'complete',
                  messages,
                  results: input.results ?? {},
                  updated_at: new Date().toISOString(),
                })
                .eq('id', taskId)

              send(sseEvent('complete', { task_id: taskId, summary: input.summary, results: input.results }))
              controller.close()
              return
            }

            if (toolBlock.name === 'http_request') {
              const input = toolBlock.input as any
              send(sseEvent('executing', {
                tool: input.tool,
                method: input.method,
                path: input.path,
                label: `${input.method} ${getTool(input.tool)?.name ?? input.tool}${input.path}`,
              }))

              const conn = connectionMap.get(input.tool)
              if (!conn) {
                const toolDef = getTool(input.tool)
                const result = {
                  error: `Tool "${input.tool}" is not connected. Ask the user to connect ${toolDef?.name ?? input.tool} first.`,
                  required_tool: input.tool,
                  connect_hint: toolDef?.authHint ?? 'Add this tool in the workspace connections panel.',
                }
                toolResults.push({ type: 'tool_result', tool_use_id: toolBlock.id, content: JSON.stringify(result) })
                continue
              }

              const execResult = await executeHttpRequest(
                { tool: input.tool, method: input.method, path: input.path, body: input.body, query: input.query },
                conn.key,
                conn.config
              )

              toolCalls.push({
                tool: input.tool,
                method: input.method,
                path: input.path,
                status: execResult.status,
                ok: execResult.ok,
              })

              // Update last_used_at
              await supabase
                .from('tool_connections')
                .update({ last_used_at: new Date().toISOString() })
                .eq('user_id', user_id)
                .eq('tool_slug', input.tool)

              const resultPayload = execResult.ok
                ? execResult.data
                : { error: execResult.error, status: execResult.status, data: execResult.data }

              send(sseEvent('tool_result', {
                tool: input.tool,
                ok: execResult.ok,
                status: execResult.status,
              }))

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolBlock.id,
                content: JSON.stringify(resultPayload).slice(0, 8000), // cap at 8k to avoid token blowup
              })
            }
          }

          if (needsApproval) {
            // Save tool_calls progress and stop — user must approve
            await supabase
              .from('employee_tasks')
              .update({ tool_calls: toolCalls, updated_at: new Date().toISOString() })
              .eq('id', taskId)
            break
          }

          // Add tool results and continue loop
          if (toolResults.length > 0) {
            messages.push({ role: 'user', content: toolResults })
            await supabase
              .from('employee_tasks')
              .update({ tool_calls: toolCalls, messages, updated_at: new Date().toISOString() })
              .eq('id', taskId)
          }
        }

        if (loopCount >= MAX_LOOPS) {
          send(sseEvent('error', { message: 'Max tool call iterations reached. Task paused.' }))
          await supabase
            .from('employee_tasks')
            .update({ status: 'paused', updated_at: new Date().toISOString() })
            .eq('id', taskId)
        }
      } catch (err: any) {
        console.error('[Setu execute]', err)
        send(sseEvent('error', { message: err.message ?? 'Execution error' }))
        await supabase
          .from('employee_tasks')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', taskId)
      } finally {
        send('data: [DONE]\n\n')
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
