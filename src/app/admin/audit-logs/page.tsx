import type { Metadata } from "next";
import { getAuditLogs } from "@/lib/services/admin.service";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export const metadata: Metadata = { title: "Audit Logs" };

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; event_type?: string }>;
}) {
  const { severity, event_type } = await searchParams;
  let logs: Array<Record<string, unknown>> = [];
  try {
    logs = await getAuditLogs({ severity, event_type, limit: 100 });
  } catch {
    logs = [];
  }

  return (
    <div>
      <PageHeader title="Audit Logs" description={`${logs.length} entries (most recent 100)`} />
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Time", "Event", "Severity", "Description", "Entity"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No audit logs yet.
                </td>
              </tr>
            ) : logs.map((log) => (
              <tr key={String(log.id)} className="hover:bg-muted/30">
                <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(String(log.created_at)).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-xs font-mono">{String(log.event_type ?? "")}</td>
                <td className="px-4 py-2"><StatusBadge status={String(log.severity ?? "info")} /></td>
                <td className="px-4 py-2 max-w-sm"><p className="truncate text-xs">{String(log.description ?? "")}</p></td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {log.entity_type ? `${String(log.entity_type)}:${String(log.entity_id ?? "").slice(0, 8)}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
