// @ts-nocheck
import type { Metadata } from "next";
import { getApprovals } from "@/lib/services/admin.service";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { ApprovalActions } from "./approval-actions";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  let approvals: Array<Record<string, unknown>> = [];
  try {
    approvals = await getApprovals({ status: status ?? "pending" });
  } catch {
    approvals = [];
  }

  const filters = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div>
      <PageHeader title="Approvals" description={`${approvals.length} requests`} />
      <div className="mb-4 flex gap-2">
        {filters.map((f) => (
          <a
            key={f.value}
            href={`/admin/approvals?status=${f.value}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (status ?? "pending") === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>
      {approvals.length === 0 ? (
        <EmptyState message="No approval requests found." />
      ) : (
        <div className="space-y-3">
          {approvals.map((ap) => (
            <div key={String(ap.id)} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{String(ap.action_description ?? "")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: {String(ap.action_type ?? "")}
                  </p>
                  {ap.requested_by_email ? (
                    <p className="text-xs text-muted-foreground">
                      Requested by: {String(ap.requested_by_email)}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {new Date(String(ap.created_at)).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={String(ap.status ?? "")} />
                  {ap.status === "pending" && (
                    <ApprovalActions approvalId={String(ap.id)} />
                  )}
                </div>
              </div>
              {ap.review_notes ? (
                <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
                  Notes: {String(ap.review_notes)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
