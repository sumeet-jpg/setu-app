-- =============================================================
-- Migration 024: Account deletion (data-rights offboarding)
--
-- Context: no "delete my account" or "export my data" feature existed at
-- all before this — a full grep of src/ and supabase/ for export/erasure/
-- gdpr/dpdp turned up zero implementation, only mentions inside AI-employee
-- marketing copy. India's DPDP Act 2023 requires erasure once the purpose
-- data was collected for is fulfilled. This table backs a real, working
-- offboarding flow: credentials are purged immediately on request (the
-- highest-risk secret, never left sitting through a grace window), the
-- subscription is cancelled immediately, and the rest of the customer's
-- data is hard-deleted after a short grace window (so one accidental click
-- isn't unrecoverable) via the daily purge-deleted-accounts cron.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.pending_account_deletions (
  user_id        text        PRIMARY KEY,
  owner_email    text,
  requested_at   timestamptz NOT NULL DEFAULT now(),
  purge_at       timestamptz NOT NULL,
  employee_slugs text[]      NOT NULL DEFAULT '{}'
);

ALTER TABLE public.pending_account_deletions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON public.pending_account_deletions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
