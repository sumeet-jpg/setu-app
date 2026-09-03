import { describe, it, expect, afterEach } from 'vitest'
import { verifyCronSecret } from './cron-auth'

// The file-header comment on cron-auth.ts documents a real incident: both
// cron routes checked a custom x-cron-secret header that Vercel's own Cron
// Jobs never send (Vercel sends `Authorization: Bearer <CRON_SECRET>`), so
// every scheduled run silently 401'd and did nothing — trials never
// auto-expired, decay never ran — with no visible symptom short of
// checking Vercel's own cron logs. These tests lock down both the real
// Vercel format and the legacy manual-trigger format.

function mockRequest(headers: Record<string, string>) {
  return { headers: { get: (k: string) => headers[k.toLowerCase()] ?? null } } as any
}

const ORIGINAL = process.env.CRON_SECRET

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = ORIGINAL
})

describe('verifyCronSecret', () => {
  it('fails closed when CRON_SECRET is unset, even with a header that would otherwise match', () => {
    delete process.env.CRON_SECRET
    expect(verifyCronSecret(mockRequest({ authorization: 'Bearer anything' }))).toBe(false)
  })

  it('accepts the real Vercel Cron format: Authorization: Bearer <secret>', () => {
    process.env.CRON_SECRET = 'my-cron-secret'
    expect(verifyCronSecret(mockRequest({ authorization: 'Bearer my-cron-secret' }))).toBe(true)
  })

  it('rejects a bearer token that does not match', () => {
    process.env.CRON_SECRET = 'my-cron-secret'
    expect(verifyCronSecret(mockRequest({ authorization: 'Bearer wrong-secret' }))).toBe(false)
  })

  it('still accepts the legacy x-cron-secret header for manual/external triggers', () => {
    process.env.CRON_SECRET = 'my-cron-secret'
    expect(verifyCronSecret(mockRequest({ 'x-cron-secret': 'my-cron-secret' }))).toBe(true)
  })

  it('rejects when neither header is present', () => {
    process.env.CRON_SECRET = 'my-cron-secret'
    expect(verifyCronSecret(mockRequest({}))).toBe(false)
  })

  it('does not accept a bare (non-Bearer-prefixed) matching value in the Authorization header', () => {
    process.env.CRON_SECRET = 'my-cron-secret'
    expect(verifyCronSecret(mockRequest({ authorization: 'my-cron-secret' }))).toBe(false)
  })
})
