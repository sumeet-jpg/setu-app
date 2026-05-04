/**
 * SETU — Agent Passport Generator
 *
 * Generates a structured Agent Passport from blueprint data.
 * The passport defines exactly what the agent can and cannot do.
 *
 * RULE: Default mode is always draft_only.
 * Restricted actions list is non-negotiable — never remove items.
 */

import type { AgentPassport } from "@/types/blueprint";
import type { Agent } from "@/types/agent";
import type { RiskAssessment } from "@/types/blueprint";

// Actions permanently restricted for ALL agents — never removable
const PERMANENTLY_RESTRICTED_ACTIONS = [
  "file.delete",
  "file.bulk_delete",
  "file.external_share",
  "file.permission_change",
  "email.external_send",
  "sms.external_send",
  "financial.post_transaction",
  "financial.process_refund",
  "legal.provide_advice",
  "medical.provide_advice",
  "access.provision",
  "access.deprovision",
  "contract.commit",
  "pricing.promise_discount",
];

// Actions that require approval before execution
const APPROVAL_REQUIRED_ACTIONS = [
  "crm.write_contact",
  "crm.update_deal",
  "email.draft_send_for_review",
  "calendar.create_event",
  "document.create",
  "document.update",
  "ticket.resolve",
  "ticket.escalate",
];

// Actions allowed in draft_only mode (read + draft, no execution)
const DRAFT_ONLY_PERMITTED = [
  "data.read",
  "crm.read",
  "email.read",
  "calendar.read",
  "document.read",
  "ticket.read",
  "knowledge.search",
  "llm.reason",
  "draft.create",
  "draft.update",
  "audit.write",
  "notification.internal_slack",
];

export function generatePassport(
  agent: Agent,
  riskAssessment: RiskAssessment,
  blueprintId?: string
): Omit<AgentPassport, "passport_id"> {
  const passportId = `PASS-${agent.agent_id}-${Date.now()}`;

  // Start with draft_only mode — agents earn autonomy
  const defaultMode = "draft_only" as const;

  // Permitted actions based on mode
  const permittedActions = [...DRAFT_ONLY_PERMITTED];

  // Add tool-specific read actions based on required tools
  for (const tool of agent.required_tools) {
    const toolKey = tool.toLowerCase().split("/")[0].replace(/\s+/g, "_");
    permittedActions.push(`${toolKey}.read`);
  }

  // Build tool permissions map
  const toolPermissions: Record<string, string[]> = {};
  for (const tool of agent.required_tools) {
    const toolKey = tool.toLowerCase().split("/")[0].replace(/\s+/g, "_");
    toolPermissions[toolKey] = ["read", "draft"];
  }
  for (const tool of agent.optional_tools) {
    const toolKey = tool.toLowerCase().split("/")[0].replace(/\s+/g, "_");
    toolPermissions[toolKey] = ["read"]; // optional = read-only until explicitly enabled
  }

  // Data access scope — conservative default
  const dataAccessScope = [
    "conversation_context",
    "public_catalog_data",
    "read_connected_tools",
  ];

  if (riskAssessment.overall_risk === "low") {
    dataAccessScope.push("write_internal_notes");
  }

  // Audit level based on risk
  const auditLevel: AgentPassport["audit_level"] =
    riskAssessment.overall_risk === "critical" ||
    riskAssessment.overall_risk === "high"
      ? "maximum"
      : riskAssessment.overall_risk === "medium"
      ? "elevated"
      : "standard";

  return {
    passport_id: passportId,
    agent_id: agent.agent_id,
    blueprint_id: blueprintId,
    default_mode: defaultMode,
    permitted_actions: [...new Set(permittedActions)],
    restricted_actions: PERMANENTLY_RESTRICTED_ACTIONS,
    approval_required_actions: APPROVAL_REQUIRED_ACTIONS,
    tool_permissions: toolPermissions,
    data_access_scope: dataAccessScope,
    audit_level: auditLevel,
    issued_at: new Date().toISOString(),
    version: 1,
  };
}
