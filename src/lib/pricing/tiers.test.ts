import { describe, it, expect } from 'vitest'
import { PRICE_TIERS_USD, BASE_PRICE_CENTS, MAX_PRICE_CENTS, isKnownTierCents, tierProductEnvVar, currentTierPriceCents } from './tiers'

// This module backs the actual charge a customer's card gets hit for
// (src/app/api/checkout/dodo/route.ts picks a real Dodo product by the
// value this computes) — the one place in the whole app where a silent
// off-by-one costs real money on both sides (over-charging a customer, or
// under-charging and eating the difference forever on that subscription).

describe('PRICE_TIERS_USD', () => {
  it('is the finite 6-tier set the Dodo product-per-tier design depends on', () => {
    expect(PRICE_TIERS_USD).toEqual([49, 59, 69, 79, 89, 99])
  })
})

describe('isKnownTierCents', () => {
  it('accepts every real tier', () => {
    for (const usd of PRICE_TIERS_USD) {
      expect(isKnownTierCents(usd * 100)).toBe(true)
    }
  })

  it('rejects a price that is not one of the 6 real tiers', () => {
    expect(isKnownTierCents(5000)).toBe(false)
    expect(isKnownTierCents(10000)).toBe(false)
  })
})

describe('tierProductEnvVar', () => {
  it('maps a locked price to the exact env var name checkout/dodo reads', () => {
    expect(tierProductEnvVar(4900)).toBe('DODO_PRODUCT_ID_49')
    expect(tierProductEnvVar(9900)).toBe('DODO_PRODUCT_ID_99')
  })

  it('rounds instead of truncating on an unexpected fractional cents value', () => {
    expect(tierProductEnvVar(4950)).toBe('DODO_PRODUCT_ID_50')
  })
})

describe('currentTierPriceCents', () => {
  it('is the $49 base at launch', () => {
    expect(currentTierPriceCents(new Date('2026-09-01'))).toBe(BASE_PRICE_CENTS)
    expect(currentTierPriceCents(new Date('2026-09-15'))).toBe(BASE_PRICE_CENTS)
  })

  it('steps up exactly $10 per elapsed calendar month', () => {
    expect(currentTierPriceCents(new Date('2026-10-01'))).toBe(5900)
    expect(currentTierPriceCents(new Date('2026-11-01'))).toBe(6900)
    expect(currentTierPriceCents(new Date('2026-12-15'))).toBe(7900)
  })

  it('caps at $99 and never exceeds it, however far in the future', () => {
    expect(currentTierPriceCents(new Date('2027-06-01'))).toBe(MAX_PRICE_CENTS)
    expect(currentTierPriceCents(new Date('2030-01-01'))).toBe(MAX_PRICE_CENTS)
  })

  it('never goes negative for a date before launch', () => {
    expect(currentTierPriceCents(new Date('2026-01-01'))).toBe(BASE_PRICE_CENTS)
  })

  it('every value it can ever return is a known, real Dodo tier', () => {
    const dates = ['2026-09-01', '2026-10-01', '2026-12-01', '2027-03-01', '2030-01-01']
    for (const d of dates) {
      expect(isKnownTierCents(currentTierPriceCents(new Date(d)))).toBe(true)
    }
  })
})
