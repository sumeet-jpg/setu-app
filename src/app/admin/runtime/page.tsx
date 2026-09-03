// @ts-nocheck
import type { Metadata } from "next";
import { getRuntimeInstances, getExecuteEngineStats } from "@/lib/services/admin.service";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export const metadata: Metadata = { title: "Runtime" };

// This page used to describe only the old n8n/runtime_instances execution
// architecture and claim execution was fully "disabled" — true for THAT
// system, but misleading about the app as a whole. A different, real
// engine (/api/employees/[slug]/execute) already runs live: a Claude
// tool-use loop that decrypts real connected-tool credentials and makes
// real API calls, gated by request_approval rather than n8n. It doesn't
// check RUNTIME_EXECUTION_ENABLED or this page's kill switch at all.
export default async function RuntimePage() {
  let instances: Array<Record<string, unknown>> = [];
  try { instances = await getRuntimeInstances(); } catch { instances = []; }

  let stats: Awaited<ReturnType<typeof getExecuteEngineStats>> | null = null;
  try { stats = await getExecuteEngineStats(); } catch { stats = null; }

  return (
    <div>
      <PageHeader title="Runtime" description="Two separate execution systems live in this codebase — this page covers both." />

      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
        <p className="text-sm font-semibold text-emerald-800">Live: the AI-Employee execute engine</p>
        <p className="text-xs text-emerald-700 mt-0.5 mb-3">/api/employees/[slug]/execute — real Claude tool calls against real connected-tool credentials, gated by owner approval per action. Not affected by the n8n status below.</p>
        {stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Total tasks", stats.totalTasks],
              ["Awaiting approval", stats.tasksByStatus.awaiting_approval ?? 0],
              ["Pending approvals", stats.pendingApprovals],
              ["Connected tools (all customers)", stats.toolConnections],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg bg-white/60 border border-emerald-200 px-3 py-2">
                <p className="text-lg font-bold text-emerald-900">{value as number}</p>
                <p className="text-xs text-emerald-700">{label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-700">Stats unavailable — check employee_tasks/task_approvals/tool_connections tables exist.</p>
        )}
      </div>

      {stats && stats.recentTasks.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent tasks</p></div>
          {stats.recentTasks.map((t: any) => (
            <div key={t.id} className="px-4 py-3 border-b border-border last:border-0 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.employee_slug}</p>
              </div>
              <span className="text-xs bg-muted border border-border rounded-full px-2 py-0.5">{t.status}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
        <div className="h-3 w-3 rounded-full bg-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Separately disabled: the original n8n runtime_instances architecture</p>
          <p className="text-xs text-amber-700 mt-0.5">Current n8n plan: 14-day trial (no API). This was the FIRST execution design (see DEPLOYMENT.md) — superseded by the engine above, not a blocker for it.</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">What would be needed to activate the n8n path (if you still want it):</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Upgrade n8n to Enterprise plan at setuagents.app.n8n.cloud",
            "Enable n8n API access in workspace settings",
            "Set RUNTIME_EXECUTION_ENABLED=true in environment",
            "Remove global kill switch from kill_switches table",
            "Create a runtime_instances record with activation_status=active",
            "Configure dedicated n8n instance per customer (not shared)",
          ].map((item, i) => (
            <li key={i} className="flex gap-2"><span className="text-muted-foreground/50">{i + 1}.</span>{item}</li>
          ))}
        </ul>
      </div>
      {instances.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registered n8n Instances</p></div>
          {instances.map((inst) => (
            <div key={inst.id as string} className="px-4 py-3 border-b border-border last:border-0">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">{inst.provider as string}</p><p className="text-xs text-muted-foreground">{(inst.instance_url as string) || "No URL configured"}</p></div>
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">{inst.activation_status as string}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

