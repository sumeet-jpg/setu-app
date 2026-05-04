// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { createInternalAgentRun, updateInternalAgentRun } from "@/lib/services/admin.service";
import { callLLM, parseLLMJson } from "@/lib/llm/provider";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";
import { writeAuditLog } from "@/lib/governance/audit-logger";

const AGENT_PROMPTS: Record<string, string> = {
  lead_intelligence: "You are a B2B sales intelligence analyst. Given company name and email, research and return a JSON object with: company_summary (string), icp_fit_score (0-100 integer), recommended_agents (array of agent names), talking_points (array of strings), risk_flags (array of strings).",
  workflow_audit_prep: "You are a workflow audit specialist. Given a blueprint summary, return a JSON object with: audit_summary (string), gaps (array), risks (array), recommendations (array), readiness_score (0-100 integer).",
  sales_call_summary: "You are a sales call analyst. Given a transcript, return a JSON object with: summary (string), objections (array), next_actions (array), crm_note (string), follow_up_draft (string).",
  proposal_draft: "You are a B2B proposal writer for an AI operations platform. Return a JSON object with: proposal_sections (array of {title, content}), pricing_summary (string), timeline (string), risks (array).",
  support_triage: "You are a support triage specialist. Given a message, return a JSON object with: category (string), priority (low/medium/high/critical), escalation_required (boolean), escalation_reason (string or null), draft_response (string).",
  founder_brief: "You are a founder's chief of staff. Return a JSON object with: pipeline_summary (string), support_summary (string), priority_actions (array), risk_flags (array).",
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { key } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const inputData = body.input_data ?? {};
    const systemPrompt = AGENT_PROMPTS[key];
    if (!systemPrompt) {
      return NextResponse.json({ ok: false, error: { code: "catalog_no_match", message: `Unknown agent: ${key}` } }, { status: 404 });
    }

    const run = await createInternalAgentRun(key, inputData, auth.user.email);
    await writeAuditLog({ event_type: "internal_agent_run_started", user_id: auth.user.id, entity_type: "internal_agent_run", entity_id: run.id, description: `Internal agent run started: ${key}` });

    // Run the LLM call
    const llmResult = await callLLM({
      system: systemPrompt,
      userMessage: `Input data: ${JSON.stringify(inputData)}\n\nReturn ONLY valid JSON, no preamble.`,
      format: "json",
      modelTier: "reasoning",
      maxTokens: 1500,
    });

    let output: Record<string, unknown>;
    try { output = parseLLMJson(llmResult.content); }
    catch { output = { raw: llmResult.content }; }

    await updateInternalAgentRun(run.id, { status: "completed", output_data: output, completed_at: new Date().toISOString() });
    await writeAuditLog({ event_type: "internal_agent_run_completed", user_id: auth.user.id, entity_type: "internal_agent_run", entity_id: run.id, description: `Internal agent run completed: ${key}` });

    return NextResponse.json(buildSuccessResponse({ run_id: run.id, output }));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, `POST /api/admin/internal-agents/${key}/run`), { status: 500 });
  }
}
