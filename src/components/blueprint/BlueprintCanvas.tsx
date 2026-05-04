"use client";

import type { Blueprint } from "@/types/blueprint";
import type { ConversationStage } from "@/types/conversation";

interface BlueprintCanvasProps {
  blueprint: Partial<Blueprint> | null;
  stage: ConversationStage;
  blueprintId: string | null;
}

export function BlueprintCanvas({ blueprint, stage, blueprintId }: BlueprintCanvasProps) {
  const isEmpty = !blueprint || Object.keys(blueprint).length === 0;
  const hasRecommendation = !!blueprint?.recommendation;
  const hasRisk = !!blueprint?.risk_assessment;
  const hasCost = !!blueprint?.cost_estimate;
  const hasSandbox = !!blueprint?.sandbox_plan;
  const hasPolicies = (blueprint?.policy_guardrails?.length ?? 0) > 0;
  const hasTools = (blueprint?.tool_requirements?.length ?? 0) > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Agent Blueprint</p>
          <p className="text-xs text-muted-foreground">
            {blueprintId ? `ID: ${blueprintId.slice(0, 8)}…` : "Building your blueprint…"}
          </p>
        </div>
        <StatusBadge stage={stage} />
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {/* Input Summary */}
            {blueprint?.input_summary && (
              <Card title="Workflow Summary" icon="📝">
                <p className="text-sm text-foreground">{blueprint.input_summary}</p>
              </Card>
            )}

            {/* Agent Recommendation */}
            {hasRecommendation && blueprint?.recommendation && (
              <Card title="Recommended Agent" icon="🤖" accent="primary">
                <div className="space-y-2">
                  <p className="text-base font-semibold text-foreground">
                    {blueprint.recommendation.agent_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {blueprint.recommendation.agent_id}
                  </p>
                  <ConfidenceMeter score={blueprint.recommendation.confidence_score} />
                  <ul className="mt-2 space-y-1">
                    {blueprint.recommendation.match_reasons.slice(0, 3).map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        {r}
                      </li>
                    ))}
                  </ul>

                  {/* Alternatives */}
                  {(blueprint.recommendation.alternatives?.length ?? 0) > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Alternatives</p>
                      {blueprint.recommendation.alternatives?.map((alt) => (
                        <div key={alt.agent_id} className="flex items-center justify-between py-1">
                          <p className="text-xs text-foreground">{alt.agent_name}</p>
                          <span className="text-xs text-muted-foreground">{alt.confidence_score}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Risk Assessment */}
            {hasRisk && blueprint?.risk_assessment && (
              <Card title="Risk Assessment" icon="🛡️" accent={getRiskAccent(blueprint.risk_assessment.overall_risk)}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RiskBadge level={blueprint.risk_assessment.overall_risk} />
                    {blueprint.risk_assessment.human_review_required && (
                      <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                        Human review required
                      </span>
                    )}
                  </div>
                  {blueprint.risk_assessment.risk_factors.slice(0, 3).map((f, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {f}</p>
                  ))}
                </div>
              </Card>
            )}

            {/* Policy Guardrails */}
            {hasPolicies && (
              <Card title="Policy Guardrails" icon="📋">
                <div className="space-y-1.5">
                  {blueprint?.policy_guardrails?.slice(0, 5).map((p) => (
                    <div key={p.policy_key} className="flex items-start gap-2">
                      <span className={`mt-0.5 text-xs ${p.is_blocking ? "text-red-500" : "text-amber-500"}`}>
                        {p.is_blocking ? "⛔" : "⚠️"}
                      </span>
                      <p className="text-xs text-foreground">{p.policy_name}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Required Tools */}
            {hasTools && (
              <Card title="Tool Requirements" icon="🔧">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Required</p>
                    <div className="flex flex-wrap gap-1.5">
                      {blueprint?.tool_requirements
                        ?.filter((t) => t.is_required)
                        .map((t, i) => (
                          <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            {t.tool_name}
                          </span>
                        ))}
                    </div>
                  </div>
                  {blueprint?.tool_requirements?.some((t) => !t.is_required) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Optional</p>
                      <div className="flex flex-wrap gap-1.5">
                        {blueprint.tool_requirements
                          .filter((t) => !t.is_required)
                          .map((t, i) => (
                            <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {t.tool_name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Cost Estimate */}
            {hasCost && blueprint?.cost_estimate && (
              <Card title="Cost Estimate" icon="💰">
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-muted-foreground">Setup</p>
                    <p className="text-sm font-semibold text-foreground">
                      ${blueprint.cost_estimate.setup_range_low.toLocaleString()}–
                      ${blueprint.cost_estimate.setup_range_high.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="text-sm font-semibold text-foreground">
                      ${blueprint.cost_estimate.monthly_range_low.toLocaleString()}–
                      ${blueprint.cost_estimate.monthly_range_high.toLocaleString()}/mo
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {blueprint.cost_estimate.pricing_package}
                  </p>
                  {blueprint.cost_estimate.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {blueprint.cost_estimate.notes}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Sandbox Plan */}
            {hasSandbox && blueprint?.sandbox_plan && (
              <Card title="Sandbox Plan" icon="🧪">
                <div className="space-y-2">
                  <p className="text-xs text-foreground">{blueprint.sandbox_plan.sandbox_scope}</p>
                  <p className="text-xs text-muted-foreground">
                    Duration: {blueprint.sandbox_plan.estimated_duration_days} days
                  </p>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Success criteria</p>
                    {blueprint.sandbox_plan.success_criteria.slice(0, 3).map((c, i) => (
                      <p key={i} className="text-xs text-muted-foreground">✓ {c}</p>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Agent Passport */}
            {blueprint?.passport && (
              <Card title="Agent Passport" icon="🪪" accent="secondary">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">Mode:</span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary font-mono">
                      {blueprint.passport.default_mode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">Audit level:</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {blueprint.passport.audit_level}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Restricted actions ({blueprint.passport.restricted_actions.length})</p>
                    <p className="text-xs text-muted-foreground">
                      All high-risk actions blocked by default. Admin approval required.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-xs text-center">
        <div className="mb-4 grid grid-cols-3 gap-2 opacity-20">
          {["Agent Match", "Tools", "Risk", "Policies", "Cost", "Sandbox"].map((l) => (
            <div key={l} className="rounded-lg border border-border bg-card p-3">
              <div className="mb-1.5 h-1.5 w-10 rounded bg-muted" />
              <p className="text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <p className="text-sm font-medium text-foreground">Blueprint will appear here</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Cards populate as you describe your workflow in the chat.
        </p>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
  accent,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  accent?: "primary" | "secondary";
}) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${accent === "primary" ? "border-primary/20" : "border-border"}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ stage }: { stage: ConversationStage }) {
  const labels: Record<string, { label: string; class: string }> = {
    problem_discovery: { label: "Discovery", class: "status-pending" },
    agent_recommendation: { label: "Agent Matched", class: "status-pilot" },
    blueprint_generation: { label: "Blueprint Ready", class: "status-production" },
    conversion: { label: "Ready to Review", class: "status-production" },
  };
  const config = labels[stage] ?? { label: "Draft", class: "status-sandbox" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-foreground">{score}% match</span>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    low: "status-production",
    medium: "status-sandbox",
    high: "status-blocked",
    critical: "status-blocked",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[level] ?? "status-disabled"}`}>
      {level} risk
    </span>
  );
}

function getRiskAccent(level: string): "primary" | "secondary" | undefined {
  return level === "high" || level === "critical" ? undefined : undefined;
}
