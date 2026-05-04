/**
 * SETU — Conversation Service
 *
 * Handles all database reads and writes for conversations,
 * messages, state, blueprints, and leads.
 *
 * Uses the admin client (service role) for all writes —
 * public API routes validate session before calling.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { ConversationStage, ConversationMessage } from "@/types/conversation";
import type { RequirementExtraction, Blueprint } from "@/types/blueprint";

// ─────────────────────────────────────────────────────────────
// Conversation CRUD
// ─────────────────────────────────────────────────────────────

export async function createConversation(sessionId: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("conversations")
    .insert({ session_id: sessionId, stage: "problem_discovery" })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data;
}

export async function getConversation(conversationId: string, sessionId: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("session_id", sessionId) // session scoping for security
    .single();

  if (error) return null;
  return data;
}

export async function updateConversationStage(
  conversationId: string,
  stage: ConversationStage,
  blueprintId?: string
) {
  const db = createAdminClient();
  const update: Record<string, unknown> = { stage };
  if (blueprintId) update.blueprint_id = blueprintId;

  await db
    .from("conversations")
    .update(update)
    .eq("id", conversationId);
}

// ─────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  structuredResponse?: Record<string, unknown>,
  intent?: string
) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("conversation_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      structured_response: structuredResponse ?? null,
      intent: intent ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save message: ${error.message}`);
  return data;
}

export async function getMessages(conversationId: string): Promise<ConversationMessage[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("conversation_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as ConversationMessage[];
}

// ─────────────────────────────────────────────────────────────
// Conversation State
// ─────────────────────────────────────────────────────────────

export async function getOrCreateConversationState(conversationId: string) {
  const db = createAdminClient();

  const { data: existing } = await db
    .from("conversation_state")
    .select("*")
    .eq("conversation_id", conversationId)
    .single();

  if (existing) return existing;

  const { data: created, error } = await db
    .from("conversation_state")
    .insert({
      conversation_id: conversationId,
      stage: "problem_discovery",
      requirements: {},
      lead_captured: false,
      turn_count: 0,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create conversation state: ${error.message}`);
  return created;
}

export async function updateConversationState(
  conversationId: string,
  updates: {
    stage?: ConversationStage;
    requirements?: Partial<RequirementExtraction>;
    blueprint_id?: string;
    lead_captured?: boolean;
    last_intent?: string;
    turn_count?: number;
  }
) {
  const db = createAdminClient();
  await db
    .from("conversation_state")
    .update(updates)
    .eq("conversation_id", conversationId);
}

// ─────────────────────────────────────────────────────────────
// Blueprints
// ─────────────────────────────────────────────────────────────

export async function createBlueprint(
  conversationId: string,
  sessionId: string,
  inputSummary: string
) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("generated_blueprints")
    .insert({
      conversation_id: conversationId,
      session_id: sessionId,
      version: 1,
      status: "draft",
      input_summary: inputSummary,
      requirements: {},
      tool_requirements: [],
      policy_guardrails: [],
      success_metrics: [],
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create blueprint: ${error.message}`);
  return data;
}

export async function updateBlueprint(
  blueprintId: string,
  patch: Partial<Blueprint>
) {
  const db = createAdminClient();

  const dbUpdate: Record<string, unknown> = {};
  if (patch.input_summary) dbUpdate.input_summary = patch.input_summary;
  if (patch.detected_workflow) dbUpdate.detected_workflow = patch.detected_workflow;
  if (patch.recommendation !== undefined) dbUpdate.recommendation = patch.recommendation;
  if (patch.requirements) dbUpdate.requirements = patch.requirements;
  if (patch.tool_requirements) dbUpdate.tool_requirements = patch.tool_requirements;
  if (patch.policy_guardrails) dbUpdate.policy_guardrails = patch.policy_guardrails;
  if (patch.risk_assessment) dbUpdate.risk_assessment = patch.risk_assessment;
  if (patch.passport) dbUpdate.passport = patch.passport;
  if (patch.cost_estimate) dbUpdate.cost_estimate = patch.cost_estimate;
  if (patch.sandbox_plan) dbUpdate.sandbox_plan = patch.sandbox_plan;
  if (patch.rollout_plan) dbUpdate.rollout_plan = patch.rollout_plan;
  if (patch.success_metrics) dbUpdate.success_metrics = patch.success_metrics;
  if (patch.next_cta) dbUpdate.next_cta = patch.next_cta;

  if (Object.keys(dbUpdate).length === 0) return;

  await db
    .from("generated_blueprints")
    .update(dbUpdate)
    .eq("id", blueprintId);

  // Save a version snapshot
  const { data: current } = await db
    .from("generated_blueprints")
    .select("version")
    .eq("id", blueprintId)
    .single();

  if (current) {
    const newVersion = (current.version ?? 1) + 1;
    await db.from("blueprint_versions").insert({
      blueprint_id: blueprintId,
      version: newVersion,
      snapshot: { ...dbUpdate, id: blueprintId },
      change_summary: "Pipeline update",
    });
    await db
      .from("generated_blueprints")
      .update({ version: newVersion })
      .eq("id", blueprintId);
  }
}

export async function getBlueprintById(blueprintId: string, sessionId: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("generated_blueprints")
    .select("*")
    .eq("id", blueprintId)
    .eq("session_id", sessionId)
    .single();

  if (error) return null;
  return data;
}

// ─────────────────────────────────────────────────────────────
// Leads
// ─────────────────────────────────────────────────────────────

export async function createLead(
  email: string,
  opts?: {
    name?: string;
    company?: string;
    role?: string;
    conversationId?: string;
    blueprintId?: string;
  }
) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("leads")
    .insert({
      email,
      name: opts?.name,
      company: opts?.company,
      role: opts?.role,
      conversation_id: opts?.conversationId,
      blueprint_id: opts?.blueprintId,
      status: "new",
      source: "blueprint_builder",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create lead: ${error.message}`);
  return data;
}

// ─────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────

let _catalogCache: { agents: import("@/types/agent").Agent[]; fetchedAt: number } | null = null;
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

export async function getCatalog() {
  const now = Date.now();
  if (_catalogCache && now - _catalogCache.fetchedAt < CATALOG_CACHE_TTL_MS) {
    return _catalogCache.agents;
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("agents")
    .select("*")
    .eq("is_public", true)
    .neq("status", "disabled");

  if (error) throw new Error(`Failed to fetch catalog: ${error.message}`);

  _catalogCache = { agents: (data ?? []) as import("@/types/agent").Agent[], fetchedAt: now };
  return _catalogCache.agents;
}
