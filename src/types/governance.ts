// @ts-nocheck
/**
 * SETU — Governance Type Definitions
 *
 * Covers: approvals, audit logs, policy decisions, kill switches,
 * file action requests, credential references, cost events, security events.
 */

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";

export type ApprovalActionType =
  | "file_delete"
  | "file_external_share"
  | "file_bulk_delete"
  | "file_permission_change"
  | "external_email_send"
  | "financial_posting"
  | "refund_payment"
  | "legal_medical_advice"
  | "access_provisioning"
  | "access_deprovisioning"
  | "contract_commitment"
  | "pricing_discount_promise"
  | "runtime_deployment"
  | "agent_mode_change"
  | "kill_switch_toggle"
  | "other_sensitive";

export type AuditEventType =
  | "login"
  | "logout"
  | "admin_access"
  | "blueprint_generated"
  | "agent_recommendation_generated"
  | "policy_decision_made"
  | "approval_requested"
  | "approval_approved"
  | "approval_rejected"
  | "file_action_requested"
  | "credential_reference_created"
  | "runtime_deployment_created"
  | "runtime_execution_attempted"
  | "runtime_action_blocked"
  | "kill_switch_enabled"
  | "kill_switch_disabled"
  | "cost_threshold_reached"
  | "support_escalation_created"
  | "security_event_created"
  | "internal_agent_run_started"
  | "internal_agent_run_completed"
  | "internal_agent_run_failed"
  | "lead_created"
  | "conversation_started"
  | "subscription_created"
  | "subscription_cancelled"
  | "subscription_paused"
  | "subscription_resumed"
  | "subscription_admin_override";

export type AuditSeverity = "info" | "warning" | "critical";

export type KillSwitchLevel =
  | "global"
  | "tenant"
  | "agent"
  | "runtime_instance"
  | "runtime_deployment"
  | "tool_connector"
  | "action_type";

export type PolicyDecisionResult = "allowed" | "blocked" | "approval_required" | "escalated";

export interface ApprovalRequest {
  id: string;
  tenant_id?: string;
  conversation_id?: string;
  blueprint_id?: string;
  action_type: ApprovalActionType;
  action_description: string;
  requested_by?: string;
  requested_by_email?: string;
  status: ApprovalStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  metadata: Record<string, unknown>;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  session_id?: string;
  event_type: AuditEventType;
  severity: AuditSeverity;
  entity_type?: string;
  entity_id?: string;
  description: string;
  // Metadata must NEVER contain secrets
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface PolicyDecision {
  id: string;
  tenant_id?: string;
  conversation_id?: string;
  blueprint_id?: string;
  policy_key: string;
  policy_name: string;
  action_attempted: string;
  result: PolicyDecisionResult;
  reason: string;
  escalation_required: boolean;
  audit_log_id?: string;
  created_at: string;
}

export interface KillSwitch {
  id: string;
  level: KillSwitchLevel;
  target_id?: string; // tenant_id, agent_id, etc. — null for global
  target_label: string;
  reason: string;
  is_active: boolean;
  activated_by: string;
  activated_at?: string;
  deactivated_by?: string;
  deactivated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CredentialReference {
  id: string;
  tenant_id?: string;
  label: string;
  provider: string; // e.g. "openai", "salesforce", "gmail"
  secret_ref: string; // Pointer to secret store — never the actual value
  // Raw credentials are NEVER stored here
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CostEvent {
  id: string;
  tenant_id?: string;
  agent_id?: string;
  conversation_id?: string;
  blueprint_id?: string;
  event_type: string;
  provider: string;
  model?: string;
  tokens_used?: number;
  estimated_cost_usd?: number;
  threshold_reached: boolean;
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  tenant_id?: string;
  event_type: string;
  severity: AuditSeverity;
  description: string;
  source_ip?: string;
  user_id?: string;
  metadata: Record<string, unknown>;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface FileActionRequest {
  id: string;
  tenant_id?: string;
  action_type:
    | "delete"
    | "bulk_delete"
    | "external_share"
    | "permission_change";
  file_path?: string;
  file_count?: number;
  requested_by?: string;
  justification?: string;
  approval_request_id?: string;
  status: ApprovalStatus;
  created_at: string;
  updated_at: string;
}
