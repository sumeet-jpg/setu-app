// ── Setu pricing tiers ───────────────────────────────────────────────────────
// Single source of truth for the finite set of prices a subscription can be
// locked at. Dodo's checkout API has no per-subscription price override for
// recurring products (confirmed against the SDK: `amount` override only
// applies to pay-what-you-want ONE-TIME products) — the only way to actually
// charge a locked price is to create one real Dodo product per tier and pick
// between them at checkout. That only works with a FINITE tier count, which
// is why the previously-unbounded "+$10/month forever" escalation is capped
// here at $99. Must stay in sync with supabase/migrations/017_cap_price_tiers.sql.
export const PRICE_TIERS_USD = [49, 59, 69, 79, 89, 99] as const
export const BASE_PRICE_CENTS = PRICE_TIERS_USD[0] * 100
export const MAX_PRICE_CENTS = PRICE_TIERS_USD[PRICE_TIERS_USD.length - 1] * 100
export const STEP_CENTS = 1000

export function isKnownTierCents(cents: number): boolean {
  return PRICE_TIERS_USD.some(usd => usd * 100 === cents)
}

// Name of the env var holding the real Dodo product_id for a given locked
// price. e.g. 4900 -> "DODO_PRODUCT_ID_49". Each tier needs its own product
// created in the Dodo dashboard — see the founder-facing setup doc.
export function tierProductEnvVar(priceCents: number): string {
  const dollars = Math.round(priceCents / 100)
  return `DODO_PRODUCT_ID_${dollars}`
}

export function currentTierPriceCents(now: Date = new Date()): number {
  const launch = new Date('2026-09-01')
  const monthsElapsed = Math.max(0,
    (now.getFullYear() - launch.getFullYear()) * 12 + (now.getMonth() - launch.getMonth())
  )
  const uncapped = BASE_PRICE_CENTS + monthsElapsed * STEP_CENTS
  return Math.min(uncapped, MAX_PRICE_CENTS)
}
