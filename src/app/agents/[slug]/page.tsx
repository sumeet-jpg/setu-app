// @ts-nocheck
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

const TIER_LABELS: Record<string, string> = {
  tier_1_pilot_ready: "Tier 1 · Pilot-Ready",
  tier_2_packaged_offer: "Tier 2 · Packaged Offer",
  tier_3_catalog_offer: "Tier 3 · Catalog Offer",
};

const MODE_LABELS: Record<string, { label: string; description: string }> = {
  draft_only: { label: "Draft Only", description: "Agent prepares outputs for human review. No autonomous actions." },
  approval_required: { label: "Approval Required", description: "All significant actions require admin approval before execution." },
  guarded_autonomy: { label: "Guarded Autonomy", description: "Low-risk actions run automatically. High-risk actions require approval." },
};

async function getAgent(slug: string) {
  const db = createAdminClient();
  const { data } = await db
    .from("agents")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) return { title: "Agent Not Found | Setu" };
  return {
    title: `${agent.name} | Setu`,
    description: agent.pain_problem,
  };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) notFound();

  const tier = TIER_LABELS[agent.readiness_tier] ?? "Catalog";
  const mode = MODE_LABELS[agent.default_mode] ?? { label: agent.default_mode, description: "" };
  const requiredTools = (agent.required_tools as string[]) ?? [];
  const optionalTools = (agent.optional_tools as string[]) ?? [];
  const capabilities = (agent.core_capabilities as string[]) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <span className="text-xs font-bold text-primary-foreground">S</span>
                </div>
                <span className="text-sm font-bold text-foreground">Setu</span>
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/agents" className="text-sm text-muted-foreground hover:text-foreground">Catalog</Link>
            </div>
            <Link href="/blueprints/new"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
              Build Blueprint
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-muted-foreground">{agent.agent_id}</span>
                {agent.is_flagship && <span className="text-sm">⭐ Flagship</span>}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{agent.category}</p>
            </div>

            {/* Problem / Outcome */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">The Problem</p>
                <p className="text-sm text-foreground">{agent.pain_problem}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Business Outcome</p>
                <p className="text-sm text-foreground">{agent.business_outcome}</p>
              </div>
            </div>

            {/* Capabilities */}
            {capabilities.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Core Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {capabilities.map((cap, i) => (
                    <span key={i} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tools */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Tool Requirements</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">Required</p>
                  <div className="flex flex-wrap gap-1.5">
                    {requiredTools.map((t, i) => (
                      <span key={i} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">{t}</span>
                    ))}
                  </div>
                </div>
                {optionalTools.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Optional</p>
                    <div className="flex flex-wrap gap-1.5">
                      {optionalTools.map((t, i) => (
                        <span key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Governance */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Governance</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs text-primary">🛡</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{mode.label}</p>
                    <p className="text-xs text-muted-foreground">{mode.description}</p>
                  </div>
                </div>
                {[
                  "Sandbox validation required before production",
                  "Full audit log for every action",
                  "Kill switch available at any time",
                  "No file deletion or external sends without approval",
                ].map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-emerald-600">✓</span>{rule}
                  </div>
                ))}
              </div>
            </div>

            {/* ICP */}
            {(agent.primary_buyer || agent.best_icp) && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Best Fit</p>
                {agent.primary_buyer && <p className="text-sm text-foreground"><span className="text-muted-foreground">Buyer: </span>{agent.primary_buyer as string}</p>}
                {agent.best_icp && <p className="text-sm text-foreground mt-1"><span className="text-muted-foreground">ICP: </span>{agent.best_icp as string}</p>}
              </div>
            )}
          </div>

          {/* Right — sidebar */}
          <div className="space-y-4">
            {/* CTA card */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <p className="text-sm font-semibold text-foreground mb-1">Get a Blueprint for this Agent</p>
              <p className="text-xs text-muted-foreground mb-4">
                Describe your workflow and Setu will build a custom blueprint with tools, policies, and a sandbox plan.
              </p>
              <Link href={`/blueprints/new?agent=${agent.agent_id}`}
                className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
                Build My Blueprint
              </Link>
              <p className="mt-2 text-center text-xs text-muted-foreground">Free · No account required</p>
            </div>

            {/* Specs */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Specs</p>
              <SpecRow label="Tier" value={tier} />
              <SpecRow label="Complexity" value={agent.complexity as string} capitalize />
              <SpecRow label="Default Mode" value={mode.label} />
              {agent.sales_confidence && <SpecRow label="Sales Confidence" value={agent.sales_confidence as string} capitalize />}
            </div>

            {/* Pricing */}
            {agent.pricing_band && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Indicative Pricing</p>
                <p className="text-xs text-foreground">{agent.pricing_band as string}</p>
                <p className="mt-2 text-xs text-muted-foreground">Final pricing confirmed after Workflow Audit. Not a commitment.</p>
              </div>
            )}

            {/* Lifecycle */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Deployment Lifecycle</p>
              {["Blueprint", "Sandbox", "Approval-Based Pilot", "Managed Production"].map((step, i) => (
                <div key={step} className="flex items-center gap-2 py-1">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</div>
                  <p className="text-xs text-foreground">{step}</p>
                </div>
              ))}
            </div>

            <Link href="/agents" className="block text-center text-xs text-primary hover:underline">
              ← Back to all agents
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xs font-medium text-foreground ${capitalize ? "capitalize" : ""}`}>{value.replace(/_/g, " ")}</p>
    </div>
  );
}
