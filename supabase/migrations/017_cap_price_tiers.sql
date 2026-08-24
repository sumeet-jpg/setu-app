-- =============================================================
-- SETU — Migration 017: Cap the price step-up at a finite tier set
--
-- Context: current_platform_price_cents() (migration 010) escalates
-- $10/month from launch with no ceiling — forever, mathematically. That
-- was never enforceable at the actual Dodo checkout: checkout/dodo/route.ts
-- only ever creates a session against ONE fixed DODO_PRODUCT_ID, so the
-- locked price rode along as metadata only and was never actually charged.
-- Dodo's subscription checkout has no per-subscription price override —
-- the only real fix is one Dodo product per price tier, selected at
-- checkout time. That requires a FINITE set of tiers to pre-create as
-- real products, hence the cap below.
--
-- Must stay in sync with src/lib/pricing/tiers.ts (PRICE_TIERS_USD).
-- Capped at $99/mo (5 step-ups from the $49 base: 49/59/69/79/89/99).
-- =============================================================

CREATE OR REPLACE FUNCTION current_platform_price_cents() RETURNS int AS $$
DECLARE
  launch_date date := '2026-09-01';
  months_elapsed int;
  price int;
  max_price int := 9900; -- $99 cap — see src/lib/pricing/tiers.ts
BEGIN
  months_elapsed := GREATEST(0, EXTRACT(YEAR FROM AGE(CURRENT_DATE, launch_date)) * 12
                               + EXTRACT(MONTH FROM AGE(CURRENT_DATE, launch_date)));
  price := 4900 + (months_elapsed * 1000);
  RETURN LEAST(price, max_price);
END;
$$ LANGUAGE plpgsql;
