/**
 * SETU — Agent Matcher
 *
 * Matches user requirements to the agent catalog using a deterministic
 * scoring algorithm. LLM is used only to assist with semantic similarity —
 * the actual selection is score-driven, not freeform LLM invention.
 *
 * Score components:
 * - Category match: 30 pts
 * - Pain point keyword match: 25 pts
 * - Tool match: 20 pts
 * - Readiness tier boost: 15 pts (Tier 1 > Tier 2 > Tier 3)
 * - Flagship boost: 10 pts
 * - Commercial priority boost: 5 pts
 */

import type { Agent } from "@/types/agent";
import type { RequirementExtraction } from "@/types/blueprint";
import type { AgentRecommendation, AlternativeAgent } from "@/types/blueprint";

// Category keyword maps — used for fuzzy category matching
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Revenue Operations & Sales": [
    "sales", "crm", "pipeline", "leads", "deals", "revenue", "forecast",
    "outbound", "quota", "proposals", "follow-up", "revops", "sdr", "ae",
  ],
  "Customer Support & CX": [
    "support", "tickets", "helpdesk", "zendesk", "intercom", "customer",
    "complaints", "refund", "escalation", "cx", "service desk", "freshdesk",
  ],
  "Finance & Accounting": [
    "finance", "accounting", "invoices", "payments", "reconciliation",
    "quickbooks", "xero", "netsuite", "billing", "ar", "ap", "close",
    "reconcile", "expense", "cash", "revenue recognition",
  ],
  "Operations & Procurement": [
    "operations", "ops", "procurement", "vendor", "supply chain", "contracts",
    "onboarding", "scheduling", "order", "inventory", "facilities",
  ],
  "Compliance, Risk & Legal Ops": [
    "compliance", "soc2", "audit", "risk", "legal", "gdpr", "privacy",
    "security questionnaire", "access review", "policy", "regulation",
  ],
  "Executive Intelligence & Reporting": [
    "executive", "ceo", "coo", "cfo", "reporting", "kpi", "dashboard",
    "board", "forecast", "briefing", "okr", "weekly digest",
  ],
  "HR & Internal Operations": [
    "hr", "people ops", "onboarding", "recruiting", "hiring", "employee",
    "offboarding", "performance review", "hris", "benefits",
  ],
  "IT & Security Operations": [
    "it", "security", "helpdesk", "access", "saas license", "incident",
    "servicedesk", "jira", "bug", "engineering",
  ],
  "Marketing & Growth": [
    "marketing", "campaign", "content", "seo", "ads", "social", "brand",
    "growth", "leads", "webinar", "email marketing",
  ],
  "Customer Success & Retention": [
    "customer success", "renewal", "churn", "expansion", "qbr", "nps",
    "health score", "retention", "onboarding risk",
  ],
};

const TIER_SCORE: Record<string, number> = {
  tier_1_pilot_ready: 15,
  tier_2_packaged_offer: 8,
  tier_3_catalog_offer: 3,
  internal_only: 0,
  experimental: 0,
};

const CONFIDENCE_SCORE: Record<string, number> = {
  very_high: 5,
  high: 3,
  medium: 1,
  low: 0,
};

const PRIORITY_SCORE: Record<string, number> = {
  A: 5,
  B: 3,
  C: 1,
};

export interface MatchResult {
  agent: Agent;
  score: number;
  matchReasons: string[];
}

/**
 * Score a single agent against extracted requirements.
 * Returns null if score is 0 (no relevant match at all).
 */
export function scoreAgent(
  agent: Agent,
  req: Partial<RequirementExtraction>
): MatchResult | null {
  let score = 0;
  const matchReasons: string[] = [];

  const textToMatch = [
    ...(req.pain_points ?? []),
    req.business_function ?? "",
    req.workflow_type ?? "",
    req.desired_outcome ?? "",
    ...(req.systems_involved ?? []),
    ...(req.tools_mentioned ?? []),
  ]
    .join(" ")
    .toLowerCase();

  // ── Category match (30 pts) ──────────────────────────────────
  const catKeywords = CATEGORY_KEYWORDS[agent.category] ?? [];
  const catHits = catKeywords.filter((kw) => textToMatch.includes(kw));
  if (catHits.length > 0) {
    const catScore = Math.min(30, catHits.length * 8);
    score += catScore;
    matchReasons.push(`Category match: ${agent.category}`);
  }

  // ── Pain point keyword match (25 pts) ───────────────────────
  const painText = agent.pain_problem.toLowerCase();
  const outcomeText = agent.business_outcome.toLowerCase();
  const capText = agent.core_capabilities.join(" ").toLowerCase();
  const agentText = `${painText} ${outcomeText} ${capText}`;

  let painHits = 0;
  for (const pain of req.pain_points ?? []) {
    const painWords = pain.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const hit = painWords.some((w) => agentText.includes(w));
    if (hit) painHits++;
  }
  if (painHits > 0) {
    const painScore = Math.min(25, painHits * 10);
    score += painScore;
    matchReasons.push(`Pain point alignment: ${painHits} matching signals`);
  }

  // ── Tool match (20 pts) ──────────────────────────────────────
  const userTools = (req.tools_mentioned ?? []).map((t) => t.toLowerCase());
  const agentTools = [
    ...agent.required_tools,
    ...agent.optional_tools,
  ].map((t) => t.toLowerCase());

  const toolHits = userTools.filter((ut) =>
    agentTools.some((at) => at.includes(ut) || ut.includes(at.split("/")[0]))
  );
  if (toolHits.length > 0) {
    const toolScore = Math.min(20, toolHits.length * 7);
    score += toolScore;
    matchReasons.push(`Tool overlap: ${toolHits.slice(0, 3).join(", ")}`);
  }

  // ── Readiness tier boost ─────────────────────────────────────
  const tierScore = TIER_SCORE[agent.readiness_tier] ?? 0;
  if (tierScore > 0) {
    score += tierScore;
    if (agent.readiness_tier === "tier_1_pilot_ready") {
      matchReasons.push("Tier 1 Pilot-Ready: fastest path to deployment");
    }
  }

  // ── Flagship boost ───────────────────────────────────────────
  if (agent.is_flagship) {
    score += 10;
    matchReasons.push("Flagship agent: proven demo and sales path");
  }

  // ── Commercial priority boost ────────────────────────────────
  if (agent.commercial_priority) {
    score += PRIORITY_SCORE[agent.commercial_priority] ?? 0;
  }

  // ── Confidence boost ─────────────────────────────────────────
  if (agent.sales_confidence) {
    score += CONFIDENCE_SCORE[agent.sales_confidence] ?? 0;
  }

  // ── Risk sensitivity penalty ─────────────────────────────────
  // If user flagged financial/legal sensitivity and agent is in finance,
  // boost it (correct match). If mismatch, no penalty (we don't know enough).
  if (req.financial_sensitive && agent.category === "Finance & Accounting") {
    score += 5;
  }
  if (req.compliance_sensitive && agent.category === "Compliance, Risk & Legal Ops") {
    score += 5;
  }

  // Require minimum meaningful score
  if (score < 10) return null;

  return { agent, score, matchReasons };
}

/**
 * Match requirements against the full catalog.
 * Returns top recommendation + alternatives.
 */
export function matchAgents(
  catalog: Agent[],
  req: Partial<RequirementExtraction>
): AgentRecommendation | null {
  const results: MatchResult[] = [];

  for (const agent of catalog) {
    if (!agent.is_public) continue;
    const match = scoreAgent(agent, req);
    if (match) results.push(match);
  }

  if (results.length === 0) return null;

  // Sort descending
  results.sort((a, b) => b.score - a.score);

  const top = results[0];
  const maxPossibleScore = 30 + 25 + 20 + 15 + 10 + 5 + 5 + 5; // 115
  const confidenceScore = Math.min(95, Math.round((top.score / maxPossibleScore) * 100));

  const alternatives: AlternativeAgent[] = results
    .slice(1, 4)
    .filter((r) => r.score >= top.score * 0.6) // only show close alternatives
    .map((r) => ({
      agent_id: r.agent.agent_id,
      agent_name: r.agent.name,
      confidence_score: Math.min(90, Math.round((r.score / maxPossibleScore) * 100)),
      why_alternative: r.matchReasons[0] ?? "Similar category match",
    }));

  return {
    agent_id: top.agent.agent_id,
    agent_name: top.agent.name,
    confidence_score: confidenceScore,
    match_reasons: top.matchReasons,
    alternatives,
  };
}

/**
 * Build a compact catalog summary string for injection into the system prompt.
 * Keeps token count manageable.
 */
export function buildCatalogSummary(agents: Agent[]): string {
  const byCategory: Record<string, string[]> = {};

  for (const agent of agents.filter((a) => a.is_public)) {
    if (!byCategory[agent.category]) byCategory[agent.category] = [];
    const tier =
      agent.readiness_tier === "tier_1_pilot_ready"
        ? "[T1]"
        : agent.readiness_tier === "tier_2_packaged_offer"
        ? "[T2]"
        : "[T3]";
    byCategory[agent.category].push(
      `${tier} ${agent.agent_id}: ${agent.name} — ${agent.pain_problem}`
    );
  }

  return Object.entries(byCategory)
    .map(([cat, items]) => `### ${cat}\n${items.join("\n")}`)
    .join("\n\n");
}
