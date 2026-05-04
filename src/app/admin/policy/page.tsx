// @ts-nocheck
import type { Metadata } from "next";
import { getKillSwitches } from "@/lib/services/admin.service";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { KillSwitchToggle } from "./kill-switch-toggle";

export const metadata: Metadata = { title: "Policy & Kill Switches" };

export default async function PolicyPage() {
  let switches: Array<Record<string, unknown>> = [];
  try { switches = await getKillSwitches(); } catch { switches = []; }

  return (
    <div>
      <PageHeader title="Policy & Kill Switches" description="Manage governance controls and kill switches." />
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm font-medium text-red-800">⚠️ Kill switches stop agent execution immediately at the specified level. Use with care.</p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Kill Switches</p>
        </div>
        {switches.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No kill switches configured.</div>
        ) : (
          <div className="divide-y divide-border">
            {switches.map((sw) => (
              <div key={sw.id as string} className="flex items-center justify-between px-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${sw.is_active ? "bg-red-500" : "bg-gray-300"}`} />
                    <p className="text-sm font-medium">{sw.target_label as string}</p>
                    <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">{sw.level as string}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground ml-4">{sw.reason as string}</p>
                  {sw.activated_by && <p className="text-xs text-muted-foreground ml-4">By: {sw.activated_by as string}</p>}
                </div>
                <KillSwitchToggle switchId={sw.id as string} isActive={sw.is_active as boolean} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

