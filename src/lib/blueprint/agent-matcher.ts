// @ts-nocheck
import type { Agent } from "@/types/agent";
import type { RequirementExtraction, AgentRecommendation, AlternativeAgent } from "@/types/blueprint";

const TOOL_CATEGORY_MAP: Record<string, string> = {
  "zendesk": "Customer Support & CX",
  "intercom": "Customer Support & CX",
  "freshdesk": "Customer Support & CX",
  "helpdesk": "Customer Support & CX",
  "salesforce": "Revenue Operations & Sales",
  "sfdc": "Revenue Operations & Sales",
  "hubspot": "Revenue Operations & Sales",
  "pipedrive": "Revenue Operations & Sales",
  "outreach": "Revenue Operations & Sales",
  "quickbooks": "Finance & Accounting",
  "xero": "Finance & Accounting",
  "netsuite": "Finance & Accounting",
  "stripe": "Finance & Accounting",
  "bamboohr": "HR & Internal Operations",
  "workday": "HR & Internal Operations",
  "okta": "IT & Security Operations",
  "jira": "IT & Security Operations",
  "github": "IT & Security Operations",
};

const PAIN_CATEGORY_MAP: Record<string, string> = {
  "ticket": "Customer Support & CX",
  "tickets": "Customer Support & CX",
  "support": "Customer Support & CX",
  "response time": "Customer Support & CX",
  "refund": "Customer Support & CX",
  "deals": "Revenue Operations & Sales",
  "pipeline": "Revenue Operations & Sales",
  "leads": "Revenue Operations & Sales",
  "follow-up": "Revenue Operations & Sales",
  "follow up": "Revenue Operations & Sales",
  "crm": "Revenue Operations & Sales",
  "invoice": "Finance & Accounting",
  "invoices": "Finance & Accounting",
  "reconcili": "Finance & Accounting",
  "payment": "Finance & Accounting",
  "hiring": "HR & Internal Operations",
  "onboarding": "HR & Internal Operations",
  "employee": "HR & Internal Operations",
  "recruiting": "HR & Internal Operations",
  "compliance": "Compliance, Risk & Legal Ops",
  "soc2": "Compliance, Risk & Legal Ops",
  "audit": "Compliance, Risk & Legal Ops",
  "churn": "Customer Success & Retention",
  "renewal": "Customer Success & Retention",
  "nps": "Customer Success & Retention",
  "campaign": "Marketing & Growth",
  "marketing": "Marketing & Growth",
  "incident": "IT & Security Operations",
  "saas license": "IT & Security Operations",
};

const TIER_SCORE: Record<string, number> = {
  tier_1_pilot_ready: 15,
  tier_2_packaged_offer: 8,
  tier_3_catalog_offer: 3,
  internal_only: 0,
  experimental: 0,
};

export function scoreAgent(agent: Agent, req: Partial<RequirementExtraction>) {
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

  const userTools = (req.tools_mentioned ?? []).map(t => t.toLowerCase());
  const impliedCategories = new Set<string>();

  for (const tool of userTools) {
    for (const [keyword, category] of Object.entries(TOOL_CATEGORY_MAP)) {
      if (tool.includes(keyword)) impliedCategories.add(category);
    }
  }

  for (const [keyword, category] of Object.entries(PAIN_CATEGORY_MAP)) {
    if (textToMatch.includes(keyword)) impliedCategories.add(category);
  }

  if (impliedCategories.has(agent.category)) {
    score += 35;
    matchReasons.push(`Category match: ${agent.category}`);
  }

  const agentTools = [...agent.required_tools, ...agent.optional_tools].map(t => t.toLowerCase());
  const toolHits = userTools.filter(ut =>
    agentTools.some(at => {
      const parts = at.split(/[\/,\s]+/);
      return parts.some(p => p.length > 2 && (ut.includes(p) || p.includes(ut)));
    })
  );

  if (toolHits.length > 0) {
    score += Math.min(20, toolHits.length * 8);
    matchReasons.push(`Tool overlap: ${toolHits.slice(0, 3).join(", ")}`);
  }

  const agentText = [agent.pain_problem, agent.business_outcome, agent.core_capabilities.join(" "), agent.name].join(" ").toLowerCase();
  const stopwords = new Set(["that", "with", "this", "have", "they", "their", "from", "want", "need", "also", "just", "very", "more", "some", "into", "been", "will", "your", "team", "able", "when", "what", "how"]);
  const userWords = [...new Set(textToMatch.split(/\W+/).filter(w => w.length > 3 && !stopwords.has(w)))];
  const painHits = userWords.filter(w => agentText.includes(w));

  if (painHits.length > 0) {
    score += Math.min(25, painHits.length * 4);
    matchReasons.push(`Pain point alignment: ${painHits.length} signals`);
  }

  const tierScore = TIER_SCORE[agent.readiness_tier] ?? 0;
  if (tierScore > 0) {
    score += tierScore;
    if (agent.readiness_tier === "tier_1_pilot_ready") matchReasons.push("Tier 1 Pilot-Ready: fastest path to deployment");
  }

  if (agent.is_flagship) score += 5;
  if (score < 15) return null;
  return { agent, score, matchReasons };
}

export function matchAgents(catalog: Agent[], req: Partial<RequirementExtraction>): AgentRecommendation | null {
  const results = catalog
    .filter(a => a.is_public)
    .map(a => scoreAgent(a, req))
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score) as Array<{ agent: Agent; score: number; matchReasons: string[] }>;

  if (results.length === 0) return null;

  const top = results[0];
  const maxScore = 35 + 20 + 25 + 15 + 5;
  const confidenceScore = Math.min(92, Math.round((top.score / maxScore) * 100));

  const alternatives: AlternativeAgent[] = results
    .slice(1, 4)
    .filter(r => r.score >= top.score * 0.5)
    .map(r => ({
      agent_id: r.agent.agent_id,
      agent_name: r.agent.name,
      confidence_score: Math.min(88, Math.round((r.score / maxScore) * 100)),
      why_alternative: r.matchReasons[0] ?? "Similar category",
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
  for (const agent of agents.filter(a => a.is_public)) {
    if (!byCategory[agent.category]) byCategory[agent.category] = [];
    const tier = agent.readiness_tier === "tier_1_pilot_ready" ? "[T1]" : agent.readiness_tier === "tier_2_packaged_offer" ? "[T2]" : "[T3]";
    byCategory[agent.category].push(`${tier} ${agent.agent_id}: ${agent.name} — ${agent.pain_problem}`);
  }
  return Object.entries(byCategory).map(([cat, items]) => `### ${cat}\n${items.join("\n")}`).join("\n\n");
}