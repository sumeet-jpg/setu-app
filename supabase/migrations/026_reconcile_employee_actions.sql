-- =============================================================
-- Migration 026: Reconcile employee_actions — two conflicting schemas
--
-- Context: 006_full_architecture.sql created employee_actions with one
-- shape (action_label, autonomy_mode, outcome, approved — all NOT NULL,
-- no default on autonomy_mode). 008_action_layer.sql later tried to define
-- the SAME table name with a completely different, richer shape (title,
-- description, payload, status, proposed_at, rejected_at, executed_at,
-- result, error) — but `CREATE TABLE IF NOT EXISTS` silently no-ops when
-- the table already exists, so 008's columns were never actually created.
-- Every route written against 008's shape (src/app/api/employees/actions/
-- route.ts — backs the anonymous-interview pending-actions demo — and the
-- audit-trail query in src/app/api/employees/calibration/route.ts) has
-- been failing on both SELECT (missing columns) and INSERT (missing
-- columns, plus violating the NOT NULL constraints on action_label and
-- autonomy_mode, which that code never populates) since it shipped —
-- confirmed via live 500s on a real hired customer's own dashboard.
--
-- grep confirms zero application code references the original 006 columns
-- (action_label, autonomy_mode, outcome, approved, outcome_note,
-- failure_reason, failure_category, tool_slug, tool_method, action_hash) —
-- dead, but not dropped here (non-destructive; a later cleanup migration
-- can drop them once confirmed safe). This migration adds every column
-- 008's code actually needs and relaxes the NOT NULL constraints that
-- code never satisfies, so both the live INSERT and SELECT paths work.
-- =============================================================

ALTER TABLE public.employee_actions
  ADD COLUMN IF NOT EXISTS title         text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status        text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS proposed_at   timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS rejected_at   timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS executed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS result        jsonb,
  ADD COLUMN IF NOT EXISTS "error"       text;

ALTER TABLE public.employee_actions
  DROP CONSTRAINT IF EXISTS employee_actions_status_check;
ALTER TABLE public.employee_actions
  ADD CONSTRAINT employee_actions_status_check
  CHECK (status IN ('pending','approved','rejected','executing','done','failed'));

-- Never populated by any live code path — relax so INSERT/SELECT against
-- the shape actually in use today stop failing.
ALTER TABLE public.employee_actions ALTER COLUMN action_label DROP NOT NULL;
ALTER TABLE public.employee_actions ALTER COLUMN autonomy_mode DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_employee_actions_user_slug_proposed
  ON public.employee_actions(user_id, employee_slug, proposed_at DESC);
