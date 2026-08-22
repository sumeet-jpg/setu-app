-- =============================================================
-- SETU — Migration 013: interview_leads
-- Every person who interviews an AI Employee is high-intent, but
-- nothing captured their email — the anonymous interview flow (by
-- design, zero friction) had no lead-capture path at all. This table
-- backs a soft, skippable, post-engagement email prompt (not a
-- pre-chat gate — that would contradict the "free to interview, no
-- account needed" mechanic that's the actual product differentiator).
-- =============================================================

CREATE TABLE IF NOT EXISTS interview_leads (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        text        NOT NULL,
  employee_slug  text        NOT NULL,
  email          text        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_interview_leads_email ON interview_leads (email);
CREATE INDEX IF NOT EXISTS idx_interview_leads_created ON interview_leads (created_at DESC);

ALTER TABLE interview_leads ENABLE ROW LEVEL SECURITY;

-- Service role only — same pattern as every other table locked down in
-- migration 012. All access goes through a Next.js API route.
CREATE POLICY "service_role_full_access" ON interview_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);
