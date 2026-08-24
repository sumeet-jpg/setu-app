-- =============================================================
-- SETU — Migration 018: Cron run heartbeat
--
-- Context: cron-auth.ts's own comment documents that both cron jobs
-- (trial lifecycle, decay) already silently 401'd for a real stretch of
-- production time because Vercel's actual auth header didn't match what
-- the routes checked — discovered only by chance, with zero alerting.
-- If CRON_SECRET is ever unset again, or Vercel's cron config drifts
-- again, the exact same silent failure mode repeats with nothing to
-- surface it. This table lets the admin dashboard show "last successful
-- run" per job so a stalled cron is visible at a glance instead of
-- discovered by a customer complaint weeks later.
-- =============================================================

CREATE TABLE IF NOT EXISTS cron_runs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    text        NOT NULL,
  status      text        NOT NULL CHECK (status IN ('success', 'failed')),
  detail      text,
  ran_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_runs_job_ran_at ON cron_runs(job_name, ran_at DESC);

ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON cron_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
