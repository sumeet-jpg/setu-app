-- =============================================================
-- SETU — Migration 016: Per-customer LLM usage tracking + cost cap
--
-- Context: neither the interview route nor the execute route ever
-- recorded token usage or cost anywhere. The existing cost_events table
-- (migration 001) is keyed to tenant_id/blueprint_id — leftover from an
-- earlier multi-tenant product shape — and is only ever written to by
-- the unrelated blueprint pipeline. There was no per-customer spend
-- visibility and no cap: a single customer running the agentic execute
-- loop repeatedly could cost more in raw Claude API spend than their
-- $49/mo subscription brings in, with nothing to stop it.
--
-- This table is keyed the way the AI-Employees product actually
-- identifies customers: an anonymous user_id + employee_slug pair.
-- =============================================================

CREATE TABLE IF NOT EXISTS employee_usage_events (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text        NOT NULL,
  employee_slug       text        NOT NULL,
  event_type          text        NOT NULL CHECK (event_type IN ('interview', 'execute')),
  model               text,
  input_tokens        int         NOT NULL DEFAULT 0,
  output_tokens       int         NOT NULL DEFAULT 0,
  estimated_cost_usd  numeric(10,6) NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_lookup
  ON employee_usage_events(user_id, employee_slug, created_at DESC);

ALTER TABLE employee_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON employee_usage_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
