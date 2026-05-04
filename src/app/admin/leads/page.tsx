import type { Metadata } from "next";
import { getLeads } from "@/lib/services/admin.service";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  let leads: Array<Record<string, unknown>> = [];
  try {
    leads = await getLeads({ status });
  } catch {
    leads = [];
  }

  const filters = [
    { label: "All", value: "" },
    { label: "New", value: "new" },
    { label: "Qualified", value: "qualified" },
    { label: "Converted", value: "converted" },
  ];

  return (
    <div>
      <PageHeader title="Leads" description={`${leads.length} leads`} />
      <div className="mb-4 flex gap-2 flex-wrap">
        {filters.map((f) => (
          <a
            key={f.value}
            href={f.value ? `/admin/leads?status=${f.value}` : "/admin/leads"}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (status ?? "") === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>
      {leads.length === 0 ? (
        <EmptyState message="No leads yet. They appear here after prospects submit their contact info in the Blueprint Builder." />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Email", "Company", "Role", "Status", "Source", "Created", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr key={String(lead.id)} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{String(lead.email ?? "")}</p>
                    {lead.name ? <p className="text-xs text-muted-foreground">{String(lead.name)}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-sm">{lead.company ? String(lead.company) : "—"}</td>
                  <td className="px-4 py-3 text-sm">{lead.role ? String(lead.role) : "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={String(lead.status ?? "")} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{String(lead.source ?? "")}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(String(lead.created_at)).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {lead.blueprint_id ? (
                      <a href={`/admin/blueprints/${String(lead.blueprint_id)}`} className="text-xs font-medium text-primary hover:underline">
                        Blueprint →
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
