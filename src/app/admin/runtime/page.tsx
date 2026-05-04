import type { Metadata } from "next";
import { getRuntimeInstances } from "@/lib/services/admin.service";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export const metadata: Metadata = { title: "Runtime" };

export default async function RuntimePage() {
  let instances: Array<Record<string, unknown>> = [];
  try { instances = await getRuntimeInstances(); } catch { instances = []; }

  return (
    <div>
      <PageHeader title="Runtime Registry" description="Execution is disabled until enterprise runtime is activated." />
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
        <div className="h-3 w-3 rounded-full bg-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Runtime Execution Disabled</p>
          <p className="text-xs text-amber-700 mt-0.5">Current n8n plan: 14-day trial (no API). Upgrade to Enterprise plan to activate live agent execution.</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">What is needed to activate runtime:</h2>
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
          <div className="border-b border-border px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registered Instances</p></div>
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
