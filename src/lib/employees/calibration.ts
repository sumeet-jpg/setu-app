// @ts-nocheck
// ── Setu Calibration Policy ─────────────────────────────────────────────────
// Shared between /api/employees/calibration (reads/writes the trust dial) and
// the execute loop (actually acts on it). Originally only the calibration
// route computed this — employee_calibration tracked a real trust score and
// autonomy_level per employee, but the execute loop's approval rule was a
// hardcoded "ALWAYS call request_approval" with no reference to it at all.
// An employee you'd come to trust never earned any more latitude; the whole
// engine was decorative.

export function autonomyLabel(level: number): string {
  if (level < 0.2) return 'Supervised'
  if (level < 0.4) return 'Guided'
  if (level < 0.6) return 'Collaborative'
  if (level < 0.8) return 'Trusted'
  return 'Autonomous'
}

export function trustColor(score: number): string {
  if (score >= 0.75) return '#22c55e'
  if (score >= 0.5) return '#6366f1'
  if (score >= 0.3) return '#f59e0b'
  return '#ef4444'
}

export type ActionPolicy = 'can propose freely' | 'propose with justification'
  | 'can propose, owner reviews text' | 'always requires explicit approval'
  | 'can propose, fast-track approval' | 'requires approval'
  | 'can propose with full context'

// What the autonomy level means for each action type's default behavior.
// Mirrors the http_request tool's real risk shape in execute/route.ts:
// draft/plan-only work loosens first, spend/external-write loosens last
// (external_api needs 0.9 — i.e. explicit owner override, never system-earned
// alone, since default trust_score starts at 0.5 and the system only nudges
// it, it never assigns 0.9 on its own from ordinary approvals).
export function autonomyPolicy(level: number): Record<string, ActionPolicy> {
  return {
    draft_document: level >= 0.3 ? 'can propose freely' : 'propose with justification',
    create_task: level >= 0.3 ? 'can propose freely' : 'propose with justification',
    send_email: level >= 0.8 ? 'can propose, owner reviews text' : 'always requires explicit approval',
    schedule_meeting: level >= 0.6 ? 'can propose, fast-track approval' : 'requires approval',
    update_record: level >= 0.7 ? 'can propose, fast-track approval' : 'requires approval',
    external_api: level >= 0.9 ? 'can propose with full context' : 'always requires explicit approval',
  }
}

// Renders the policy as an instruction block for the execute loop's system
// prompt. Kept intentionally conservative: even at the loosest tiers, only
// read-only GETs and low-risk drafting skip the approval gate outright —
// every real send/publish/spend action still gets a request_approval call,
// just with less hand-holding language at higher trust. This is a starting
// point, not a finished trust model — see the audit note in execute/route.ts.
export function autonomyRulesText(level: number): string {
  const policy = autonomyPolicy(level)
  const label = autonomyLabel(level)

  if (level < 0.3) {
    return `Autonomy level: ${label} (${level.toFixed(2)}). This owner has given you limited trust so far — request approval before every create/send/publish/delete/spend action, and explain your reasoning in the approval request.`
  }

  return `Autonomy level: ${label} (${level.toFixed(2)}), based on this owner's real approval history with you.
- Sending real messages, spending money, or calling external write actions (${policy.send_email === 'can propose, owner reviews text' ? 'send_email' : 'external_api'}): ${policy.send_email}.
- Drafting documents or creating internal tasks: ${policy.draft_document} — you may skip the approval step for pure drafts the owner hasn't asked you to send anywhere yet.
- Never skip approval for anything irreversible or anything spending real money, regardless of trust level.`
}
