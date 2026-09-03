-- =============================================================
-- SETU — Migration 020: add 'monitor' to employee_usage_events.event_type
--
-- Context: the new read-only watch-pattern monitoring pass (see
-- src/lib/employees/monitor.ts, /api/cron/watch-check) makes real Claude +
-- connected-tool API calls per customer per employee, same as the
-- interview and execute event types migration 016 already tracks and caps.
-- Counting it under the SAME per-customer monthly cap as 'execute' (see
-- checkExecuteCap in src/lib/usage/cap.ts) rather than a separate
-- system-wide budget, so proactive monitoring can't be used to spend past
-- what that subscription is actually capped at.
-- =============================================================

ALTER TABLE employee_usage_events
  DROP CONSTRAINT IF EXISTS employee_usage_events_event_type_check;

ALTER TABLE employee_usage_events
  ADD CONSTRAINT employee_usage_events_event_type_check
  CHECK (event_type IN ('interview', 'execute', 'monitor'));
