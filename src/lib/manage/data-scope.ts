// @ts-nocheck
// ── Data-rights scope ────────────────────────────────────────────────────────
// Single source of truth for what "your data" means for a hired-employee
// customer, shared by the export route and the delete-account route so the
// two can never silently drift apart (export showing one set of tables,
// delete purging a different set).
//
// Deliberately scoped to the anonymous-userId AI-employee product surface —
// NOT the separate, older blueprint-builder/leads pipeline (`leads`,
// `lead_intelligence`, `support_tickets`, `conversations`, `generated_blueprints`),
// which is keyed by email through a different identity model entirely and is
// a distinct product surface. If that pipeline is still active, it needs its
// own data-rights handling — scoping it in here would mean matching by email
// (the only link available), which risks pulling in another customer's data
// if emails were ever reused, so it's explicitly left out.
//
// Every table below is checked against the live schema in supabase/migrations
// as of migration 024. Migration history has some drift (notably a second,
// conflicting `employee_actions` definition in 008_action_layer.sql after
// 006_full_architecture.sql already created it with different columns —
// `CREATE TABLE IF NOT EXISTS` silently no-ops the second one) so every query
// below is wrapped defensively per-table rather than assumed to succeed.

export interface UserScopedTable {
  table: string
  // What this data actually is, for the export bundle's human-readable labels.
  label: string
}

export const USER_SCOPED_TABLES: UserScopedTable[] = [
  { table: 'hired_subscriptions',        label: 'Subscriptions (which employees you hired, billing status)' },
  { table: 'employee_tasks',             label: 'Task and chat history' },
  { table: 'employee_memories',          label: 'Episodic memory (what your employees have observed)' },
  { table: 'company_documents',          label: 'Documents you uploaded (SOPs, website, org chart)' },
  { table: 'employee_beliefs',           label: 'Beliefs your employees have formed about your business' },
  { table: 'employee_actions',           label: 'Autonomous action history' },
  { table: 'employee_action_log',        label: 'Action execution log' },
  { table: 'employee_watch_patterns',    label: 'Proactive monitoring rules' },
  { table: 'employee_proactive_briefs',  label: 'Proactive briefs your employees have sent you' },
  { table: 'employee_calibration',       label: 'Trust/autonomy calibration per employee' },
  { table: 'action_outcomes',            label: 'Outcomes recorded for calibration' },
  { table: 'employee_usage_events',      label: 'Usage and cost history' },
  { table: 'employee_hires',             label: 'Hire records' },
  { table: 'distillation_runs',          label: 'Memory-distillation job history' },
  { table: 'org_cortex_entries',         label: 'Shared intelligence across your hired employees' },
  { table: 'runtime_instances',          label: 'Deployed employee runtime records' },
]

// tool_connections holds encrypted third-party credentials (encrypted_key) —
// never included in an export, and purged immediately (not on the grace
// window) on account deletion since it's the single highest-risk secret.
export const TOOL_CONNECTIONS_TABLE = 'tool_connections'
// Customer-supplied AI provider keys (BYOK, migration 025) — same treatment
// as tool_connections: a real secret, purged immediately on deletion, never
// exported. Setu is a pipeline, not a custodian — nothing here is ever kept
// longer than the customer wants it kept.
export const CUSTOMER_AI_KEYS_TABLE = 'customer_ai_keys'
export const TOOL_CONNECTIONS_EXPORT_COLUMNS = 'tool_slug, config, connected_at, last_used_at'

// task_approvals has no user_id column — it's linked via task_id to
// employee_tasks, which IS user-scoped. Handled as a two-step lookup.
export const TASK_APPROVALS_TABLE = 'task_approvals'

export const DELETION_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Pull every real, per-customer row for this userId across all known
 * tables. Returns { data, errors } — a table that errors (e.g. a column
 * name mismatch from migration drift) is recorded in `errors`, not thrown,
 * so one bad table never blanks out an otherwise-successful export.
 */
export async function collectUserData(supabase: any, userId: string) {
  const data: Record<string, unknown[]> = {}
  const errors: Record<string, string> = {}

  await Promise.all(
    USER_SCOPED_TABLES.map(async ({ table }) => {
      try {
        const { data: rows, error } = await supabase.from(table).select('*').eq('user_id', userId)
        if (error) throw error
        data[table] = rows ?? []
      } catch (err: any) {
        errors[table] = err?.message ?? 'query failed'
      }
    })
  )

  // task_approvals: fetch via the user's own task IDs, never a bare join
  // that could leak another customer's approvals.
  try {
    const taskIds = (data['employee_tasks'] ?? []).map((t: any) => t.id).filter(Boolean)
    if (taskIds.length) {
      const { data: approvals, error } = await supabase
        .from(TASK_APPROVALS_TABLE)
        .select('*')
        .in('task_id', taskIds)
      if (error) throw error
      data[TASK_APPROVALS_TABLE] = approvals ?? []
    } else {
      data[TASK_APPROVALS_TABLE] = []
    }
  } catch (err: any) {
    errors[TASK_APPROVALS_TABLE] = err?.message ?? 'query failed'
  }

  // Tool connections — metadata only, never the decrypted or even the
  // encrypted secret itself.
  try {
    const { data: tools, error } = await supabase
      .from(TOOL_CONNECTIONS_TABLE)
      .select(TOOL_CONNECTIONS_EXPORT_COLUMNS)
      .eq('user_id', userId)
    if (error) throw error
    data[TOOL_CONNECTIONS_TABLE] = tools ?? []
  } catch (err: any) {
    errors[TOOL_CONNECTIONS_TABLE] = err?.message ?? 'query failed'
  }

  return { data, errors }
}

/**
 * Immediately purge the highest-risk secret (encrypted tool credentials)
 * and cancel active subscriptions. Called the moment deletion is requested,
 * not after the grace window — a leaked or misused credential is a much
 * bigger real-world risk than losing a chat log a few days early.
 */
export async function purgeCredentialsAndCancel(supabase: any, userId: string) {
  await supabase.from(TOOL_CONNECTIONS_TABLE).delete().eq('user_id', userId)
  await supabase.from(CUSTOMER_AI_KEYS_TABLE).delete().eq('user_id', userId)
  await supabase
    .from('hired_subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'account_deletion' })
    .eq('user_id', userId)
}

/**
 * Hard-delete every remaining row for this userId across every user-scoped
 * table. Called only by the purge-deleted-accounts cron, once the grace
 * window has passed.
 */
export async function hardDeleteUserData(supabase: any, userId: string) {
  const errors: Record<string, string> = {}
  for (const { table } of USER_SCOPED_TABLES) {
    try {
      const { error } = await supabase.from(table).delete().eq('user_id', userId)
      if (error) throw error
    } catch (err: any) {
      errors[table] = err?.message ?? 'delete failed'
    }
  }
  // task_approvals isn't in USER_SCOPED_TABLES (no user_id column) but
  // needs no separate delete here — its task_id FK to employee_tasks is
  // declared ON DELETE CASCADE (migration 011), so removing the task rows
  // above already removes their approvals.
  return errors
}
