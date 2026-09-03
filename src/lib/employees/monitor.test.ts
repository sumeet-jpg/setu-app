import { describe, it, expect } from 'vitest'
import { filterEligiblePatternIndices, REFIRE_COOLDOWN_DAYS } from './monitor'

// This decides whether the same watch-pattern brief can fire again today —
// get it wrong and either a real signal never re-fires after its first
// hit, or the owner gets spammed with the same brief every single day.

describe('filterEligiblePatternIndices', () => {
  const now = new Date('2026-06-15T00:00:00Z').getTime()

  it('a pattern that has never fired is always eligible', () => {
    const rows = new Map()
    expect(filterEligiblePatternIndices(3, rows, now)).toEqual([0, 1, 2])
  })

  it('a pattern that fired inside the cooldown window is excluded', () => {
    const rows = new Map([[0, { last_fired_at: new Date(now - 1 * 86400000).toISOString() }]]) // 1 day ago
    expect(filterEligiblePatternIndices(2, rows, now)).toEqual([1])
  })

  it(`a pattern that fired exactly ${REFIRE_COOLDOWN_DAYS} days ago is eligible again`, () => {
    const rows = new Map([[0, { last_fired_at: new Date(now - REFIRE_COOLDOWN_DAYS * 86400000 - 1000).toISOString() }]])
    expect(filterEligiblePatternIndices(1, rows, now)).toEqual([0])
  })

  it('a pattern that fired just under the cooldown boundary is still excluded', () => {
    const rows = new Map([[0, { last_fired_at: new Date(now - REFIRE_COOLDOWN_DAYS * 86400000 + 1000).toISOString() }]])
    expect(filterEligiblePatternIndices(1, rows, now)).toEqual([])
  })

  it('mixed: only the patterns outside cooldown come back, in order', () => {
    const rows = new Map([
      [0, { last_fired_at: new Date(now - 1 * 86400000).toISOString() }],  // in cooldown
      [1, { last_fired_at: null }],                                       // never fired
      [2, { last_fired_at: new Date(now - 10 * 86400000).toISOString() }], // long expired
    ])
    expect(filterEligiblePatternIndices(3, rows, now)).toEqual([1, 2])
  })

  it('returns nothing for zero patterns', () => {
    expect(filterEligiblePatternIndices(0, new Map(), now)).toEqual([])
  })
})
