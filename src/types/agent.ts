/**
 * SETU — Agent Type Definitions
 */

export type AgentReadinessTier =
  | "tier_1_pilot_ready"
  | "tier_2_packaged_offer"
  | "tier_3_catalog_offer"
  | "internal_only"
  | "experimental";

export type AgentComplexity = "starter" | "growth" | "enterprise";

export type AgentMode =
  | "observe_only"
  | "draft_only"
  | "approval_required"
  | "guarded_autonomy"
  | "admin_only"
  | "disabled";

export type AgentStatus =
  | "active"
  | "sandbox"
  | "pilot"
  | "production"
  | "deprecated"
  | "disabled";

export type SalesConfidence = "very_high" | "high" | "medium" | "low";

export type CommercialPriority = "A" | "B" | "C";

export type LaunchTier =
  | "Tier 1 Pilot-Ready"
  | "Tier 2 Packaged Offer"
  | "Tier 3 Catalog Offer";

export interface Agent {
  id: string;
  agent_id: string; // e.g. SETU-001
  name: string;
  slug: string;
  category: string;
  vertical?: string;
  sub_vertical?: string;
  primary_buyer?: string;
  best_icp?: string;
  pain_problem: string;
  business_outcome: string;
  core_capabilities: string[];
  required_tools: string[];
  optional_tools: string[];
  complexity: AgentComplexity;
  default_mode: AgentMode;
  status: AgentStatus;
  readiness_tier: AgentReadinessTier;
  launch_tier: LaunchTier;
  pricing_band?: string;
  sales_confidence?: SalesConfidence;
  commercial_priority?: CommercialPriority;
  best_demo?: string;
  sales_motion?: string;
  why_sell_first?: string;
  is_flagship: boolean;
  is_public: boolean;
  demo_script?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentCandidateReference {
  id: string;
  rank: number;
  workflow_id: string;
  title: string;
  candidate_type: string;
  business_function: string;
  complexity: string;
  score: number;
  node_count: number;
  systems: string[];
  // Internal use only — never expose publicly
  created_at: string;
}

export interface InternalAgent {
  id: string;
  agent_key: string;
  name: string;
  purpose: string;
  owner: string;
  mode: AgentMode;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  allowed_actions: string[];
  approval_required_actions: string[];
  restricted_actions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
