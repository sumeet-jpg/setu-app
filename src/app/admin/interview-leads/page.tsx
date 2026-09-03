// @ts-nocheck
import type { Metadata } from "next";
import { getInterviewLeads } from "@/lib/services/admin.service";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export const metadata: Metadata = { title: "Interview Leads" };

// Read-only view of interview_leads (migration 013) — the soft email
// capture shown mid-interview. Distinct from /admin/leads, which reads the
// older Blueprint Builder "leads" table. These were captured with no admin
// visibility at all until this page; still no automated re-engagement
// sequence — that's a follow-up product decision, not something to fake
// here. The mailto link is the manual stopgap until one exists.
export default async function InterviewLeadsPage() {
  let leads: Array<Record<string, unknown>> = [];
  let loadError: string | null = null;
  try {
    leads = await getInterviewLeads();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load interview leads";
  }

  return (
    <div>
      <PageHeader
        title="Interview Leads"
        description={`${leads.length} email${leads.length === 1 ? "" : "s"} captured mid-interview, before any hire`}
      />
      {loadError ? (
        <EmptyState message={`Could not load interview leads: ${loadError}. If this just started happening, confirm migration 013_interview_leads.sql has been run against the live database.`} />
      ) : leads.length === 0 ? (
        <EmptyState message="No interview leads yet. These appear when a prospect gives their email mid-interview, before hiring." />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Email", "Employee", "Captured", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr key={String(lead.id)} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">{String(lead.email ?? "")}</td>
                  <td className="px-4 py-3">
                    <a href={`/employees/${String(lead.employee_slug ?? "")}`} className="text-xs font-medium text-primary hover:underline">
                      {String(lead.employee_slug ?? "")}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {lead.created_at ? new Date(String(lead.created_at)).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${String(lead.email ?? "")}?subject=${encodeURIComponent(`Following up on your ${String(lead.employee_slug ?? "")} interview`)}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Email →
                    </a>
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
