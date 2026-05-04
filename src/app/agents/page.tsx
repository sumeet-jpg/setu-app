import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agent Catalog | Setu",
  description: "100 governed AI operators for enterprise operations. Browse by function, complexity, and readiness tier.",
};

const CATEGORIES = [
  "All",
  "Revenue Operations & Sales",
  "Customer Support & CX",
  "Finance & Accounting",
  "Operations & Procurement",
  "Compliance, Risk & Legal Ops",
  "Executive Intelligence & Reporting",
  "HR & Internal Operations",
  "IT & Security Operations",
  "Marketing & Growth",
  "Customer Success & Retention",
];

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  tier_1_pilot_ready: { label: "Tier 1 · Pilot-Ready", color: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  tier_2_packaged_offer: { label: "Tier 2 · Packaged", color: "bg-blue-100 text-blue-700 border border-blue-200" },
  tier_3_catalog_offer: { label: "Tier 3 · Catalog", color: "bg-gray-100 text-gray-600 border border-gray-200" },
};

const COMPLEXITY_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

async function getPublicAgents(category?: string) {
  const db = createAdminClient();
  let query = db
    .from("agents")
    .select("id, agent_id, name, slug, category, pain_problem, business_outcome, complexity, readiness_tier, is_flagship, pricing_band, sales_confidence, required_tools, default_mode")
    .eq("is_public", true)
    .neq("status", "disabled")
    .order("readiness_tier", { ascending: true })
    .order("agent_id", { ascending: true });

  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  const { data } = await query;
  return data ?? [];
}

export default async function AgentCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const agents = await getPublicAgents(category);

  const tier1 = agents.filter((a) => a.readiness_tier === "tier_1_pilot_ready");
  const tier2 = agents.filter((a) => a.readiness_tier === "tier_2_packaged_offer");
  const tier3 = agents.filter((a) => a.readiness_tier === "tier_3_catalog_offer");

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-sm font-bold text-foreground">Setu</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/agents" className="text-sm text-foreground font-medium">Catalog</Link>
              <Link href="/blueprints/new"
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
                Build Blueprint
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            100 Governed AI Operators
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Every agent starts in sandbox mode. Blueprint → Sandbox → Pilot → Production.
            Approvals and audit logs built in from day one.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />{tier1.length} Pilot-Ready</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />{tier2.length} Packaged</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gray-400" />{tier3.length} Catalog</span>
          </div>
        </div>

        {/* Category filters */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={cat === "All" ? "/agents" : `/agents?category=${encodeURIComponent(cat)}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (category ?? "All") === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">Not sure which agent fits your workflow?</p>
            <p className="text-sm text-muted-foreground mt-0.5">Describe your problem and Setu builds a custom blueprint in minutes.</p>
          </div>
          <Link href="/blueprints/new"
            className="flex-shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
            Build My Blueprint →
          </Link>
        </div>

        {/* Agent grid — grouped by tier */}
        {tier1.length > 0 && (
          <AgentSection title="Tier 1 — Pilot-Ready" description="Clear demos, integration paths, and deployment plans. Fastest path to a live pilot." agents={tier1} />
        )}
        {tier2.length > 0 && (
          <AgentSection title="Tier 2 — Packaged Offers" description="Defined scope, buyer, and pricing. Ready for blueprint and implementation." agents={tier2} />
        )}
        {tier3.length > 0 && (
          <AgentSection title="Tier 3 — Catalog Offers" description="Full catalog for discovery. Available for custom blueprints on request." agents={tier3} />
        )}

        {agents.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">No agents found for this category.</div>
        )}
      </div>
    </div>
  );
}

function AgentSection({
  title,
  description,
  agents,
}: {
  title: string;
  description: string;
  agents: Array<Record<string, unknown>>;
}) {
  return (
    <div className="mb-12">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id as string} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: Record<string, unknown> }) {
  const tier = TIER_LABELS[agent.readiness_tier as string] ?? { label: "Catalog", color: "bg-gray-100 text-gray-600" };
  const tools = (agent.required_tools as string[]) ?? [];

  return (
    <Link href={`/agents/${agent.slug as string}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-mono text-muted-foreground">{agent.agent_id as string}</p>
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mt-0.5 leading-snug">
            {agent.name as string}
          </p>
        </div>
        {agent.is_flagship && <span className="text-base flex-shrink-0">⭐</span>}
      </div>

      <p className="text-xs text-muted-foreground flex-1 leading-relaxed mb-4">
        {agent.pain_problem as string}
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tier.color}`}>
            {tier.label}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {COMPLEXITY_LABELS[agent.complexity as string]}
          </span>
        </div>

        {tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tools.slice(0, 3).map((t, i) => (
              <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {t.split("/")[0].split(",")[0].trim()}
              </span>
            ))}
            {tools.length > 3 && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                +{tools.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
