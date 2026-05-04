import type { Metadata } from "next";
import { getSupportTickets } from "@/lib/services/admin.service";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export const metadata: Metadata = { title: "Support" };

export default async function SupportPage() {
  let tickets: Array<Record<string, unknown>> = [];
  try { tickets = await getSupportTickets(); } catch { tickets = []; }

  return (
    <div>
      <PageHeader title="Support Tickets" description={`${tickets.length} tickets`} />
      {tickets.length === 0 ? (
        <EmptyState message="No support tickets yet." />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id as string} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{ticket.subject as string}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ticket.category as string}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ticket.priority as string} />
                  <StatusBadge status={ticket.status as string} />
                </div>
              </div>
              {ticket.escalation_required && (
                <p className="mt-2 text-xs text-red-600">⚠️ Escalation required: {ticket.escalation_reason as string}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{new Date(ticket.created_at as string).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
