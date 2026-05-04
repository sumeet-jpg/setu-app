// @ts-nocheck
import type { Metadata } from "next";
import { getDashboardStats } from "@/lib/services/admin.service";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  let stats = {
    blueprints_pending: 0,
    leads_new: 0,
    approvals_pending: 0,
    kill_switches_active: 0,
    agents_total: 0,
    recent_audit_logs: [] as Array<{ id: string; event_type: string; severity: string; description: string; created_at: string }>,
  };

  try {
    stats = await getDashboardStats();
  } catch {
    // DB not ready yet — show zeros
  }

  const statCards = [
    { label: "Blueprints pending review", value: stats.blueprints_pending, color: "text-purple-600", href: "/admin/blueprints?status=pending_review" },
    { label: "Open approvals", value: stats.approvals_pending, color: "text-amber-600", href: "/admin/approvals" },
    { label: "New leads", value: stats.leads_new, color: "text-blue-600", href: "/admin/leads" },
    { label: "Active kill switches", value: stats.kill_switches_active, color: "text-red-600", href: "/admin/policy" },
    { label: "Catalog agents", value: stats.agents_total, color: "text-emerald-600", href: "/admin/agents" },
    { label: "Runtime status", value: "Disabled", color: "text-gray-500", href: "/admin/runtime" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Admin Console</h1>
        <p className="mt-1 text-sm text-muted-foreground">Setu AI Operations Control Plane</p>
      </div>

      {/* Runtime banner */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="h-2 w-2 rounded-full bg-amber-500" />
        <p className="text-sm font-medium text-amber-800">
          Runtime execution is disabled. Live agent deployment requires enterprise n8n activation.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <a key={stat.label} href={stat.href} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </a>
        ))}
      </div>

      {/* Recent audit logs */}
      {stats.recent_audit_logs.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {stats.recent_audit_logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{log.description}</p>
                  <p className="text-xs text-muted-foreground">{log.event_type}</p>
                </div>
                <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={log.severity} />
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-6 py-3">
            <a href="/admin/audit-logs" className="text-xs font-medium text-primary hover:underline">
              View all audit logs →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
