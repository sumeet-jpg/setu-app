// @ts-nocheck
import type { Metadata } from "next";
import { getInternalAgents, getInternalAgentRuns } from "@/lib/services/admin.service";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { InternalAgentRunner } from "./agent-runner";

export const metadata: Metadata = { title: "Internal Agents" };

export default async function InternalAgentsPage() {
  let agents: Array<Record<string, unknown>> = [];
  let runs: Array<Record<string, unknown>> = [];
  try { [agents, runs] = await Promise.all([getInternalAgents(), getInternalAgentRuns()]); } catch { agents = []; runs = []; }

  return (
    <div className="max-w-4xl">
      <PageHeader title="Internal Agents" description="Admin-triggered backend operations. All runs are logged." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        {agents.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-2">No internal agents found. Run seed 04.</p>
        ) : agents.map((agent) => (
          <div key={agent.id as string} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between mb-2">
              <div><p className="text-sm font-semibold">{agent.name as string}</p><p className="text-xs font-mono text-muted-foreground">{agent.agent_key as string}</p></div>
              <StatusBadge status={agent.mode as string} />
            </div>
            <p className="text-xs text-muted-foreground mb-4">{agent.purpose as string}</p>
            <InternalAgentRunner agentKey={agent.agent_key as string} agentName={agent.name as string} inputSchema={agent.input_schema as Record<string, string>} />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Runs</p></div>
        {runs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No runs yet.</div>
        ) : runs.map((run) => {
          const agent = run.internal_agents as Record<string, unknown> | null;
          return (
            <div key={run.id as string} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
              <div><p className="text-xs font-medium">{agent?.name as string ?? "Unknown"}</p><p className="text-xs text-muted-foreground">{new Date(run.created_at as string).toLocaleString()}</p></div>
              <StatusBadge status={run.status as string} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

