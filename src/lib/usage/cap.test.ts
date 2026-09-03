import { describe, it, expect } from 'vitest'
import { estimateCostUsd } from './cap'

// This is the number that decides when checkExecuteCap/checkInterviewCap
// start returning 429s — an error here either lets a customer run past
// their real cost to the business, or cuts them off early for no reason.

describe('estimateCostUsd', () => {
  it('computes list price for a known model', () => {
    // 1000 input @ $0.003/1K + 1000 output @ $0.015/1K = 0.018
    expect(estimateCostUsd('claude-sonnet-4-6', 1000, 1000)).toBeCloseTo(0.018, 6)
  })

  it('scales linearly with token count', () => {
    const one = estimateCostUsd('claude-sonnet-4-6', 1000, 0)
    const ten = estimateCostUsd('claude-sonnet-4-6', 10000, 0)
    expect(ten).toBeCloseTo(one * 10, 6)
  })

  it('falls back to default pricing for an unrecognized model instead of throwing or returning 0', () => {
    const known = estimateCostUsd('claude-sonnet-4-6', 5000, 2000)
    const unknown = estimateCostUsd('some-future-model-not-in-the-table', 5000, 2000)
    expect(unknown).toBeCloseTo(known, 6)
    expect(unknown).toBeGreaterThan(0)
  })

  it('is zero for zero tokens', () => {
    expect(estimateCostUsd('claude-sonnet-4-6', 0, 0)).toBe(0)
  })

  it('output tokens cost more per-unit than input tokens (5x, per the pricing table)', () => {
    const inputOnly = estimateCostUsd('claude-sonnet-4-6', 1000, 0)
    const outputOnly = estimateCostUsd('claude-sonnet-4-6', 0, 1000)
    expect(outputOnly).toBeCloseTo(inputOnly * 5, 6)
  })
})
