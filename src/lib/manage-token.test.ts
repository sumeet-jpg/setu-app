import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'

// manage-token gates every route that touches private customer data
// (subscription mutations, beliefs, vault, calibration) — this used to be a
// bare client-supplied userId with no verification at all. These tests lock
// down that the signature actually matters and that expiry is enforced,
// since a silent regression here reopens the exact IDOR the token was built
// to close.

beforeAll(() => {
  process.env.MANAGE_TOKEN_SECRET = 'test-secret-at-least-32-characters-long'
})

// Re-import fresh per test file run is fine — secret() reads the env var
// lazily on every call, not at module load, so setting it in beforeAll
// before any exported function runs is sufficient.
import { signManageToken, signRecoveryToken, verifyManageToken } from './manage-token'

describe('signManageToken / verifyManageToken', () => {
  it('round-trips the userId', () => {
    const token = signManageToken('user-123')
    expect(verifyManageToken(token)).toBe('user-123')
  })

  it('rejects a token with a tampered payload', () => {
    const token = signManageToken('user-123')
    const [payloadB64, sig] = token.split('.')
    const forgedPayload = Buffer.from('someone-elses-id.9999999999999', 'utf8').toString('base64url')
    expect(verifyManageToken(`${forgedPayload}.${sig}`)).toBeNull()
  })

  it('rejects a token with a tampered signature', () => {
    const token = signManageToken('user-123')
    const [payloadB64] = token.split('.')
    expect(verifyManageToken(`${payloadB64}.not-a-real-signature`)).toBeNull()
  })

  it('rejects malformed input instead of throwing', () => {
    expect(verifyManageToken(null)).toBeNull()
    expect(verifyManageToken(undefined)).toBeNull()
    expect(verifyManageToken('')).toBeNull()
    expect(verifyManageToken('not-a-token')).toBeNull()
    expect(verifyManageToken('only.two')).toBeNull()
  })

  it('a token signed with a different secret does not verify', () => {
    const token = signManageToken('user-123')
    const originalSecret = process.env.MANAGE_TOKEN_SECRET
    process.env.MANAGE_TOKEN_SECRET = 'a-completely-different-secret-value'
    expect(verifyManageToken(token)).toBeNull()
    process.env.MANAGE_TOKEN_SECRET = originalSecret
  })
})

describe('token expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('a 90-day manage session is still valid after 89 days', () => {
    const token = signManageToken('user-123')
    vi.setSystemTime(new Date('2026-03-31T00:00:00Z')) // +89 days
    expect(verifyManageToken(token)).toBe('user-123')
  })

  it('a 90-day manage session expires after 91 days', () => {
    const token = signManageToken('user-123')
    vi.setSystemTime(new Date('2026-04-02T00:00:00Z')) // +91 days
    expect(verifyManageToken(token)).toBeNull()
  })

  it('a 48-hour recovery token expires well before the 90-day session TTL would', () => {
    const token = signRecoveryToken('user-123')
    vi.setSystemTime(new Date('2026-01-03T01:00:00Z')) // +49 hours
    expect(verifyManageToken(token)).toBeNull()
  })

  it('a 48-hour recovery token is valid inside its window', () => {
    const token = signRecoveryToken('user-123')
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z')) // +36 hours
    expect(verifyManageToken(token)).toBe('user-123')
  })
})
