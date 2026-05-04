// @ts-nocheck
/**
 * SETU — Blueprint Type Definitions
 */

import type { AgentMode } from "./agent";

export type BlueprintStatus =
  | "draft"
  | "pending_review"
  | "reviewed"
  | "approved"
  | "rejected"
  | "archived";

export type BlueprintAdminAction = "approve" | "reject" | "request_changes" | "archive";

export interface RequirementExtraction {
  business_function?: string;
  workflow_type?: string;
  pain_points: string[];
  systems_involved: string[];
  tools_mentioned: string[];
  customer_facing?: boolean;
  financial_sensitive?: boolean;
  legal_sensitive?: boolean;
  compliance_sensitive?: boolean;
  healthcare_sensitive?: boolean;
  hr_sensitive?: boolean;
  security_sensitive?: boolean;
  volume_estimate?: string;
  urgency?: string;
  desired_outcome?: string;
  approval_expectations?: string;
  missing_fields: string[];
}

export interface AgentRecommendation {
  agent_id: string;
  agent_name: string;
  confidence_score: number; // 0-100
  match_reasons: string[];
  alternatives?: AlternativeAgent[];
}

export interface AlternativeAgent {
  agent_id: string;
  agent_name: string;
  confidence_score: number;
  why_alternative: string;
}

export interface ToolRequirement {
  tool_name: string;
  category: string;
  is_required: boolean;
  purpose: string;
  integration_complexity?: "low" | "medium" | "high";
}

export interface PolicyGuardrail {
  policy_key: string;
  policy_name: string;
  description: string;
  is_blocking: boolean;
  escalation_required: boolean;
}

export interface RiskAssessment {
  overall_risk: "low" | "medium" | "high" | "critical";
  risk_factors: string[];
  mitigation_notes: string[];
  human_review_required: boolean;
  restricted_actions_detected: string[];
}

export interface AgentPassport {
  passport_id: string;
  agent_id: string;
  default_mode: AgentMode;
  permitted_actions: string[];
  restricted_actions: string[];
  approval_required_actions: string[];
  tool_permissions: Record<string, string[]>;
  data_access_scope: string[];
  audit_level: "standard" | "elevated" | "maximum";
  issued_at: string;
  version: number;
}

export interface CostEstimate {
  setup_range_low: number;
  setup_range_high: number;
  monthly_range_low: number;
  monthly_range_high: number;
  currency: string;
  complexity_driver: string;
  pricing_package: string;
  notes?: string;
}

export interface SandboxPlan {
  sandbox_scope: string;
  test_scenarios: string[];
  success_criteria: string[];
  estimated_duration_days: number;
  data_requirements: string[];
  approval_gates: string[];
}

export interface RolloutPlan {
  phase_1_sandbox: string;
  phase_2_pilot: string;
  phase_3_production: string;
  success_metrics: string[];
  rollback_plan: string;
}

export interface Blueprint {
  id: string;
  session_id?: string;
  conversation_id?: string;
  lead_id?: string;
  version: number;
  status: BlueprintStatus;

  // User input summary
  input_summary: string;
  detected_workflow?: string;

  // Agent recommendation
  recommendation?: AgentRecommendation;

  // Structured blueprint content
  requirements: RequirementExtraction;
  tool_requirements: ToolRequirement[];
  policy_guardrails: PolicyGuardrail[];
  risk_assessment?: RiskAssessment;
  passport?: AgentPassport;
  cost_estimate?: CostEstimate;
  sandbox_plan?: SandboxPlan;
  rollout_plan?: RolloutPlan;
  success_metrics: string[];
  next_cta?: string;

  // Admin review
  admin_notes?: string;
  admin_reviewed_at?: string;
  admin_reviewed_by?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface BlueprintVersion {
  id: string;
  blueprint_id: string;
  version: number;
  snapshot: Blueprint;
  change_summary?: string;
  created_at: string;
}
