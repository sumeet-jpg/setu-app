// @ts-nocheck
/**
 * SETU — Policy Engine
 *
 * Maps requirements to applicable policy guardrails.
 * Returns the list of policies that apply to this blueprint.
 *
 * RULE: policies are additive — never removed by user request.
 * The LLM does NOT decide which policies apply.
 * This is deterministic logic only.
 */

import type { RequirementExtraction, PolicyGuardrail } from "@/types/blueprint";

// All Setu policies — sourced from seed data
const ALL_POLICIES: PolicyGuardrail[] = [
  {
    policy_key: "sandbox_required_before_production",
    policy_name: "Sandbox Required Before Production",
    description:
      "Every agent must complete sandbox validation before moving to production.",
    is_blocking: true,
    escalation_required: false,
  },
  {
    policy_key: "log_every_action",
    policy_name: "Log Every Action",
    description:
      "Every agent action, decision, and output must be written to the audit log.",
    is_blocking: true,
    escalation_required: false,
  },
  {
    policy_key: "no_external_send_without_approval",
    policy_name: "No External Send Without Approval",
    description:
      "Agents may not send external emails or messages without admin approval.",
    is_blocking: true,
    escalation_required: true,
  },
  {
    policy_key: "no_file_deletion_without_admin_approval",
    policy_name: "No File Deletion Without Admin Approval",
    description: "File deletion requires explicit admin approval and audit log entry.",
    is_blocking: true,
    escalation_required: true,
  },
  {
    policy_key: "no_financial_posting_without_approval",
    policy_name: "No Financial Posting Without Approval",
    description:
      "No financial transactions or accounting entries may be posted without human approval.",
    is_blocking: true,
    escalation_required: true,
  },
  {
    policy_key: "no_legal_or_medical_advice",
    policy_name: "No Legal or Medical Advice",
    description:
      "Agents may not provide legal, medical, or regulated professional advice.",
    is_blocking: true,
    escalation_required: true,
  },
  {
    policy_key: "escalate_low_confidence",
    policy_name: "Escalate on Low Confidence",
    description:
      "When agent confidence falls below threshold, draft output for human review.",
    is_blocking: false,
    escalation_required: true,
  },
  {
    policy_key: "escalate_angry_customer",
    policy_name: "Escalate Angry or Distressed Customer",
    description: "Detect negative sentiment and escalate to a human immediately.",
    is_blocking: true,
    escalation_required: true,
  },
  {
    policy_key: "escalate_legal_or_compliance_sensitive",
    policy_name: "Escalate Legal or Compliance-Sensitive Content",
    description:
      "Legal, regulatory, or compliance-sensitive topics must be escalated to a human.",
    is_blocking: true,
    escalation_required: true,
  },
  {
    policy_key: "pause_on_cost_threshold",
    policy_name: "Pause on Cost Threshold",
    description: "Execution pauses when estimated cost exceeds configured limit.",
    is_blocking: true,
    escalation_required: false,
  },
];

// Policies always applied to every blueprint
const UNIVERSAL_POLICIES = [
  "sandbox_required_before_production",
  "log_every_action",
  "pause_on_cost_threshold",
  "escalate_low_confidence",
];

/**
 * Return the list of policy guardrails that apply to this blueprint.
 * Deterministic — not LLM-driven.
 */
export function applyPolicies(
  req: Partial<RequirementExtraction>,
  agentCategory?: string
): PolicyGuardrail[] {
  const applicableKeys = new Set<string>(UNIVERSAL_POLICIES);

  // Customer-facing agents always need external send and escalation policies
  if (req.customer_facing) {
    applicableKeys.add("no_external_send_without_approval");
    applicableKeys.add("escalate_angry_customer");
  }

  // Financial sensitivity
  if (
    req.financial_sensitive ||
    agentCategory === "Finance & Accounting" ||
    agentCategory === "Operations & Procurement"
  ) {
    applicableKeys.add("no_financial_posting_without_approval");
  }

  // Legal / compliance sensitivity
  if (req.legal_sensitive || req.compliance_sensitive) {
    applicableKeys.add("no_legal_or_medical_advice");
    applicableKeys.add("escalate_legal_or_compliance_sensitive");
  }

  // Healthcare
  if (req.healthcare_sensitive) {
    applicableKeys.add("no_legal_or_medical_advice");
    applicableKeys.add("escalate_legal_or_compliance_sensitive");
  }

  // HR sensitivity
  if (req.hr_sensitive) {
    applicableKeys.add("escalate_legal_or_compliance_sensitive");
  }

  // Any workflow touching external communication
  const externalTools = (req.tools_mentioned ?? []).some((t) =>
    ["email", "gmail", "outlook", "slack", "sms", "twilio", "whatsapp"].some(
      (kw) => t.toLowerCase().includes(kw)
    )
  );
  if (externalTools || req.customer_facing) {
    applicableKeys.add("no_external_send_without_approval");
  }

  return ALL_POLICIES.filter((p) => applicableKeys.has(p.policy_key));
}

/**
 * Check if a proposed action is allowed under current policies.
 * Returns { allowed, blocking_policy } — caller decides what to do.
 */
export function checkAction(
  actionType: string,
  policies: PolicyGuardrail[]
): { allowed: boolean; blocking_policy?: PolicyGuardrail } {
  const ACTION_POLICY_MAP: Record<string, string> = {
    external_email_send: "no_external_send_without_approval",
    external_sms_send: "no_external_send_without_approval",
    file_delete: "no_file_deletion_without_admin_approval",
    file_bulk_delete: "no_file_deletion_without_admin_approval",
    financial_posting: "no_financial_posting_without_approval",
    legal_advice: "no_legal_or_medical_advice",
    medical_advice: "no_legal_or_medical_advice",
  };

  const policyKey = ACTION_POLICY_MAP[actionType];
  if (!policyKey) return { allowed: true };

  const blockingPolicy = policies.find(
    (p) => p.policy_key === policyKey && p.is_blocking
  );

  if (blockingPolicy) {
    return { allowed: false, blocking_policy: blockingPolicy };
  }

  return { allowed: true };
}
