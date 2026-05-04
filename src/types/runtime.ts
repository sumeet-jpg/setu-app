// @ts-nocheck
/**
 * SETU — Runtime Type Definitions
 *
 * Runtime execution is DISABLED until an enterprise runtime provider is activated.
 * RUNTIME_EXECUTION_ENABLED must be false in all environments until then.
 */

export type RuntimeProvider = "n8n" | "temporal" | "prefect" | "custom";

export type RuntimeActivationStatus =
  | "pending_upgrade"
  | "awaiting_configuration"
  | "active"
  | "suspended"
  | "decommissioned";

export type RuntimeDeploymentStatus =
  | "blueprint_ready"
  | "sandbox_scheduled"
  | "sandbox_active"
  | "pilot_scheduled"
  | "pilot_active"
  | "production_scheduled"
  | "production_active"
  | "paused"
  | "terminated";

export type RuntimeRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "blocked_by_policy"
  | "blocked_by_kill_switch"
  | "blocked_no_runtime"
  | "pending_approval";

export interface RuntimeInstance {
  id: string;
  tenant_id?: string;
  provider: RuntimeProvider;
  instance_url?: string;
  activation_status: RuntimeActivationStatus;
  plan_tier?: string;
  // Credentials stored as reference only — never raw
  credential_ref_id?: string;
  is_customer_owned: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RuntimeDeployment {
  id: string;
  tenant_id?: string;
  agent_id: string;
  blueprint_id: string;
  runtime_instance_id?: string;
  status: RuntimeDeploymentStatus;
  // Execution is disabled — this tracks intent only until runtime is active
  execution_disabled_reason?: string;
  approval_request_id?: string;
  deployed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RuntimeRun {
  id: string;
  deployment_id: string;
  tenant_id?: string;
  status: RuntimeRunStatus;
  triggered_by?: string;
  input_summary?: string;
  output_summary?: string;
  blocked_reason?: string;
  policy_decision_id?: string;
  kill_switch_id?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}
