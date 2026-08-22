// @ts-nocheck
/**
 * SETU — Audit Logger
 *
 * Every significant action must be logged before and after execution.
 * Audit logs are append-only and must never be deleted.
 *
 * RULES:
 * - Never log secrets, credentials, or LLM prompt content containing user data.
 * - Log entity types and IDs, not raw data.
 * - Use structured metadata — never interpolate secrets into log strings.
 */

import type { AuditEventType, AuditSeverity, AuditLog } from "@/types/governance";

export interface AuditLogEntry {
  event_type: AuditEventType;
  severity?: AuditSeverity;
  tenant_id?: string;
  user_id?: string;
  session_id?: string;
  entity_type?: string;
  entity_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Write an audit log entry.
 * Phase 1: logs to console + returns a pending record.
 * Phase 2+: writes to audit_logs table in Supabase.
 *
 * Returns the audit_log_id for reference in error responses.
 */
export async function writeAuditLog(
  entry: AuditLogEntry
): Promise<{ audit_log_id: string }> {
  const audit_log_id = generateAuditId();

  const record: Omit<AuditLog, "id"> & { id: string } = {
    id: audit_log_id,
    tenant_id: entry.tenant_id,
    user_id: entry.user_id,
    session_id: entry.session_id,
    event_type: entry.event_type,
    severity: entry.severity ?? "info",
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    description: entry.description,
    metadata: sanitizeMetadata(entry.metadata ?? {}),
    ip_address: entry.ip_address,
    user_agent: entry.user_agent,
    created_at: new Date().toISOString(),
  };

  // Structured console log (always)
  console.log(`[AUDIT] ${record.severity.toUpperCase()} ${record.event_type}`, {
    id: record.id,
    entity: record.entity_type ? `${record.entity_type}:${record.entity_id}` : undefined,
    description: record.description,
    metadata_keys: Object.keys(record.metadata),
  });

  // Write to Supabase (non-blocking — never fail the main request on audit error)
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const db = createAdminClient();
    await db.from("audit_logs").insert(record);
  } catch (dbError) {
    console.error("[AUDIT] DB write failed, console-only:", dbError instanceof Error ? dbError.message : "unknown");
  }

  return { audit_log_id };
}

/**
 * Sanitize metadata before logging or storing.
 * Strips any key that looks like a secret or credential.
 */
function sanitizeMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const BLOCKED_KEYS = [
    "password",
    "secret",
    "key",
    "token",
    "credential",
    "api_key",
    "apikey",
    "auth",
    "private",
    "jwt",
    "bearer",
  ];

  return Object.fromEntries(
    Object.entries(metadata).filter(
      ([k]) =>
        !BLOCKED_KEYS.some((blocked) => k.toLowerCase().includes(blocked))
    )
  );
}

function generateAuditId(): string {
  // Prefixed UUID-style ID for quick log scanning
  return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Convenience wrappers for common audit events.
 */
export const auditLog = {
  blueprintGenerated: (blueprintId: string, sessionId?: string) =>
    writeAuditLog({
      event_type: "blueprint_generated",
      entity_type: "blueprint",
      entity_id: blueprintId,
      session_id: sessionId,
      description: "Agent blueprint generated",
    }),

  conversationStarted: (conversationId: string, sessionId?: string) =>
    writeAuditLog({
      event_type: "conversation_started",
      entity_type: "conversation",
      entity_id: conversationId,
      session_id: sessionId,
      description: "New conversation started",
    }),

  leadCreated: (leadId: string, email: string) =>
    writeAuditLog({
      event_type: "lead_created",
      entity_type: "lead",
      entity_id: leadId,
      description: "New lead captured",
      metadata: { email_domain: email.split("@")[1] }, // domain only, not full email
    }),

  approvalRequested: (approvalId: string, actionType: string) =>
    writeAuditLog({
      event_type: "approval_requested",
      severity: "warning",
      entity_type: "approval_request",
      entity_id: approvalId,
      description: `Approval requested for action: ${actionType}`,
      metadata: { action_type: actionType },
    }),

  runtimeBlocked: (reason: string, sessionId?: string) =>
    writeAuditLog({
      event_type: "runtime_action_blocked",
      severity: "warning",
      session_id: sessionId,
      description: `Runtime execution blocked: ${reason}`,
      metadata: { reason },
    }),

  policyDecision: (policyKey: string, result: string, entityId?: string) =>
    writeAuditLog({
      event_type: "policy_decision_made",
      entity_type: "policy_decision",
      entity_id: entityId,
      description: `Policy ${policyKey}: ${result}`,
      metadata: { policy_key: policyKey, result },
    }),

  adminAccess: (userId: string, route: string) =>
    writeAuditLog({
      event_type: "admin_access",
      user_id: userId,
      description: `Admin accessed route: ${route}`,
      metadata: { route },
    }),

  subscriptionCreated: (userId: string, employeeSlug: string, priceCents: number) =>
    writeAuditLog({
      event_type: "subscription_created",
      user_id: userId,
      entity_type: "hired_subscription",
      entity_id: `${userId}:${employeeSlug}`,
      description: `Trial started for ${employeeSlug}`,
      metadata: { employee_slug: employeeSlug, monthly_price_cents: priceCents },
    }),

  subscriptionCancelled: (userId: string, employeeSlug: string, reason?: string) =>
    writeAuditLog({
      event_type: "subscription_cancelled",
      user_id: userId,
      entity_type: "hired_subscription",
      entity_id: `${userId}:${employeeSlug}`,
      description: `Subscription cancelled for ${employeeSlug}`,
      metadata: { employee_slug: employeeSlug, reason: reason ?? null },
    }),

  subscriptionPaused: (userId: string, employeeSlug: string) =>
    writeAuditLog({
      event_type: "subscription_paused",
      user_id: userId,
      entity_type: "hired_subscription",
      entity_id: `${userId}:${employeeSlug}`,
      description: `Subscription paused for ${employeeSlug}`,
      metadata: { employee_slug: employeeSlug },
    }),

  subscriptionResumed: (userId: string, employeeSlug: string) =>
    writeAuditLog({
      event_type: "subscription_resumed",
      user_id: userId,
      entity_type: "hired_subscription",
      entity_id: `${userId}:${employeeSlug}`,
      description: `Subscription resumed for ${employeeSlug}`,
      metadata: { employee_slug: employeeSlug },
    }),

  subscriptionAdminOverride: (adminEmail: string, subscriptionId: string, newStatus: string) =>
    writeAuditLog({
      event_type: "subscription_admin_override",
      severity: "warning",
      user_id: adminEmail,
      entity_type: "hired_subscription",
      entity_id: subscriptionId,
      description: `Admin set subscription ${subscriptionId} to ${newStatus}`,
      metadata: { new_status: newStatus },
    }),

  blueprintReviewed: (adminEmail: string, blueprintId: string, decision: string) =>
    writeAuditLog({
      event_type: decision === "approved" ? "approval_approved" : "approval_rejected",
      user_id: adminEmail,
      entity_type: "blueprint",
      entity_id: blueprintId,
      description: `Blueprint ${blueprintId} ${decision} by admin`,
      metadata: { decision },
    }),
};
