-- =============================================================
-- SETU — Migration 012: Lock down "owner_access" RLS policies
-- Context: migrations 008, 009, 010 each created a policy shaped
-- CREATE POLICY "owner_access" ON <table> USING (true) WITH CHECK (true)
-- with no `TO service_role` restriction — meaning the policy applies
-- to EVERY role, including `anon` and `authenticated`. Since Setu's
-- Supabase publishable/anon key is public (shipped to the browser
-- bundle), this means anyone can read or write these tables directly
-- via the Supabase REST API, completely bypassing the app's own
-- server-side logic — including all customer PII in hired_subscriptions
-- (name, email, company) and the ability to flip subscription status.
--
-- Every legitimate read/write to these tables already goes through a
-- Next.js API route using SUPABASE_SERVICE_ROLE_KEY (confirmed: no
-- client-side code queries any of these tables with the anon key).
-- RLS with zero matching policies for anon/authenticated denies by
-- default, so the fix is simply to scope these policies to
-- `service_role` only — the same pattern migration 011 already
-- established for tool_connections / employee_tasks / task_approvals.
-- This changes no application behavior; it only removes public
-- Supabase REST access that was never used by the app itself.
-- =============================================================

DROP POLICY IF EXISTS "owner_access" ON hired_subscriptions;
CREATE POLICY "service_role_full_access" ON hired_subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "owner_access" ON employee_actions;
CREATE POLICY "service_role_full_access" ON employee_actions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "owner_access" ON employee_action_log;
CREATE POLICY "service_role_full_access" ON employee_action_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "owner_access" ON employee_calibration;
CREATE POLICY "service_role_full_access" ON employee_calibration
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "owner_access" ON action_outcomes;
CREATE POLICY "service_role_full_access" ON action_outcomes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
