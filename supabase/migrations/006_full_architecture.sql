-- ─────────────────────────────────────────────────────────────────────────────
-- 006_full_architecture.sql
-- Apprenticeship Architecture — full cognitive stack for AI employees
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Compounding Knowledge Graph (CKG) ─────────────────────────────────────────
-- Bitemporal belief storage with Ebbinghaus confidence decay.
-- event_time = when the thing happened; ingestion_time = when we learned it.
-- Confidence decays unless reinforced; conflicts are flagged, never silently overwritten.

create table if not exists public.employee_beliefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  employee_slug text not null,

  -- The belief itself
  category text not null check (category in (
    'owner_preference', 'business_context', 'decision', 'relationship',
    'market_signal', 'failure_pattern', 'success_pattern', 'domain_update'
  )),
  subject text not null,      -- what this belief is about (e.g. "ICP definition", "owner communication style")
  belief text not null,       -- the distilled belief in plain language
  evidence text,              -- what session evidence supports this belief (sanitized — no raw transcript)
  confidence float not null default 0.85 check (confidence between 0.0 and 1.0),

  -- Bitemporal: when it happened vs when we recorded it
  event_time timestamptz not null default now(),
  ingestion_time timestamptz not null default now(),

  -- Conflict detection
  supersedes_id uuid references public.employee_beliefs(id),
  conflict_with_id uuid references public.employee_beliefs(id),
  conflict_note text,

  -- Decay tracking
  last_validated_at timestamptz not null default now(),
  decay_rate float not null default 0.05,  -- confidence lost per week without reinforcement
  reinforcement_count int not null default 1,

  -- Source
  distillation_run_id uuid,  -- which distillation job produced this
  session_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_beliefs_lookup
  on public.employee_beliefs(user_id, employee_slug, category, confidence desc);

create index if not exists employee_beliefs_subject
  on public.employee_beliefs(user_id, employee_slug, subject);

-- ── Distillation Runs log ─────────────────────────────────────────────────────
-- Tracks every distillation job: what went in, what came out.
-- Raw session content is never stored — only the structured extraction result.

create table if not exists public.distillation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  employee_slug text not null,
  session_id text not null,

  -- What we extracted
  beliefs_created int not null default 0,
  beliefs_updated int not null default 0,
  beliefs_conflicted int not null default 0,
  preferences_extracted int not null default 0,
  decisions_captured int not null default 0,

  -- Extraction summary (not raw content — always distilled)
  summary text,
  raw_message_count int not null default 0,

  -- Status
  status text not null default 'pending' check (status in ('pending', 'running', 'complete', 'failed')),
  error text,

  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists distillation_runs_lookup
  on public.distillation_runs(user_id, employee_slug, created_at desc);

-- ── Action Layer ──────────────────────────────────────────────────────────────
-- Every action taken by an employee, with autonomy mode, outcome, and full audit trail.

do $$ begin
  create type autonomy_mode as enum (
    'research_only',
    'draft_for_approval',
    'act_with_notification',
    'fully_autonomous'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.employee_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  employee_slug text not null,
  session_id text,

  -- What was done
  action_type text not null,       -- e.g. 'sequence_created', 'meeting_booked', 'report_generated'
  action_label text not null,      -- human-readable description
  autonomy_mode autonomy_mode not null,

  -- Approval tracking
  required_approval boolean not null default false,
  approved_at timestamptz,
  approved boolean,
  approval_note text,

  -- Outcome
  outcome text check (outcome in ('success', 'failure', 'partial', 'unknown')),
  outcome_note text,
  failure_reason text,
  failure_category text,  -- 'wrong_target', 'timing', 'messaging', 'data_quality', etc.

  -- Tool used
  tool_slug text,
  tool_method text,

  -- Non-repudiation
  action_hash text,  -- sha256 of (user_id + employee_slug + action_label + timestamp)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_actions_lookup
  on public.employee_actions(user_id, employee_slug, created_at desc);

create index if not exists employee_actions_outcome
  on public.employee_actions(user_id, employee_slug, outcome, failure_category);

-- ── Proactive Intelligence Network — Watch Patterns ───────────────────────────
-- Employee-specific signal subscriptions. When a signal fires, a proactive brief
-- is queued. Not cron — event-driven.

create table if not exists public.employee_watch_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  employee_slug text not null,

  pattern_key text not null,       -- stable identifier, e.g. 'reply_rate_drop'
  pattern_label text not null,     -- human-readable label
  pattern_description text not null,
  threshold_config jsonb,          -- e.g. {"drop_pct": 20, "window_days": 7}

  -- Trigger state
  last_checked_at timestamptz,
  last_fired_at timestamptz,
  fire_count int not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  unique(user_id, employee_slug, pattern_key)
);

create index if not exists employee_watch_patterns_lookup
  on public.employee_watch_patterns(user_id, employee_slug, is_active);

-- Proactive brief queue — what the employee wants to tell you before you ask
create table if not exists public.employee_proactive_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  employee_slug text not null,
  watch_pattern_id uuid references public.employee_watch_patterns(id),

  title text not null,
  body text not null,
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high', 'critical')),
  signal_data jsonb,

  -- Delivery state
  delivered boolean not null default false,
  delivered_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists employee_proactive_briefs_unread
  on public.employee_proactive_briefs(user_id, employee_slug, delivered, created_at desc);

-- ── Outcome Attribution ───────────────────────────────────────────────────────
-- KPI events and failure memory. The employee owns their outcomes.

create table if not exists public.employee_outcome_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  employee_slug text not null,

  kpi_key text not null,           -- e.g. 'meetings_to_pipeline', 'reply_rate'
  kpi_label text not null,
  metric_value float,
  metric_unit text,                -- e.g. 'percent', 'count', 'usd'
  target_value float,
  period_start date,
  period_end date,

  -- Failure memory (first-class, not an afterthought)
  is_failure boolean not null default false,
  failure_cause text,              -- root cause in the employee's own analysis
  retry_eligible boolean,          -- would a retry under different conditions be warranted?
  retry_conditions text,           -- what would need to change for a retry to make sense

  -- Source
  action_id uuid references public.employee_actions(id),
  session_id text,
  notes text,

  created_at timestamptz not null default now()
);

create index if not exists employee_outcome_events_lookup
  on public.employee_outcome_events(user_id, employee_slug, kpi_key, created_at desc);

-- ── Cross-Employee Cortex (CEC) ────────────────────────────────────────────────
-- Persistent shared organizational intelligence. Not orchestration — memory.
-- What one employee learns that every employee should know.

create table if not exists public.org_cortex_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,

  entry_type text not null check (entry_type in (
    'org_decision', 'customer_insight', 'market_signal',
    'process_change', 'product_update', 'team_context'
  )),
  title text not null,
  body text not null,

  -- Source employee
  source_employee_slug text not null,
  source_session_id text,

  -- Relevance routing — which employees should consume this entry
  relevant_to text[] default '{}',  -- empty = all employees
  consumed_by text[] default '{}',  -- which slugs have seen it

  confidence float not null default 0.9,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists org_cortex_lookup
  on public.org_cortex_entries(user_id, is_active, created_at desc);

-- ── Meeting Intelligence ───────────────────────────────────────────────────────
-- Pre-briefs, notes, and action items tracked to completion. The gap nobody else fills.

create table if not exists public.meeting_intelligence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  employee_slug text not null,

  meeting_title text,
  meeting_at timestamptz,

  -- Pre-brief
  pre_brief text,
  pre_brief_sent_at timestamptz,

  -- Notes and decisions
  notes text,
  decisions_extracted text[],
  notes_captured_at timestamptz,

  -- Action items — tracked to completion
  action_items jsonb default '[]',
  -- [{title, owner, due_date, status: "open"|"done"|"stalled", completed_at, notes}]

  stalled_items_flagged_at timestamptz,
  completed_at timestamptz,
  session_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meeting_intelligence_lookup
  on public.meeting_intelligence(user_id, employee_slug, meeting_at desc);

-- ── RLS Policies ──────────────────────────────────────────────────────────────

alter table public.employee_beliefs enable row level security;
alter table public.distillation_runs enable row level security;
alter table public.employee_actions enable row level security;
alter table public.employee_watch_patterns enable row level security;
alter table public.employee_proactive_briefs enable row level security;
alter table public.employee_outcome_events enable row level security;
alter table public.org_cortex_entries enable row level security;
alter table public.meeting_intelligence enable row level security;

-- Service role bypass (used by backend APIs)
create policy "service_role_all" on public.employee_beliefs for all to service_role using (true);
create policy "service_role_all" on public.distillation_runs for all to service_role using (true);
create policy "service_role_all" on public.employee_actions for all to service_role using (true);
create policy "service_role_all" on public.employee_watch_patterns for all to service_role using (true);
create policy "service_role_all" on public.employee_proactive_briefs for all to service_role using (true);
create policy "service_role_all" on public.employee_outcome_events for all to service_role using (true);
create policy "service_role_all" on public.org_cortex_entries for all to service_role using (true);
create policy "service_role_all" on public.meeting_intelligence for all to service_role using (true);

-- Authenticated users can read/write their own data
create policy "owner_access" on public.employee_beliefs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner_access" on public.distillation_runs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner_access" on public.employee_actions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner_access" on public.employee_watch_patterns
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner_access" on public.employee_proactive_briefs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner_access" on public.employee_outcome_events
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner_access" on public.org_cortex_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner_access" on public.meeting_intelligence
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
