// @ts-nocheck
/**
 * SETU — Agent Matcher
 * Deterministic scoring against the agent catalog.
 */

import type { Agent } from "@/types/agent";
import type { RequirementExtraction, AgentRecommendation, AlternativeAgent } from "@/types/blueprint";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Revenue Operations & Sales": [
    "sales", "crm", "pipeline", "leads", "lead", "deals", "deal", "revenue",
    "forecast", "outbound", "quota", "proposals", "follow-up", "followup",
    "follow up", "revops", "sdr", "ae", "hubspot", "salesforce", "sfdc",
    "meetings", "meeting", "demo", "demos", "close", "closing", "prospect",
    "inbound", "outreach", "cold", "sequence", "cadence", "rep", "reps",
  ],
  "Customer Support & CX": [
    "support", "ticket", "tickets", "helpdesk", "zendesk", "intercom",
    "customer", "complaint", "refund", "escalation", "cx", "service desk",
    "freshdesk", "response time", "backlog", "sla", "resolution",
  ],
  "Finance & Accounting": [
    "finance", "accounting", "invoice", "invoices", "payment", "payments",
    "reconciliation", "quickbooks", "xero", "netsuite", "billing", "ar",
    "ap", "close", "reconcile", "expense", "cash", "revenue recognition",
    "stripe", "bank", "transaction",
  ],
  "Operations & Procurement": [
    "operations", "ops", "procurement", "vendor", "supply chain", "contract",
    "onboarding", "scheduling", "order", "inventory", "facilities", "process",
  ],
  "Compliance, Risk & Legal Ops": [
    "compliance", "soc2", "audit", "risk", "legal", "gdpr", "privacy",
    "security questionnaire", "access review", "policy", "regulation", "iso",
  ],
  "Executive Intelligence & Reporting": [
    "executive", "ceo", "coo", "cfo", "reporting", "kpi", "dashboard",
    "board", "forecast", "briefing", "okr", "weekly", "digest", "leadership",
  ],
  "HR & Internal Operations": [
    "hr", "people ops", "onboarding", "recruiting", "hiring", "employee",
    "offboarding", "performance review", "hris", "benefits", "payroll",
  ],
  "IT & Security Operations": [
    "it", "security", "helpdesk", "access", "saas license", "incident",
    "servicedesk", "jira", "bug", "engineering", "infrastructure",
  ],
  "Marketing & Growth": [
    "marketing", "campaign", "content", "seo", "ads", "social", "brand",
    "growth", "webinar", "email marketing", "demand gen", "leads",
  ],
  "Customer Success & Retention": [
    "customer success", "renewal", "churn", "expansion", "qbr", "nps",
    "health score", "retention", "onboarding risk", "csm",
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

export interface MatchResult {
  agent: Agent;
  score: number;
  matchReasons: string[];
}

export function scoreAgent(agent: Agent, req: Partial<RequirementExtraction>): MatchResult | null {
  let score = 0;
  const matchReasons: string[] = [];

  const textToMatch = [
    ...(req.pain_points ?? []),
    req.business_function ?? "",
    req.workflow_type ?? "",
    req.desired_outcome ?? "",
    ...(req.systems_involved ?? []),
    ...(req.tools_mentioned ?? []),
  ].join(" ").toLowerCase();

  // ── Category match (30 pts) ──────────────────────
  const catKeywords = CATEGORY_KEYWORDS[agent.category] ?? [];
  const catHits = catKeywords.filter((kw) => textToMatch.includes(kw));
  if (catHits.length > 0) {
    const catScore = Math.min(30, catHits.length * 6);
    score += catScore;
    matchReasons.push(`Category match: ${agent.category}`);
  }

  // ── Pain point match (30 pts) ────────────────────
  const agentText = [
    agent.pain_problem,
    agent.business_outcome,
    agent.core_capabilities.join(" "),
    agent.name,
  ].join(" ").toLowerCase();

  const userWords = textToMatch
    .split(/\W+/)
    .filter((w) => w.length > 3)
    .filter((w) => !["that", "with", "this", "have", "they", "their", "from", "want", "need", "also", "just", "very", "more", "some", "into", "been", "will", "your", "team", "able"].includes(w));

  const painHits = userWords.filter((w) => agentText.includes(w));
  const uniquePainHits = [...new Set(painHits)];

  if (uniquePainHits.length > 0) {
    const painScore = Math.min(30, uniquePainHits.length * 5);
    score += painScore;
    matchReasons.push(`Pain point alignment: ${uniquePainHits.length} matching signals`);
  }

  // ── Tool match (20 pts) ──────────────────────────
  const userTools = (req.tools_mentioned ?? []).map((t) => t.toLowerCase());
  const agentTools = [...agent.required_tools, ...agent.optional_tools].map((t) => t.toLowerCase());

  const toolHits = userTools.filter((ut) =>
    agentTools.some((at) => {
      const atParts = at.split(/[\/,\s]+/);
      return atParts.some((part) => part.length > 2 && (ut.includes(part) || part.includes(ut)));
    })
  );

  if (toolHits.length > 0) {
    const toolScore = Math.min(20, toolHits.length * 8);
    score += toolScore;
    matchReasons.push(`Tool overlap: ${toolHits.slice(0, 3).join(", ")}`);
  }

  // ── Readiness tier boost ─────────────────────────
  const tierScore = TIER_SCORE[agent.readiness_tier] ?? 0;
  if (tierScore > 0) {
    score += tierScore;
    if (agent.readiness_tier === "tier_1_pilot_ready") {
      matchReasons.push("Tier 1 Pilot-Ready: fastest path to deployment");
    }
  }

  // ── Flagship boost ───────────────────────────────
  if (agent.is_flagship) {
    score += 8;
    matchReasons.push("Flagship agent: proven demo and sales path");
  }

  // ── Sales confidence boost ───────────────────────
  score += CONFIDENCE_SCORE[agent.sales_confidence ?? ""] ?? 0;

  // ── Sensitivity boosts ───────────────────────────
  if (req.financial_sensitive && agent.category === "Finance & Accounting") score += 8;
  if (req.compliance_sensitive && agent.category === "Compliance, Risk & Legal Ops") score += 8;
  if (req.hr_sensitive && agent.category === "HR & Internal Operations") score += 8;

  if (score < 12) return null;

  return { agent, score, matchReasons };
}

export function matchAgents(catalog: Agent[], req: Partial<RequirementExtraction>): AgentRecommendation | null {
  const results: MatchResult[] = [];

  for (const agent of catalog) {
    if (!agent.is_public) continue;
    const match = scoreAgent(agent, req);
    if (match) results.push(match);
  }

  if (results.length === 0) return null;

  results.sort((a, b) => b.score - a.score);

  const top = results[0];
  const maxPossibleScore = 30 + 30 + 20 + 15 + 8 + 5 + 8;
  const confidenceScore = Math.min(95, Math.round((top.score / maxPossibleScore) * 100));

  const alternatives: AlternativeAgent[] = results
    .slice(1, 4)
    .filter((r) => r.score >= top.score * 0.55)
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

export function buildCatalogSummary(agents: Agent[]): string {
  const byCategory: Record<string, string[]> = {};

  for (const agent of agents.filter((a) => a.is_public)) {
    if (!byCategory[agent.category]) byCategory[agent.category] = [];
    const tier = agent.readiness_tier === "tier_1_pilot_ready" ? "[T1]"
      : agent.readiness_tier === "tier_2_packaged_offer" ? "[T2]" : "[T3]";
    byCategory[agent.category].push(
      `${tier} ${agent.agent_id}: ${agent.name} — ${agent.pain_problem}`
    );
  }

  return Object.entries(byCategory)
    .map(([cat, items]) => `### ${cat}\n${items.join("\n")}`)
    .join("\n\n");
}
