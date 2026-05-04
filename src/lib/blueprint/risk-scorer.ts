// @ts-nocheck
/**
 * SETU — Risk Scorer
 *
 * Deterministic risk assessment based on workflow characteristics.
 * LLM is NOT used for risk scoring — this is rule-based.
 */

import type { RequirementExtraction, RiskAssessment } from "@/types/blueprint";
import type { Agent } from "@/types/agent";

const RESTRICTED_ACTIONS_ALWAYS = [
  "File deletion or bulk file deletion",
  "External file sharing without approval",
  "External email or SMS sending without approval",
  "Financial posting or payment processing",
  "Access provisioning or deprovisioning",
];

export function assessRisk(
  req: Partial<RequirementExtraction>,
  agent?: Agent
): RiskAssessment {
  const riskFactors: string[] = [];
  const mitigationNotes: string[] = [];
  const restrictedActionsDetected: string[] = [];

  let riskScore = 0;

  // ── Sensitivity flags ────────────────────────────────────────
  if (req.financial_sensitive) {
    riskScore += 30;
    riskFactors.push("Financial workflow — payment, billing, or accounting data involved");
    mitigationNotes.push("All financial postings require explicit admin approval");
    restrictedActionsDetected.push("Financial posting");
  }

  if (req.legal_sensitive) {
    riskScore += 25;
    riskFactors.push("Legal sensitivity detected — contracts, liability, or regulated advice");
    mitigationNotes.push("Agent will not provide legal advice; all legal documents require human review");
  }

  if (req.compliance_sensitive) {
    riskScore += 20;
    riskFactors.push("Compliance workflow — regulatory or audit requirements apply");
    mitigationNotes.push("All compliance outputs require human review before use as evidence");
  }

  if (req.healthcare_sensitive) {
    riskScore += 35;
    riskFactors.push("Healthcare data or advice — HIPAA-adjacent risk");
    mitigationNotes.push("Agent will not provide medical advice; all health-related outputs require human review");
  }

  if (req.hr_sensitive) {
    riskScore += 20;
    riskFactors.push("HR-sensitive workflow — employee data or personnel decisions involved");
    mitigationNotes.push("HR decisions require human approval; agent operates in draft mode only");
  }

  if (req.security_sensitive) {
    riskScore += 25;
    riskFactors.push("Security-sensitive workflow — credentials, access, or audit data involved");
    mitigationNotes.push("Credentials are never stored in agent context; access changes require admin approval");
  }

  // ── Customer-facing risk ─────────────────────────────────────
  if (req.customer_facing) {
    riskScore += 15;
    riskFactors.push("Customer-facing actions — brand and CX risk if agent makes errors");
    mitigationNotes.push("Agent starts in draft mode; all external customer messages require approval");
  }

  // ── External communication ────────────────────────────────────
  const hasExternalComms = (req.tools_mentioned ?? []).some((t) =>
    ["email", "sms", "twilio", "whatsapp", "slack"].some((k) =>
      t.toLowerCase().includes(k)
    )
  );
  if (hasExternalComms) {
    riskScore += 10;
    riskFactors.push("External communications in scope — approval required for sends");
    restrictedActionsDetected.push("External email/SMS sending");
  }

  // ── Volume risk ───────────────────────────────────────────────
  if (req.volume_estimate) {
    const volLower = req.volume_estimate.toLowerCase();
    if (
      volLower.includes("thousand") ||
      volLower.includes("10k") ||
      volLower.includes("bulk") ||
      volLower.includes("mass")
    ) {
      riskScore += 15;
      riskFactors.push("High-volume operations — errors can scale quickly");
      mitigationNotes.push("Rate limits and cost caps will be configured before production");
    }
  }

  // ── Agent complexity ──────────────────────────────────────────
  if (agent?.complexity === "enterprise") {
    riskScore += 5;
    riskFactors.push("Enterprise complexity — integration depth increases failure surface");
    mitigationNotes.push("Extended sandbox period recommended for enterprise agents");
  }

  // Always applicable mitigations
  mitigationNotes.push("Sandbox validation required before any production deployment");
  mitigationNotes.push("Full audit log maintained for all agent actions");
  mitigationNotes.push("Kill switch available at global, tenant, and agent levels");

  // ── Risk level thresholds ─────────────────────────────────────
  let overallRisk: RiskAssessment["overall_risk"];
  if (riskScore >= 50) overallRisk = "critical";
  else if (riskScore >= 30) overallRisk = "high";
  else if (riskScore >= 15) overallRisk = "medium";
  else overallRisk = "low";

  const humanReviewRequired =
    overallRisk === "critical" ||
    overallRisk === "high" ||
    req.financial_sensitive ||
    req.legal_sensitive ||
    req.healthcare_sensitive ||
    false;

  return {
    overall_risk: overallRisk,
    risk_factors: riskFactors.length > 0 ? riskFactors : ["Standard operational workflow"],
    mitigation_notes: mitigationNotes,
    human_review_required: humanReviewRequired ?? false,
    restricted_actions_detected: [
      ...RESTRICTED_ACTIONS_ALWAYS,
      ...restrictedActionsDetected,
    ].filter((v, i, a) => a.indexOf(v) === i), // dedupe
  };
}
