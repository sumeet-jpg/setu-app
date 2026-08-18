// @ts-nocheck
/**
 * SETU — Admin Service
 * All Supabase queries for the admin console.
 * Always uses createAdminClient() (service role).
 */

import { createAdminClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const db = createAdminClient();
  const [blueprints, leads, approvals, killSwitches, auditLogs, agents] =
    await Promise.all([
      db.from("generated_blueprints").select("id", { count: "exact" }).eq("status", "pending_review"),
      db.from("leads").select("id", { count: "exact" }).eq("status", "new"),
      db.from("approval_requests").select("id", { count: "exact" }).eq("status", "pending"),
      db.from("kill_switches").select("id", { count: "exact" }).eq("is_active", true),
      db.from("audit_logs").select("id, event_type, severity, description, created_at").order("created_at", { ascending: false }).limit(5),
      db.from("agents").select("id", { count: "exact" }).eq("is_public", true),
    ]);
  return {
    blueprints_pending: blueprints.count ?? 0,
    leads_new: leads.count ?? 0,
    approvals_pending: approvals.count ?? 0,
    kill_switches_active: killSwitches.count ?? 0,
    agents_total: agents.count ?? 0,
    recent_audit_logs: auditLogs.data ?? [],
  };
}

export async function getBlueprints(opts?: { status?: string; limit?: number }) {
  const db = createAdminClient();
  let query = db
    .from("generated_blueprints")
    .select("id, status, input_summary, recommendation, risk_assessment, cost_estimate, created_at, updated_at, session_id, version")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);
  if (opts?.status) query = query.eq("status", opts.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getBlueprintDetail(id: string) {
  const db = createAdminClient();
  const { data } = await db.from("generated_blueprints").select("*").eq("id", id).single();
  return data;
}

export async function reviewBlueprint(id: string, action: "approve" | "reject" | "request_changes", adminId: string, notes?: string) {
  const db = createAdminClient();
  const statusMap = { approve: "approved", reject: "rejected", request_changes: "reviewed" };
  await db.from("generated_blueprints").update({ status: statusMap[action], admin_notes: notes, admin_reviewed_at: new Date().toISOString(), admin_reviewed_by: adminId }).eq("id", id);
}

export async function getLeads(opts?: { status?: string; limit?: number }) {
  const db = createAdminClient();
  let query = db.from("leads").select("id, email, name, company, role, status, source, created_at, updated_at, conversation_id, blueprint_id").order("created_at", { ascending: false }).limit(opts?.limit ?? 50);
  if (opts?.status) query = query.eq("status", opts.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateLeadStatus(id: string, status: string, notes?: string) {
  const db = createAdminClient();
  await db.from("leads").update({ status, admin_notes: notes }).eq("id", id);
}

export async function getAgents(opts?: { category?: string; tier?: string }) {
  const db = createAdminClient();
  let query = db.from("agents").select("*").order("agent_id", { ascending: true });
  if (opts?.category) query = query.eq("category", opts.category);
  if (opts?.tier) query = query.eq("readiness_tier", opts.tier);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateAgent(id: string, updates: { status?: string; readiness_tier?: string; is_flagship?: boolean; is_public?: boolean; default_mode?: string }) {
  const db = createAdminClient();
  await db.from("agents").update(updates).eq("id", id);
}

export async function getApprovals(opts?: { status?: string }) {
  const db = createAdminClient();
  let query = db.from("approval_requests").select("*").order("created_at", { ascending: false }).limit(50);
  if (opts?.status) query = query.eq("status", opts.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function resolveApproval(id: string, action: "approved" | "rejected", adminId: string, notes?: string) {
  const db = createAdminClient();
  await db.from("approval_requests").update({ status: action, reviewed_by: adminId, reviewed_at: new Date().toISOString(), review_notes: notes }).eq("id", id);
}

export async function getEmployeeHires(opts?: { status?: string; employee_slug?: string }) {
  const db = createAdminClient();
  let query = db
    .from("employee_hires")
    .select("id, created_at, name, email, company, role, company_size, use_case, timeline, employee_slug, employee_name, employee_title, status, admin_notes")
    .order("created_at", { ascending: false })
    .limit(200);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.employee_slug) query = query.eq("employee_slug", opts.employee_slug);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateHireStatus(id: string, status: string, admin_notes?: string) {
  const db = createAdminClient();
  const updates: Record<string, string> = { status };
  if (admin_notes !== undefined) updates.admin_notes = admin_notes;
  const { error } = await db.from("employee_hires").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAuditLogs(opts?: { event_type?: string; severity?: string; limit?: number }) {
  const db = createAdminClient();
  let query = db.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(opts?.limit ?? 100);
  if (opts?.event_type) query = query.eq("event_type", opts.event_type);
  if (opts?.severity) query = query.eq("severity", opts.severity);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getKillSwitches() {
  const db = createAdminClient();
  const { data, error } = await db.from("kill_switches").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function toggleKillSwitch(id: string, activate: boolean, adminEmail: string) {
  const db = createAdminClient();
  await db.from("kill_switches").update({ is_active: activate, ...(activate ? { activated_by: adminEmail, activated_at: new Date().toISOString() } : { deactivated_by: adminEmail, deactivated_at: new Date().toISOString() }) }).eq("id", id);
}

export async function getRuntimeInstances() {
  const db = createAdminClient();
  const { data, error } = await db.from("runtime_instances").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSupportTickets(opts?: { status?: string }) {
  const db = createAdminClient();
  let query = db.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(50);
  if (opts?.status) query = query.eq("status", opts.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getInternalAgents() {
  const db = createAdminClient();
  const { data, error } = await db.from("internal_agents").select("*").eq("is_active", true).order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getInternalAgentRuns(agentId?: string) {
  const db = createAdminClient();
  let query = db.from("internal_agent_runs").select("*, internal_agents(name, agent_key)").order("created_at", { ascending: false }).limit(20);
  if (agentId) query = query.eq("agent_id", agentId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createInternalAgentRun(agentKey: string, inputData: Record<string, unknown>, triggeredBy: string) {
  const db = createAdminClient();
  const { data: agent } = await db.from("internal_agents").select("id").eq("agent_key", agentKey).single();
  if (!agent) throw new Error(`Internal agent not found: ${agentKey}`);
  const { data, error } = await db.from("internal_agent_runs").insert({ agent_id: agent.id, triggered_by: triggeredBy, status: "queued", input_data: inputData, started_at: new Date().toISOString() }).select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateInternalAgentRun(runId: string, updates: { status: string; output_data?: Record<string, unknown>; error_message?: string; completed_at?: string }) {
  const db = createAdminClient();
  await db.from("internal_agent_runs").update(updates).eq("id", runId);
}
