import type { Metadata } from "next";
import { getBlueprints } from "@/lib/services/admin.service";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export const metadata: Metadata = { title: "Blueprints" };

export default async function BlueprintsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  let blueprints: Array<Record<string, unknown>> = [];
  try { blueprints = await getBlueprints({ status }); } catch { blueprints = []; }

  const filters = [
    { label: "All", value: "" },
    { label: "Pending Review", value: "pending_review" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Draft", value: "draft" },
  ];

  return (
    <div>
      <PageHeader title="Blueprints" description={`${blueprints.length} blueprints`} />
      <div className="mb-4 flex gap-2 flex-wrap">
        {filters.map((f) => (
          <a key={f.value} href={f.value ? `/admin/blueprints?status=${f.value}` : "/admin/blueprints"}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${(status ?? "") === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"}`}>
            {f.label}
          </a>
        ))}
      </div>
      {blueprints.length === 0 ? (
        <EmptyState message="No blueprints found. They appear here after prospects use the Blueprint Builder." />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Summary", "Agent", "Risk", "Status", "Created", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blueprints.map((bp) => {
                const rec = bp.recommendation as Record<string, unknown> | null;
                const risk = bp.risk_assessment as Record<string, unknown> | null;
                return (
                  <tr key={bp.id as string} className="hover:bg-muted/30">
                    <td className="px-4 py-3 max-w-xs"><p className="truncate text-sm">{(bp.input_summary as string) || "—"}</p><p className="text-xs text-muted-foreground">v{bp.version as number}</p></td>
                    <td className="px-4 py-3">{rec ? <div><p className="text-xs font-medium">{rec.agent_name as string}</p><p className="text-xs text-muted-foreground">{rec.confidence_score as number}%</p></div> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3">{risk ? <StatusBadge status={String(risk.overall_risk)} /> : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={bp.status as string} /></td>
                    <td className="px-4 py-3"><p className="text-xs text-muted-foreground">{new Date(bp.created_at as string).toLocaleDateString()}</p></td>
                    <td className="px-4 py-3"><a href={`/admin/blueprints/${bp.id as string}`} className="text-xs font-medium text-primary hover:underline">Review →</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
