-- =============================================================
-- SETU — Migration 014: top_kpis on hired_subscriptions
-- Backs the post-hire onboarding flow (/employees/[slug]/onboard) —
-- lets an owner name the 2-3 metrics they actually want this employee
-- to move, surfaced back to them (and eventually the employee's own
-- context) instead of a generic "get started" screen.
-- =============================================================

ALTER TABLE hired_subscriptions
  ADD COLUMN IF NOT EXISTS top_kpis jsonb NOT NULL DEFAULT '[]'::jsonb;
