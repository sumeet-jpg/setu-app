// @ts-nocheck
// ── Setu Agentic Execution Loop ───────────────────────────────────────────────
// Real multi-turn Claude tool_use loop. Claude calls tools → we execute them →
// results fed back → Claude continues. Approval gates pause everything.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server'
import { getEmployee } from '@/lib/employees/profiles'
import { getTool, buildToolContext, TOOL_HONESTY_GUARDRAIL } from '@/lib/tools/registry'
import { executeHttpRequest } from '@/lib/tools/executor'
import { decrypt } from '@/lib/tools/crypto'
import { withManageAuth } from '@/lib/manage-token'
import { checkExecuteCap, logUsage } from '@/lib/usage/cap'
import { loadEmployeeContext } from '@/lib/employees/context'
import { autonomyRulesText } from '@/lib/employees/calibration'
import { getDecryptedCustomerAiKey, touchCustomerAiKeyUsage } from '@/lib/ai-keys'

export const runtime = 'nodejs'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Fire distillation + PIN pattern-check after a task genuinely completes.
// interview/route.ts (the free, pre-hire chat) already did this after 8+
// messages — but this, the real execute loop a hired customer actually
// uses, never called either, so real paid usage never generated new
// memory: employee_beliefs and employee_memories only ever grew from the
// free interview widget. Fired here on every completed task rather than
// gated by message count — a finished real task, with a real outcome, is
// higher-signal than an arbitrary turn count, and execute tasks are often
// shorter than a free-form chat.
function triggerLearning(userId: string, slug: string, taskId: string, messages: any[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${baseUrl}/api/employees/distill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, slug, sessionId: taskId, messages: messages.slice(-20) }),
  }).catch(() => {})
  fetch(`${baseUrl}/api/employees/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'check', userId, slug }),
  }).catch(() => {})
}

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

// This loop decrypts and spends the owner's real connected-tool credentials
// (Slack, HubSpot, Mailchimp, etc.) and can approve+execute high-trust
// actions (send_email, external_api) with no further confirmation once
// approval_result is set. Previously trusted a bare client-supplied user_id
// — anyone who obtained another user's UUID could run tasks and approve
// actions through that person's own connected tools. Now requires a
// verified manage-token; the authoritative user_id comes from the token,
// never from the request body.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  return withManageAuth(req, async (user_id) => runExecute(slug, user_id, req))
}

async function runExecute(slug: string, user_id: string, req: NextRequest): Promise<Response> {
  const employee = getEmployee(slug)
  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  const body = await req.json()
  const { task, task_id: existingTaskId, approval_result } = body

  if (!task && !(existingTaskId && approval_result)) {
    return NextResponse.json({ error: 'task, or task_id + approval_result, required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Setu is a pipeline, not a custodian of inference cost: if the customer
  // has connected their own Anthropic key (migration 025), real execution
  // runs on their account, on their bill — Setu's per-customer spend cap
  // (below) exists only to bound Setu's OWN exposure on the shared key, so
  // it doesn't apply once the customer is paying Anthropic directly.
  const customerApiKey = await getDecryptedCustomerAiKey(supabase, user_id, 'anthropic')

  if (!customerApiKey) {
    // This loop can run up to MAX_LOOPS full Claude calls per request, with
    // no prior cap on how much of that a single customer could rack up —
    // see migration 016. Scoped to this specific (user_id, employee_slug),
    // i.e. the actual $49/mo subscription paying for it.
    const cap = await checkExecuteCap(user_id, slug)
    if (!cap.allowed) {
      return NextResponse.json(
        { error: `This employee has reached its usage limit for this billing period ($${cap.capUsd.toFixed(2)}). Contact support to raise it, or connect your own Anthropic API key in Settings to run without a cap.` },
        { status: 429 }
      )
    }
  }

  const anthropicClient = customerApiKey ? new Anthropic({ apiKey: customerApiKey }) : anthropic
  if (customerApiKey) touchCustomerAiKeyUsage(supabase, user_id, 'anthropic').catch(() => {})

  // Load user's connected tools for this employee
  const { data: connections } = await supabase
    .from('tool_connections')
    .select('tool_slug, encrypted_key, config')
    .eq('user_id', user_id)

  const connectedSlugs = (connections ?? []).map(c => c.tool_slug)
  const connectionMap = new Map(
    (connections ?? []).map(c => [c.tool_slug, { key: c.encrypted_key, config: c.config ?? {} }])
  )

  // Create, or resume, the task record.
  //
  // Resuming an approval used to just resend the original task text as a
  // fresh single-turn conversation — no prior messages, no reference to
  // which tool_use_id was being answered. Claude had no way to actually
  // continue; it either re-asked for approval on the same step or
  // hallucinated a new plan. This loads the persisted conversation and
  // answers the specific pending tool_use with a real tool_result, the way
  // Anthropic's tool-use protocol expects a pause to be resumed.
  let taskId = existingTaskId
  let messages: Anthropic.MessageParam[]

  if (existingTaskId) {
    const { data: existingTask } = await supabase
      .from('employee_tasks')
      .select('id, messages, status')
      .eq('id', existingTaskId)
      .eq('user_id', user_id)
      .maybeSingle()

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    messages = (existingTask.messages as Anthropic.MessageParam[] | null) ?? []

    if (approval_result?.tool_use_id) {
      messages.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: approval_result.tool_use_id,
          content: JSON.stringify(
            approval_result.approved
              ? { approved: true }
              : { approved: false, reason: approval_result.reason ?? 'The user rejected this action.' }
          ),
        }],
      })

      // Close out the pending approval row so it doesn't sit at 'pending'
      // forever — best-effort, doesn't block resuming if the row is
      // somehow already gone or was already decided.
      await supabase
        .from('task_approvals')
        .update({ status: approval_result.approved ? 'approved' : 'rejected', decided_at: new Date().toISOString() })
        .eq('task_id', existingTaskId)
        .eq('tool_use_id', approval_result.tool_use_id)
        .eq('status', 'pending')
    } else if (task) {
      messages.push({ role: 'user', content: task })
    }
  } else {
    messages = [{ role: 'user', content: task }]

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

  // Build system prompt with tool context, the employee's accumulated
  // knowledge of this owner (beliefs, vault docs, org intelligence — this
  // used to be loaded for conversations but silently dropped the moment a
  // task actually executed), and this owner's real trust/autonomy level
  // (was computed and stored but never consulted here either — see
  // src/lib/employees/calibration.ts for the audit note).
  const [toolContext, knowledgeContext, calibrationRow] = await Promise.all([
    Promise.resolve(buildToolContext(connectedSlugs)),
    loadEmployeeContext(user_id, slug, messages.map(m => ({
      role: m.role as string,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }))),
    supabase
      .from('employee_calibration')
      .select('autonomy_level')
      .eq('user_id', user_id)
      .eq('employee_slug', slug)
      .maybeSingle()
      .then(({ data }) => data?.autonomy_level ?? 0.3),
  ])

  const systemPrompt = `${employee.systemPrompt}${TOOL_HONESTY_GUARDRAIL}

EXECUTION MODE — you now have real tools connected and are executing a real task.

${autonomyRulesText(calibrationRow)}

RULES:
1. Use http_request to call APIs. You know the API docs for each connected tool.
2. After reading data (GET requests), you may proceed to plan or draft without approval.
3. Call task_complete when the task is fully done.
4. If a required tool is not connected, tell the user which tool they need to add and what permissions are needed.
5. Never fabricate API responses — only report what the API actually returned.
6. If an API call fails, explain the error clearly and suggest the fix.
${toolContext}${knowledgeContext}`

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

          const claudeStream = await anthropicClient.messages.stream({
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

          logUsage({
            userId: user_id,
            employeeSlug: slug,
            eventType: 'execute',
            model: finalMsg.model,
            inputTokens: finalMsg.usage?.input_tokens ?? 0,
            outputTokens: finalMsg.usage?.output_tokens ?? 0,
          }).catch(() => {})

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
            triggerLearning(user_id, slug, taskId, messages)
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
              // Known gap: if this same assistant turn also contains OTHER
              // tool_use blocks (e.g. Claude batched a read alongside the
              // approval request), those never receive a tool_result before
              // we pause here — resuming with only the approval's result
              // leaves the turn API-invalid. Not observed in practice (the
              // system prompt's rules teach a strictly sequential
              // read-then-gate pattern), but a real fix would need to
              // persist those partial results too. Store approval request

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
                  tool_use_id: toolBlock.id,
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

              triggerLearning(user_id, slug, taskId, messages)
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
