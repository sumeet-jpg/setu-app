// @ts-nocheck
import type { Metadata } from "next";
import { getBlueprintDetail } from "@/lib/services/admin.service";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { BlueprintReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Blueprint Detail" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

export default async function BlueprintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bp = await getBlueprintDetail(id);

  if (!bp) {
    return <div className="text-sm text-muted-foreground">Blueprint not found.</div>;
  }

  const bpData = bp as Record<string, unknown>;
  const rec = bpData.recommendation as Record<string, unknown> | null;
  const risk = bpData.risk_assessment as Record<string, unknown> | null;
  const cost = bpData.cost_estimate as Record<string, unknown> | null;
  const policies = (bpData.policy_guardrails as Array<Record<string, unknown>>) ?? [];
  const tools = (bpData.tool_requirements as Array<Record<string, unknown>>) ?? [];
  const passport = bpData.passport as Record<string, unknown> | null;
  const sandbox = bpData.sandbox_plan as Record<string, unknown> | null;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Blueprint Review"
        description={`ID: ${id.slice(0, 8)}… · v${String(bpData.version ?? 1)}`}
        action={<StatusBadge status={String(bpData.status ?? "")} />}
      />
      <a href="/admin/blueprints" className="mb-6 inline-flex text-xs text-primary hover:underline">
        ← Back to blueprints
      </a>
      <div className="mt-4 space-y-4">
        <Section title="Workflow Summary">
          <p className="text-sm">{String(bpData.input_summary ?? "No summary captured.")}</p>
        </Section>

        {rec && (
          <Section title="Recommended Agent">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{String(rec.agent_name ?? "")}</p>
                <p className="text-xs text-muted-foreground">{String(rec.agent_id ?? "")}</p>
              </div>
              <span className="text-lg font-bold text-primary">{String(rec.confidence_score ?? "")}%</span>
            </div>
            {(rec.match_reasons as string[] | null)?.map((r, i) => (
              <p key={i} className="text-xs text-muted-foreground mt-1">✓ {r}</p>
            ))}
          </Section>
        )}

        {risk && (
          <Section title="Risk Assessment">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={String(risk.overall_risk ?? "")} />
              {risk.human_review_required ? (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                  Human review required
                </span>
              ) : null}
            </div>
            {(risk.risk_factors as string[] | null)?.map((f, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {f}</p>
            ))}
          </Section>
        )}

        {cost && (
          <Section title="Cost Estimate">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Setup</p>
                <p className="font-semibold">
                  ${Number(cost.setup_range_low ?? 0).toLocaleString()}–
                  ${Number(cost.setup_range_high ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly</p>
                <p className="font-semibold">
                  ${Number(cost.monthly_range_low ?? 0).toLocaleString()}–
                  ${Number(cost.monthly_range_high ?? 0).toLocaleString()}/mo
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{String(cost.pricing_package ?? "")}</p>
          </Section>
        )}

        {tools.length > 0 && (
          <Section title="Tool Requirements">
            <div className="flex flex-wrap gap-1.5">
              {tools.filter(t => t.is_required).map((t, i) => (
                <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {String(t.tool_name ?? "")}
                </span>
              ))}
              {tools.filter(t => !t.is_required).map((t, i) => (
                <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {String(t.tool_name ?? "")}
                </span>
              ))}
            </div>
          </Section>
        )}

        {policies.length > 0 && (
          <Section title="Policy Guardrails">
            {policies.map((p, i) => (
              <div key={i} className="flex gap-2 py-1">
                <span className="text-xs">{p.is_blocking ? "⛔" : "⚠️"}</span>
                <div>
                  <p className="text-xs font-medium">{String(p.policy_name ?? "")}</p>
                  <p className="text-xs text-muted-foreground">{String(p.description ?? "")}</p>
                </div>
              </div>
            ))}
          </Section>
        )}

        {passport && (
          <Section title="Agent Passport">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Mode</p>
                <p className="font-mono font-medium">{String(passport.default_mode ?? "")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Audit level</p>
                <p className="capitalize font-medium">{String(passport.audit_level ?? "")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Restricted actions</p>
                <p className="font-medium">
                  {(passport.restricted_actions as string[] | null)?.length ?? 0} blocked
                </p>
              </div>
            </div>
          </Section>
        )}

        {sandbox && (
          <Section title="Sandbox Plan">
            <p className="text-sm mb-1">{String(sandbox.sandbox_scope ?? "")}</p>
            <p className="text-xs text-muted-foreground">
              Duration: {String(sandbox.estimated_duration_days ?? "")} days
            </p>
          </Section>
        )}

        {bpData.admin_notes ? (
          <Section title="Admin Notes">
            <p className="text-sm">{String(bpData.admin_notes)}</p>
            {bpData.admin_reviewed_at ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Reviewed: {new Date(String(bpData.admin_reviewed_at)).toLocaleString()}
              </p>
            ) : null}
          </Section>
        ) : null}

        {(bpData.status === "draft" || bpData.status === "pending_review") && (
          <Section title="Admin Review">
            <BlueprintReviewForm blueprintId={id} />
          </Section>
        )}
      </div>
    </div>
  );
}
