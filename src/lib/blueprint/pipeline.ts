// @ts-nocheck
/**
 * SETU — Blueprint Pipeline Orchestrator
 *
 * 13-step pipeline:
 * 1. User message received
 * 2. Intent classification
 * 3. Requirement extraction (LLM)
 * 4. Missing field detection
 * 5. Agent catalog matching (deterministic scoring)
 * 6. Tool requirement mapping
 * 7. Policy guardrail mapping (deterministic)
 * 8. Risk assessment (deterministic)
 * 9. Agent Passport generation
 * 10. Cost/complexity estimate
 * 11. Sandbox/pilot plan
 * 12. Blueprint versioning
 * 13. Structured response generation (LLM)
 */

import { callLLM, parseLLMJson } from "@/lib/llm/provider";
import { logCostEvent } from "@/lib/llm/cost-tracker";
import { classifyIntent } from "./intent-classifier";
import { matchAgents, buildCatalogSummary } from "./agent-matcher";
import { applyPolicies } from "./policy-engine";
import { assessRisk } from "./risk-scorer";
import { generatePassport } from "./passport-generator";
import { estimateCost } from "./cost-estimator";
import { generateSandboxPlan, generateRolloutPlan } from "./sandbox-planner";
import { buildWorkflowAdvisorSystemPrompt } from "@/prompts/workflow-advisor";
import { writeAuditLog } from "@/lib/governance/audit-logger";

import type {
  AssistantResponse,
  ConversationStage,
} from "@/types/conversation";
import type {
  RequirementExtraction,
  Blueprint,
  ToolRequirement,
} from "@/types/blueprint";
import type { Agent } from "@/types/agent";

export interface PipelineInput {
  conversationId: string;
  sessionId?: string;
  userMessage: string;
  messageHistory: Array<{ role: "user" | "assistant"; content: string }>;
  currentState: {
    stage: ConversationStage;
    requirements: Partial<RequirementExtraction>;
    blueprint?: Partial<Blueprint>;
  };
  catalog: Agent[];
}

export interface PipelineOutput {
  response: AssistantResponse;
  updatedRequirements: Partial<RequirementExtraction>;
  updatedBlueprint: Partial<Blueprint>;
  intent: string;
  newStage: ConversationStage;
}

/**
 * Run the full 13-step blueprint pipeline for a single user message.
 */
export async function runBlueprintPipeline(
  input: PipelineInput
): Promise<PipelineOutput> {
  const {
    conversationId,
    sessionId,
    userMessage,
    messageHistory,
    currentState,
    catalog,
  } = input;

  // ── Step 1: Already have the user message ────────────────────

  // ── Step 2: Intent classification ───────────────────────────
  const intentResult = await classifyIntent(userMessage);
  const { intent } = intentResult;

  await writeAuditLog({
    event_type: "conversation_started",
    session_id: sessionId,
    description: `Intent classified: ${intent}`,
    metadata: { intent, confidence: intentResult.confidence, conversation_id: conversationId },
  });

  // Handle unsafe requests early — do not pass to main LLM
  if (intent === "unsafe_request") {
    return buildSafeRefusal(currentState, conversationId);
  }

  // ── Step 3 & 4: Requirement extraction + missing field detection ──
  // Done inside the main LLM call via structured response

  // ── Step 5: Agent catalog matching ──────────────────────────
  const catalogSummary = buildCatalogSummary(catalog);
// ── Step 5: Agent catalog matching ──────────────────────────
// Only match after turn 3+ and when we have meaningful requirements
const existingReqs = currentState.requirements;
const hasEnoughInfo =
  (input.messageHistory.length >= 4) &&
  (existingReqs.pain_points?.length > 0 || existingReqs.tools_mentioned?.length > 0) &&
  currentState.stage !== "problem_discovery";

const recommendation = hasEnoughInfo ? matchAgents(catalog, existingReqs) : null;

  // ── Step 6: Tool requirement mapping ────────────────────────
  let toolRequirements: ToolRequirement[] = [];
  const matchedAgent = recommendation
    ? catalog.find((a) => a.agent_id === recommendation.agent_id)
    : undefined;

  if (matchedAgent) {
    toolRequirements = [
      ...matchedAgent.required_tools.map((t) => ({
        tool_name: t,
        category: "required",
        is_required: true,
        purpose: `Required for ${matchedAgent.name}`,
        integration_complexity: matchedAgent.complexity === "enterprise" ? "high" as const : "medium" as const,
      })),
      ...matchedAgent.optional_tools.map((t) => ({
        tool_name: t,
        category: "optional",
        is_required: false,
        purpose: `Optional enhancement for ${matchedAgent.name}`,
        integration_complexity: "low" as const,
      })),
    ];
  }

  // ── Step 7: Policy guardrail mapping ────────────────────────
  const policyGuardrails = applyPolicies(
    existingReqs,
    matchedAgent?.category
  );

  // ── Step 8: Risk assessment ──────────────────────────────────
  const riskAssessment = matchedAgent
    ? assessRisk(existingReqs, matchedAgent)
    : assessRisk(existingReqs);

  // ── Step 9: Agent Passport ───────────────────────────────────
  const passport = matchedAgent
    ? generatePassport(matchedAgent, riskAssessment)
    : undefined;

  // ── Step 10: Cost estimate ───────────────────────────────────
  const costEstimate = matchedAgent
    ? estimateCost(matchedAgent, existingReqs)
    : undefined;

  // ── Step 11: Sandbox plan ────────────────────────────────────
  const sandboxPlan =
    matchedAgent && currentState.stage !== "problem_discovery"
      ? generateSandboxPlan(matchedAgent, riskAssessment)
      : undefined;

  const rolloutPlan =
    matchedAgent && currentState.stage !== "problem_discovery"
      ? generateRolloutPlan(matchedAgent, riskAssessment)
      : undefined;

  // ── Step 12 & 13: Structured LLM response ───────────────────
  // Build context for LLM — deterministic data computed above
  const blueprintContext = {
    matched_agent: matchedAgent
      ? {
          agent_id: matchedAgent.agent_id,
          name: matchedAgent.name,
          confidence_score: recommendation?.confidence_score,
          match_reasons: recommendation?.match_reasons,
        }
      : null,
    tool_requirements: toolRequirements.length,
    policy_guardrails: policyGuardrails.map((p) => p.policy_name),
    risk_level: riskAssessment.overall_risk,
    cost_estimate: costEstimate
      ? `$${costEstimate.setup_range_low.toLocaleString()}–$${costEstimate.setup_range_high.toLocaleString()} setup`
      : null,
  };

  const historyText = messageHistory
    .slice(-6) // last 6 turns for context
    .map((m) => `${m.role === "user" ? "User" : "Advisor"}: ${m.content}`)
    .join("\n");

  const userPrompt = `## Conversation so far:
${historyText}

## New user message:
"${userMessage}"

## Current conversation stage: ${currentState.stage}

## Already extracted requirements:
${JSON.stringify(existingReqs, null, 2)}

## Deterministic analysis results:
${JSON.stringify(blueprintContext, null, 2)}

Based on the above, produce the full structured JSON response.
- Update structured_requirement_update with any new information from this message
- Update blueprint_patch with the deterministic results provided
- Move to the next conversation stage only if sufficient information has been gathered
- Keep assistant_message warm, expert, and focused on the most important next question or insight`;

  const llmResult = await callLLM({
    system: buildWorkflowAdvisorSystemPrompt(catalogSummary),
    userMessage: userPrompt,
    format: "json",
    modelTier: "reasoning",
    maxTokens: 2000,
    temperature: 0.3,
  });

  // Track cost
  await logCostEvent(llmResult, {
    conversationId,
    eventType: "blueprint_pipeline_response",
  });

  // ── Parse and validate the LLM response ─────────────────────
  let parsed: Partial<AssistantResponse>;
  try {
    parsed = parseLLMJson<Partial<AssistantResponse>>(llmResult.content);
  } catch {
    // Fallback response if JSON parsing fails
    parsed = {
      assistant_message:
        "I'm processing your workflow details. Could you tell me a bit more about which systems are currently involved in this process?",
      conversation_stage: currentState.stage,
      next_questions: ["Which tools or software does your team use for this workflow?"],
      cta: "Continue describing your workflow",
    };
  }

  // ── Merge deterministic data into blueprint_patch ────────────
  // LLM cannot override deterministic governance data
  const safeBlueprintPatch: Partial<Blueprint> = {
    ...(parsed.blueprint_patch as Partial<Blueprint> ?? {}),
    // Deterministic data always wins over LLM-generated
    tool_requirements: toolRequirements,
    policy_guardrails: policyGuardrails,
    risk_assessment: riskAssessment,
    ...(passport ? { passport } : {}),
    ...(costEstimate ? { cost_estimate: costEstimate } : {}),
    ...(sandboxPlan ? { sandbox_plan: sandboxPlan } : {}),
    ...(rolloutPlan ? { rollout_plan: rolloutPlan } : {}),
    ...(recommendation ? { recommendation } : {}),
  };

  const newStage = (parsed.conversation_stage ?? currentState.stage) as ConversationStage;
  const updatedRequirements: Partial<RequirementExtraction> = {
    ...existingReqs,
    ...((parsed.structured_requirement_update as Partial<RequirementExtraction>) ?? {}),
  };

  const response: AssistantResponse = {
    assistant_message: parsed.assistant_message ?? "Could you tell me more about your workflow?",
    conversation_stage: newStage,
    structured_requirement_update: updatedRequirements,
    blueprint_patch: safeBlueprintPatch,
    next_questions: parsed.next_questions ?? [],
    ui_cards: parsed.ui_cards ?? [],
    cta: parsed.cta ?? "Continue describing your workflow",
  };

  return {
    response,
    updatedRequirements,
    updatedBlueprint: safeBlueprintPatch,
    intent,
    newStage,
  };
}

/**
 * Return a safe refusal response for unsafe intents.
 * No LLM call — deterministic response only.
 */
function buildSafeRefusal(
  currentState: PipelineInput["currentState"],
  conversationId: string
): PipelineOutput {
  writeAuditLog({
    event_type: "runtime_action_blocked",
    severity: "warning",
    description: "Unsafe request detected and refused",
    metadata: { conversation_id: conversationId },
  });

  const response: AssistantResponse = {
    assistant_message:
      "I'm not able to help with that request. Setu is designed to deploy governed AI agents with approval and audit controls built in — bypassing those controls isn't something I can assist with.\n\nI'm happy to help you blueprint a legitimate workflow instead. What operational problem would you like to solve?",
    conversation_stage: currentState.stage,
    structured_requirement_update: {},
    blueprint_patch: {},
    next_questions: [
      "What operational workflow are you trying to improve?",
    ],
    ui_cards: [],
    cta: "Describe a workflow problem to get started",
  };

  return {
    response,
    updatedRequirements: currentState.requirements,
    updatedBlueprint: currentState.blueprint ?? {},
    intent: "unsafe_request",
    newStage: currentState.stage,
  };
}
