# Dodo Payments setup — required after this session's pricing fix

## Why this is needed

Checkout previously charged whatever price was configured on one fixed
`DODO_PRODUCT_ID`, regardless of what a customer's subscription was actually
locked at. Dodo has no per-subscription price override for recurring
products, so the only real fix is **one Dodo product per price tier**,
selected automatically at checkout time by `src/app/api/checkout/dodo/route.ts`.

The step-up pricing model is now capped at $99/mo (was unbounded before),
giving a finite set of 6 tiers: **$49, $59, $69, $79, $89, $99**.

## Steps

### 1. Create 6 products in the Dodo dashboard

For each tier, create a recurring monthly subscription product:

| Tier | Price | Suggested product name |
|---|---|---|
| 1 | $49.00/mo | Setu AI Employee — $49/mo |
| 2 | $59.00/mo | Setu AI Employee — $59/mo |
| 3 | $69.00/mo | Setu AI Employee — $69/mo |
| 4 | $79.00/mo | Setu AI Employee — $79/mo |
| 5 | $89.00/mo | Setu AI Employee — $89/mo |
| 6 | $99.00/mo | Setu AI Employee — $99/mo |

Same billing interval (monthly), same currency (USD) as your existing
product. You likely already have a $49 product (`DODO_PRODUCT_ID`) — you
can reuse that one as the $49 tier instead of creating a duplicate.

### 2. Set the env vars on Vercel

For each tier, copy its Dodo product ID into:

```
DODO_PRODUCT_ID_49=<product id>
DODO_PRODUCT_ID_59=<product id>
DODO_PRODUCT_ID_69=<product id>
DODO_PRODUCT_ID_79=<product id>
DODO_PRODUCT_ID_89=<product id>
DODO_PRODUCT_ID_99=<product id>
```

Your existing `DODO_PRODUCT_ID` env var stays as-is — it's now the fallback
used only if a tier's specific env var is somehow missing (checkout will
never hard-fail because of a missing tier var, but it'll log a loud error
so you notice before a customer gets charged the wrong rate).

Since it's currently pre-launch and everyone signs up at $49, only
`DODO_PRODUCT_ID_49` is actually load-bearing right now. You have until
the first step-up date (Oct 1, one month after `LAUNCH_DATE` in
`src/lib/pricing/tiers.ts`) to add the rest.

### 3. Apply the 3 new database migrations

Run these in the Supabase SQL editor for the setu-app project, in order —
same process as the RLS migration from earlier in this session:

- `supabase/migrations/016_employee_usage_events.sql` — per-customer usage cap tracking
- `supabase/migrations/017_cap_price_tiers.sql` — caps the price escalation function at $99 server-side (must match the code-side cap)
- `supabase/migrations/018_cron_runs.sql` — cron health heartbeat table

### 4. Optional env vars (safe defaults if you skip these)

```
ANON_INTERVIEW_DAILY_CAP_USD=1      # free interview daily spend cap per visitor (default: 1)
HIRED_EMPLOYEE_MONTHLY_CAP_USD=15   # per-subscription monthly LLM spend cap (default: 15)
```

### 5. Verify

- Hire an employee (or use a test account) and go through checkout — confirm the Dodo checkout page shows $49, and check your Vercel logs for the `[checkout/dodo] Missing DODO_PRODUCT_ID_...` warning (it should NOT appear once step 2 is done for the $49 tier).
- Check `/admin` — the "Needs attention" banner will show cron jobs as "never run" until the first scheduled run after this deploy fires (expected, not a bug).
