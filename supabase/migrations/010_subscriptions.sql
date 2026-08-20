-- ─────────────────────────────────────────────────────────────────────────────
-- Hired employee subscriptions
-- Tracks who hired which employee, trial period, billing tier, and price lock.
--
-- Price escalation model:
--   The platform base price starts at $49 and increases $10 per month from launch.
--   Each subscriber locks in the price at the time of their trial start.
--   They keep that price for as long as they stay subscribed.
--
-- launch_epoch: 2026-09-01 (first billing month)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hired_subscriptions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text        NOT NULL,          -- anonymous or authenticated
  employee_slug       text        NOT NULL,
  employee_name       text,
  employee_title      text,

  -- Contact info (from hire form)
  owner_name          text,
  owner_email         text,
  owner_company       text,
  owner_role          text,
  company_size        text,
  use_case            text,
  timeline            text,

  -- Subscription lifecycle
  status              text        NOT NULL DEFAULT 'trial'
                                  CHECK (status IN ('trial', 'active', 'paused', 'cancelled')),
  trial_started_at    timestamptz NOT NULL DEFAULT now(),
  trial_ends_at       timestamptz NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  activated_at        timestamptz,       -- when they converted from trial to paid
  cancelled_at        timestamptz,
  cancel_reason       text,

  -- Pricing lock
  monthly_price_cents int         NOT NULL DEFAULT 4900,  -- $49.00 in cents
  price_locked_at     timestamptz NOT NULL DEFAULT now(),

  -- Billing (Dodo Payments or manual)
  dodo_subscription_id text,
  last_billed_at      timestamptz,
  next_billing_at     timestamptz,
  billing_months      int         NOT NULL DEFAULT 0,    -- how many months billed

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, employee_slug)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user   ON hired_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_slug   ON hired_subscriptions(employee_slug);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON hired_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email  ON hired_subscriptions(owner_email);

ALTER TABLE hired_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON hired_subscriptions USING (true) WITH CHECK (true);

-- Helper: compute the current published price in cents
-- Months since launch epoch (2026-09-01). Price starts at $49 and increases $10/month.
CREATE OR REPLACE FUNCTION current_platform_price_cents() RETURNS int AS $$
DECLARE
  launch_date date := '2026-09-01';
  months_elapsed int;
  price int;
BEGIN
  months_elapsed := GREATEST(0, EXTRACT(YEAR FROM AGE(CURRENT_DATE, launch_date)) * 12
                               + EXTRACT(MONTH FROM AGE(CURRENT_DATE, launch_date)));
  price := 4900 + (months_elapsed * 1000);  -- $49 + $10 per month elapsed
  RETURN price;
END;
$$ LANGUAGE plpgsql;
