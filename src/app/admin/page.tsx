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
    sub_trials: 0,
    sub_active: 0,
    sub_mrr: 0,
    hires_pending: 0,
    oldest_pending_hire_at: null as string | null,
    cron_health: [] as Array<{ job_name: string; status: string; ran_at: string | null }>,
  };

  try {
    stats = await getDashboardStats();
  } catch {
    // DB not ready yet — show zeros
  }

  const statCards = [
    { label: "Pending hire requests", value: stats.hires_pending, color: "text-amber-600", href: "/admin/hires?status=pending" },
    { label: "Blueprints pending review", value: stats.blueprints_pending, color: "text-purple-600", href: "/admin/blueprints?status=pending_review" },
    { label: "Open approvals", value: stats.approvals_pending, color: "text-amber-600", href: "/admin/approvals" },
    { label: "New leads", value: stats.leads_new, color: "text-blue-600", href: "/admin/leads" },
    { label: "Active kill switches", value: stats.kill_switches_active, color: "text-red-600", href: "/admin/policy" },
    { label: "Catalog agents", value: stats.agents_total, color: "text-emerald-600", href: "/admin/agents" },
  ];

  const oldestHireAgeHours = stats.oldest_pending_hire_at
    ? Math.round((Date.now() - new Date(stats.oldest_pending_hire_at).getTime()) / 3_600_000)
    : null;
  const staleHireAlert = oldestHireAgeHours !== null && oldestHireAgeHours >= 24;

  // Expected schedule per vercel.json: trials daily, decay weekly (Mondays).
  // Stale threshold is the expected interval plus a buffer.
  const CRON_STALE_HOURS: Record<string, number> = { trials: 30, decay: 192 };
  const now = Date.now();
  const staleCronJobs = stats.cron_health.filter(c => {
    if (c.status === 'never_run' || !c.ran_at) return true;
    if (c.status === 'failed') return true;
    const staleAfter = CRON_STALE_HOURS[c.job_name] ?? 30;
    return (now - new Date(c.ran_at).getTime()) / 3_600_000 > staleAfter;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Admin Console</h1>
        <p className="mt-1 text-sm text-muted-foreground">Setu AI Operations Control Plane</p>
      </div>

      {/* Subscription revenue strip */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Active subscriptions', value: stats.sub_active, color: 'text-emerald-600', href: '/admin/subscriptions?status=active' },
          { label: 'Trials in progress', value: stats.sub_trials, color: 'text-amber-600', href: '/admin/subscriptions?status=trial' },
          { label: 'MRR', value: `$${stats.sub_mrr.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, color: 'text-blue-600', href: '/admin/subscriptions' },
        ].map(s => (
          <a key={s.label} href={s.href} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </a>
        ))}
      </div>

      {/* Needs attention — only renders when something's actually stale, so it
          doesn't become noise the founder learns to ignore. */}
      {(staleHireAlert || staleCronJobs.length > 0) && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="mb-1 text-sm font-semibold text-red-800">Needs attention</p>
          <ul className="space-y-1 text-sm text-red-700">
            {staleHireAlert && (
              <li>
                <a href="/admin/hires?status=pending" className="underline underline-offset-2">
                  Oldest pending hire request is {oldestHireAgeHours}h old
                </a> — the 24h outreach SLA promised to prospects has been missed.
              </li>
            )}
            {staleCronJobs.map(c => (
              <li key={c.job_name}>
                <code className="rounded bg-red-100 px-1">{c.job_name}</code> cron{' '}
                {c.status === 'never_run' || !c.ran_at
                  ? 'has never recorded a successful run'
                  : c.status === 'failed'
                    ? `last run failed (${new Date(c.ran_at).toLocaleString()})`
                    : `hasn't run successfully since ${new Date(c.ran_at).toLocaleString()}`}
                — check Vercel cron logs and CRON_SECRET.
              </li>
            ))}
          </ul>
        </div>
      )}

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
