// @ts-nocheck
import type { Metadata } from "next";
import { getAgents } from "@/lib/services/admin.service";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export const metadata: Metadata = { title: "Agent Catalog" };

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = await searchParams;
  let agents: Array<Record<string, unknown>> = [];
  try {
    agents = await getAgents({ tier });
  } catch {
    agents = [];
  }

  const filters = [
    { label: "All", value: "" },
    { label: "Tier 1 Pilot-Ready", value: "tier_1_pilot_ready" },
    { label: "Tier 2 Packaged", value: "tier_2_packaged_offer" },
    { label: "Tier 3 Catalog", value: "tier_3_catalog_offer" },
  ];

  return (
    <div>
      <PageHeader title="Agent Catalog" description={`${agents.length} agents`} />
      <div className="mb-4 flex gap-2 flex-wrap">
        {filters.map((f) => (
          <a
            key={f.value}
            href={f.value ? `/admin/agents?tier=${f.value}` : "/admin/agents"}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (tier ?? "") === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["ID", "Name", "Category", "Tier", "Mode", "Flagship", "Public"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No agents found. Run the seed scripts.
                </td>
              </tr>
            ) : agents.map((agent) => (
              <tr key={String(agent.id)} className="hover:bg-muted/30">
                <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{String(agent.agent_id ?? "")}</td>
                <td className="px-4 py-2"><p className="text-xs font-medium">{String(agent.name ?? "")}</p></td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{String(agent.category ?? "")}</td>
                <td className="px-4 py-2"><StatusBadge status={String(agent.readiness_tier ?? "")} /></td>
                <td className="px-4 py-2 text-xs font-mono">{String(agent.default_mode ?? "")}</td>
                <td className="px-4 py-2 text-xs">{agent.is_flagship ? "⭐" : "—"}</td>
                <td className="px-4 py-2 text-xs">{agent.is_public ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
