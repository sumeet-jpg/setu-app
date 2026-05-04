// @ts-nocheck
/**
 * SETU — Execution Gate
 *
 * Every agent action must pass ALL 12 checks before execution.
 * If any check fails, execution is blocked and an audit log is written.
 *
 * Current state: runtime execution is disabled globally.
 * This gate enforces that at check #1.
 */

import { GovernanceError, RuntimeDisabledError, SETU_ERROR_CODES } from "@/lib/errors/setu-errors";
import { isRuntimeExecutionEnabled } from "@/lib/env";
import { writeAuditLog } from "./audit-logger";

export interface ExecutionContext {
  session_id?: string;
  tenant_id?: string;
  agent_id?: string;
  user_id?: string;
  action_type: string;
  action_description: string;
  kill_switch_ids?: string[];
  has_approval?: boolean;
  approval_request_id?: string;
  estimated_cost_usd?: number;
  cost_limit_usd?: number;
}

export interface GateCheckResult {
  passed: boolean;
  failed_check?: string;
  reason?: string;
  audit_log_id?: string;
}

/**
 * Run the full 12-point execution gate.
 * Throws a GovernanceError (or subclass) if any check fails.
 * Returns void on full pass.
 *
 * Checks:
 * 1. Identity check
 * 2. Tenant check
 * 3. Agent passport check
 * 4. Permission check
 * 5. Policy check
 * 6. Risk score check
 * 7. Approval check
 * 8. Cost check
 * 9. Kill-switch check
 * 10. Runtime execution enabled check
 * 11. Audit log (pre-execution)
 * 12. Proceed to execution (caller responsibility)
 */
export async function runExecutionGate(
  ctx: ExecutionContext
): Promise<{ audit_log_id: string }> {
  // ── Check 1: Identity ────────────────────────────────────────
  if (!ctx.session_id && !ctx.user_id) {
    const { audit_log_id } = await writeAuditLog({
      event_type: "runtime_action_blocked",
      severity: "warning",
      description: "Execution blocked: no identity",
      metadata: { action_type: ctx.action_type, check: "identity" },
    });
    throw new GovernanceError(
      SETU_ERROR_CODES.PERMISSION_DENIED,
      "Identity verification required before execution.",
      "identity_check",
      audit_log_id
    );
  }

  // ── Check 2: Tenant ──────────────────────────────────────────
  // Phase 1: tenant isolation not yet enforced in DB; will be in Phase 2
  // Placeholder: always passes

  // ── Check 3: Agent Passport ──────────────────────────────────
  // Phase 2: will validate passport exists and is valid
  // Placeholder: always passes

  // ── Check 4: Permission ──────────────────────────────────────
  // Phase 2: will check user_roles and agent permitted_actions
  // Placeholder: always passes

  // ── Check 5: Policy ─────────────────────────────────────────
  // Phase 2: will run policy_templates against action
  // Placeholder: always passes

  // ── Check 6: Risk Score ──────────────────────────────────────
  // Phase 2: will check risk_assessment.overall_risk
  // Placeholder: always passes

  // ── Check 7: Approval ────────────────────────────────────────
  const needsApproval = isApprovalRequired(ctx.action_type);
  if (needsApproval && !ctx.has_approval) {
    const { audit_log_id } = await writeAuditLog({
      event_type: "approval_requested",
      severity: "warning",
      session_id: ctx.session_id,
      tenant_id: ctx.tenant_id,
      description: `Execution blocked pending approval: ${ctx.action_type}`,
      metadata: { action_type: ctx.action_type, check: "approval" },
    });
    throw new GovernanceError(
      SETU_ERROR_CODES.APPROVAL_REQUIRED,
      "This action requires human approval before it can proceed.",
      "approval_check",
      audit_log_id
    );
  }

  // ── Check 8: Cost ────────────────────────────────────────────
  if (
    ctx.estimated_cost_usd !== undefined &&
    ctx.cost_limit_usd !== undefined &&
    ctx.estimated_cost_usd > ctx.cost_limit_usd
  ) {
    const { audit_log_id } = await writeAuditLog({
      event_type: "cost_threshold_reached",
      severity: "warning",
      session_id: ctx.session_id,
      description: `Execution blocked: estimated cost exceeds limit`,
      metadata: {
        estimated_cost_usd: ctx.estimated_cost_usd,
        limit_usd: ctx.cost_limit_usd,
      },
    });
    throw new GovernanceError(
      SETU_ERROR_CODES.COST_LIMIT_REACHED,
      "Estimated cost exceeds configured limit. Admin approval required.",
      "cost_check",
      audit_log_id
    );
  }

  // ── Check 9: Kill Switch ─────────────────────────────────────
  // Phase 2: will query kill_switches table
  // For now: global kill switch is runtime being disabled (caught in check 10)

  // ── Check 10: Runtime Execution Enabled ──────────────────────
  if (!isRuntimeExecutionEnabled()) {
    const { audit_log_id } = await writeAuditLog({
      event_type: "runtime_action_blocked",
      severity: "warning",
      session_id: ctx.session_id,
      description: "Runtime execution blocked: provider not yet activated",
      metadata: { action_type: ctx.action_type, check: "runtime_enabled" },
    });
    const err = new RuntimeDisabledError();
    // Attach audit_log_id
    throw new GovernanceError(
      err.code,
      err.clientMessage,
      err.policyKey,
      audit_log_id
    );
  }

  // ── Check 11: Pre-execution Audit Log ────────────────────────
  const { audit_log_id } = await writeAuditLog({
    event_type: "runtime_execution_attempted",
    severity: "info",
    session_id: ctx.session_id,
    tenant_id: ctx.tenant_id,
    description: `Execution gate passed: ${ctx.action_description}`,
    metadata: {
      action_type: ctx.action_type,
      agent_id: ctx.agent_id,
      has_approval: ctx.has_approval,
    },
  });

  // ── Check 12: Caller proceeds to execution ───────────────────
  return { audit_log_id };
}

/**
 * Restricted actions that always require human approval.
 * This list is additive — never remove items.
 */
const ALWAYS_APPROVAL_REQUIRED_ACTIONS = [
  "file_delete",
  "file_bulk_delete",
  "file_external_share",
  "file_permission_change",
  "external_email_send",
  "financial_posting",
  "refund_payment",
  "legal_medical_advice",
  "access_provisioning",
  "access_deprovisioning",
  "contract_commitment",
  "pricing_discount_promise",
];

function isApprovalRequired(actionType: string): boolean {
  return ALWAYS_APPROVAL_REQUIRED_ACTIONS.includes(actionType);
}
