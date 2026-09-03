import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkRateLimit, getClientIp } from './rate-limiter'

// The in-memory store is a module-level singleton, so each test uses its
// own unique key to avoid cross-test interference within this file.
let keyCounter = 0
const uniqueKey = () => `test-key-${keyCounter++}`

describe('checkRateLimit', () => {
  it('allows requests up to the limit', () => {
    const key = uniqueKey()
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit({ key, limit: 3, windowMs: 60000 })
      expect(result.allowed).toBe(true)
    }
  })

  it('denies the request that exceeds the limit', () => {
    const key = uniqueKey()
    checkRateLimit({ key, limit: 2, windowMs: 60000 })
    checkRateLimit({ key, limit: 2, windowMs: 60000 })
    const third = checkRateLimit({ key, limit: 2, windowMs: 60000 })
    expect(third.allowed).toBe(false)
    expect(third.remaining).toBe(0)
  })

  it('decrements remaining correctly', () => {
    const key = uniqueKey()
    const first = checkRateLimit({ key, limit: 5, windowMs: 60000 })
    expect(first.remaining).toBe(4)
    const second = checkRateLimit({ key, limit: 5, windowMs: 60000 })
    expect(second.remaining).toBe(3)
  })

  it('does not let one key affect another key\'s budget', () => {
    const keyA = uniqueKey()
    const keyB = uniqueKey()
    checkRateLimit({ key: keyA, limit: 1, windowMs: 60000 })
    const blockedA = checkRateLimit({ key: keyA, limit: 1, windowMs: 60000 })
    const allowedB = checkRateLimit({ key: keyB, limit: 1, windowMs: 60000 })
    expect(blockedA.allowed).toBe(false)
    expect(allowedB.allowed).toBe(true)
  })

  describe('window reset', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('resets the budget once the window has elapsed', () => {
      const key = uniqueKey()
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      checkRateLimit({ key, limit: 1, windowMs: 60000 })
      const blocked = checkRateLimit({ key, limit: 1, windowMs: 60000 })
      expect(blocked.allowed).toBe(false)

      vi.setSystemTime(new Date('2026-01-01T00:01:01Z')) // +61s, past the 60s window
      const afterReset = checkRateLimit({ key, limit: 1, windowMs: 60000 })
      expect(afterReset.allowed).toBe(true)
    })
  })
})

describe('getClientIp', () => {
  it('prefers x-forwarded-for', () => {
    const req = new Request('https://example.com', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('https://example.com', { headers: { 'x-real-ip': '9.8.7.6' } })
    expect(getClientIp(req)).toBe('9.8.7.6')
  })

  it('falls back to "unknown" when neither header is present', () => {
    const req = new Request('https://example.com')
    expect(getClientIp(req)).toBe('unknown')
  })
})
