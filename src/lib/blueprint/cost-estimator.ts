// @ts-nocheck
/**
 * SETU — Cost Estimator
 *
 * Maps agent metadata to pricing bands.
 * Uses the catalog pricing_band field as source of truth.
 * Does NOT make pricing promises — all estimates are ranges.
 */

import type { Agent } from "@/types/agent";
import type { CostEstimate } from "@/types/blueprint";
import type { RequirementExtraction } from "@/types/blueprint";

// Pricing packages
const PRICING_PACKAGES = {
  blueprint_only: "Instant Agent Blueprint (Free)",
  workflow_blueprint: "Workflow Blueprint ($1.5k–$10k)",
  pilot: "Approval-Based Pilot ($10k–$50k)",
  production: "Managed Production (Custom)",
};

/**
 * Parse a pricing band string like "Pilot $10k–$25k; Prod $25k–$75k setup; $5k–$20k/mo"
 * into structured numbers.
 */
function parsePricingBand(pricingBand: string): {
  setupLow: number;
  setupHigh: number;
  monthlyLow: number;
  monthlyHigh: number;
} {
  // Extract numbers in k (thousands)
  const kNumbers = [...pricingBand.matchAll(/\$(\d+)k/gi)].map((m) =>
    parseInt(m[1], 10) * 1000
  );

  if (kNumbers.length >= 2) {
    // First two numbers = setup range, next two = monthly range (if present)
    return {
      setupLow: kNumbers[0],
      setupHigh: kNumbers[1],
      monthlyLow: kNumbers[2] ?? Math.round(kNumbers[0] * 0.1),
      monthlyHigh: kNumbers[3] ?? Math.round(kNumbers[1] * 0.2),
    };
  }

  // Fallback defaults
  return { setupLow: 5000, setupHigh: 20000, monthlyLow: 1000, monthlyHigh: 5000 };
}

export function estimateCost(
  agent: Agent,
  req: Partial<RequirementExtraction>
): CostEstimate {
  // Use the catalog pricing_band as the primary source
  if (agent.pricing_band) {
    const parsed = parsePricingBand(agent.pricing_band);

    // Bump ranges for high-risk or enterprise complexity
    const complexityMultiplier =
      agent.complexity === "enterprise"
        ? 1.0
        : agent.complexity === "growth"
        ? 0.85
        : 0.6;

    const riskMultiplier =
      req.financial_sensitive ||
      req.legal_sensitive ||
      req.healthcare_sensitive ||
      req.compliance_sensitive
        ? 1.3
        : 1.0;

    const multiplier = complexityMultiplier * riskMultiplier;

    const pricingPackage =
      agent.readiness_tier === "tier_1_pilot_ready"
        ? PRICING_PACKAGES.pilot
        : PRICING_PACKAGES.workflow_blueprint;

    return {
      setup_range_low: Math.round((parsed.setupLow * multiplier) / 1000) * 1000,
      setup_range_high: Math.round((parsed.setupHigh * multiplier) / 1000) * 1000,
      monthly_range_low: Math.round((parsed.monthlyLow * multiplier) / 500) * 500,
      monthly_range_high: Math.round((parsed.monthlyHigh * multiplier) / 500) * 500,
      currency: "USD",
      complexity_driver: agent.complexity,
      pricing_package: pricingPackage,
      notes:
        "These are indicative ranges. Final pricing is determined after a Workflow Audit call. Setu does not make binding pricing commitments in this blueprint.",
    };
  }

  // Generic fallback
  return {
    setup_range_low: 5000,
    setup_range_high: 25000,
    monthly_range_low: 1500,
    monthly_range_high: 8000,
    currency: "USD",
    complexity_driver: agent.complexity ?? "growth",
    pricing_package: PRICING_PACKAGES.workflow_blueprint,
    notes:
      "Pricing will be confirmed after a Workflow Audit. These are indicative ranges only.",
  };
}
