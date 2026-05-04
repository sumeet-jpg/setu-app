// @ts-nocheck
/**
 * SETU — Cost Estimator
 * Maps agent catalog pricing_band to structured ranges.
 */

import type { Agent } from "@/types/agent";
import type { CostEstimate } from "@/types/blueprint";
import type { RequirementExtraction } from "@/types/blueprint";

const PRICING_PACKAGES = {
  blueprint_only: "Instant Agent Blueprint (Free)",
  workflow_blueprint: "Workflow Blueprint ($1.5k–$10k)",
  pilot: "Approval-Based Pilot ($10k–$50k)",
  production: "Managed Production (Custom)",
};

/**
 * Parse pricing band like "Pilot $10k–$25k; Prod $25k–$75k setup; $5k–$20k/mo"
 * Correctly separates setup vs monthly ranges.
 */
function parsePricingBand(pricingBand: string): {
  setupLow: number;
  setupHigh: number;
  monthlyLow: number;
  monthlyHigh: number;
} {
  // Extract /mo numbers first (monthly)
  const monthlyMatch = pricingBand.match(/\$(\d+)k[–-]\$(\d+)k\/mo/i);
  const monthlyLow = monthlyMatch ? parseInt(monthlyMatch[1], 10) * 1000 : null;
  const monthlyHigh = monthlyMatch ? parseInt(monthlyMatch[2], 10) * 1000 : null;

  // Extract setup numbers (not /mo) — take first k–k range that isn't monthly
  const setupMatches = [...pricingBand.matchAll(/\$(\d+)k[–-]\$(\d+)k(?!\/mo)/gi)];
  const setupLow = setupMatches[0] ? parseInt(setupMatches[0][1], 10) * 1000 : 5000;
  const setupHigh = setupMatches[0] ? parseInt(setupMatches[0][2], 10) * 1000 : 25000;

  return {
    setupLow,
    setupHigh,
    monthlyLow: monthlyLow ?? Math.round(setupLow * 0.15),
    monthlyHigh: monthlyHigh ?? Math.round(setupHigh * 0.25),
  };
}

export function estimateCost(
  agent: Agent,
  req: Partial<RequirementExtraction>
): CostEstimate {
  if (agent.pricing_band) {
    const parsed = parsePricingBand(agent.pricing_band);

    const riskMultiplier =
      req.financial_sensitive || req.legal_sensitive || req.healthcare_sensitive || req.compliance_sensitive
        ? 1.2
        : 1.0;

    const pricingPackage =
      agent.readiness_tier === "tier_1_pilot_ready"
        ? PRICING_PACKAGES.pilot
        : PRICING_PACKAGES.workflow_blueprint;

    return {
      setup_range_low: Math.round((parsed.setupLow * riskMultiplier) / 1000) * 1000,
      setup_range_high: Math.round((parsed.setupHigh * riskMultiplier) / 1000) * 1000,
      monthly_range_low: Math.round((parsed.monthlyLow * riskMultiplier) / 500) * 500,
      monthly_range_high: Math.round((parsed.monthlyHigh * riskMultiplier) / 500) * 500,
      currency: "USD",
      complexity_driver: agent.complexity,
      pricing_package: pricingPackage,
      notes:
        "Indicative ranges only. Final pricing confirmed after Workflow Audit. Not a binding commitment.",
    };
  }

  return {
    setup_range_low: 5000,
    setup_range_high: 25000,
    monthly_range_low: 1500,
    monthly_range_high: 8000,
    currency: "USD",
    complexity_driver: agent.complexity ?? "growth",
    pricing_package: PRICING_PACKAGES.workflow_blueprint,
    notes: "Pricing confirmed after Workflow Audit.",
  };
}
