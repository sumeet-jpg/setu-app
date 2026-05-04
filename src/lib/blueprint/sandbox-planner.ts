// @ts-nocheck
/**
 * SETU — Sandbox Planner
 *
 * Generates a sandbox plan and rollout roadmap for a blueprint.
 * Deterministic — not LLM-driven.
 */

import type { SandboxPlan, RolloutPlan } from "@/types/blueprint";
import type { Agent } from "@/types/agent";
import type { RiskAssessment } from "@/types/blueprint";

export function generateSandboxPlan(
  agent: Agent,
  riskAssessment: RiskAssessment
): SandboxPlan {
  const isHighRisk =
    riskAssessment.overall_risk === "high" ||
    riskAssessment.overall_risk === "critical";

  const sandboxDuration = isHighRisk ? 14 : agent.complexity === "enterprise" ? 10 : 7;

  // Core scenarios every agent must validate
  const testScenarios = [
    "Happy path: process a standard case end-to-end with mock data",
    "Edge case: handle missing or malformed input gracefully",
    "Restricted action test: verify blocked actions are rejected with audit log",
    "Approval gate test: confirm draft outputs require human review before sending",
    "Escalation test: verify high-risk inputs trigger correct escalation path",
    "Kill switch test: confirm agent stops immediately when kill switch is activated",
    "Audit log test: verify all actions are logged with correct metadata",
  ];

  // Add risk-specific scenarios
  if (riskAssessment.overall_risk === "critical" || riskAssessment.overall_risk === "high") {
    testScenarios.push("Stress test: run 50 cases and verify no unauthorized actions occur");
    testScenarios.push("Rollback test: verify state can be restored after a failed run");
  }

  const successCriteria = [
    "Zero unauthorized external sends during sandbox period",
    "Zero file deletions without admin approval",
    "Zero financial postings without approval",
    "100% of restricted action attempts blocked and logged",
    "All escalation paths trigger correctly",
    "Audit log complete for every run",
    `Agent completes ${agent.complexity === "enterprise" ? "20" : "10"} standard cases without error`,
  ];

  const dataRequirements = [
    "Anonymized sample data matching production schema (no real customer PII)",
    "Test account credentials for required integrations",
    "Mock API responses for external systems (where available)",
  ];

  for (const tool of agent.required_tools.slice(0, 3)) {
    dataRequirements.push(`${tool}: read-only sandbox access`);
  }

  const approvalGates = [
    "Sandbox kickoff: admin sign-off on test plan before run starts",
    "Mid-sandbox review: check logs and refine if issues found",
    "Sandbox completion sign-off: admin reviews results before pilot approval",
  ];

  return {
    sandbox_scope: `${sandboxDuration}-day controlled sandbox using anonymized data against all required integrations.`,
    test_scenarios: testScenarios,
    success_criteria: successCriteria,
    estimated_duration_days: sandboxDuration,
    data_requirements: dataRequirements,
    approval_gates: approvalGates,
  };
}

export function generateRolloutPlan(
  agent: Agent,
  riskAssessment: RiskAssessment
): RolloutPlan {
  const pilotWeeks = riskAssessment.overall_risk === "critical" ? 8 : 4;

  return {
    phase_1_sandbox: `${
      riskAssessment.overall_risk === "high" || riskAssessment.overall_risk === "critical"
        ? "2-week"
        : "1-week"
    } sandbox with anonymized data. Admin reviews every run output. Zero live actions.`,

    phase_2_pilot: `${pilotWeeks}-week approval-based pilot on live data. All agent actions require admin approval before execution. Weekly review sessions with Setu. Confidence score tracked per run.`,

    phase_3_production: `Managed production after pilot sign-off. Agent operates with configured autonomy. High-risk actions remain approval-gated. Monthly health reviews. Kill switch always available.`,

    success_metrics: [
      "Sandbox: all test scenarios pass, zero policy violations",
      "Pilot: ≥80% of approved actions complete successfully",
      `Pilot: agent handles ≥${agent.complexity === "enterprise" ? "100" : "50"} real cases`,
      "Production: <2% error rate sustained over 30 days",
      "Production: measurable improvement in targeted KPI within 60 days",
    ],

    rollback_plan:
      "Kill switch disables agent immediately at any stage. All agent-created drafts are clearly marked. Admin can revert any approved action that caused unintended side effects within 24 hours of execution.",
  };
}
