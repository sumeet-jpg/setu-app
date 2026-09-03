import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isAllowedAdminEmail } from './admin-guard'

// This is the ENTIRE admin authorization boundary. The file-header comment
// documents a real incident: before this allowlist existed, any successful
// Google/GitHub OAuth login on the public /signin page granted full admin
// access — subscription management, lead data, blueprint approve/reject —
// to anyone. These tests lock down that a missing/misconfigured
// ADMIN_EMAIL fails CLOSED, not open.

const ORIGINAL = process.env.ADMIN_EMAIL

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.ADMIN_EMAIL
  else process.env.ADMIN_EMAIL = ORIGINAL
})

describe('isAllowedAdminEmail', () => {
  it('fails closed when ADMIN_EMAIL is unset — nobody is admin, not everybody', () => {
    delete process.env.ADMIN_EMAIL
    expect(isAllowedAdminEmail('anyone@gmail.com')).toBe(false)
    expect(isAllowedAdminEmail('founder@setuagents.com')).toBe(false)
  })

  it('fails closed when ADMIN_EMAIL is set to an empty string', () => {
    process.env.ADMIN_EMAIL = ''
    expect(isAllowedAdminEmail('anyone@gmail.com')).toBe(false)
  })

  it('allows exactly the configured email', () => {
    process.env.ADMIN_EMAIL = 'founder@setuagents.com'
    expect(isAllowedAdminEmail('founder@setuagents.com')).toBe(true)
  })

  it('rejects an email that is not on the allowlist', () => {
    process.env.ADMIN_EMAIL = 'founder@setuagents.com'
    expect(isAllowedAdminEmail('attacker@gmail.com')).toBe(false)
  })

  it('is case-insensitive on both sides', () => {
    process.env.ADMIN_EMAIL = 'Founder@SetuAgents.com'
    expect(isAllowedAdminEmail('founder@setuagents.com')).toBe(true)
    expect(isAllowedAdminEmail('FOUNDER@SETUAGENTS.COM')).toBe(true)
  })

  it('supports a comma-separated allowlist of multiple admins', () => {
    process.env.ADMIN_EMAIL = 'a@setuagents.com, b@setuagents.com,c@setuagents.com'
    expect(isAllowedAdminEmail('a@setuagents.com')).toBe(true)
    expect(isAllowedAdminEmail('b@setuagents.com')).toBe(true)
    expect(isAllowedAdminEmail('c@setuagents.com')).toBe(true)
    expect(isAllowedAdminEmail('d@setuagents.com')).toBe(false)
  })

  it('does not treat a substring match as a match', () => {
    process.env.ADMIN_EMAIL = 'founder@setuagents.com'
    expect(isAllowedAdminEmail('notfounder@setuagents.com')).toBe(false)
    expect(isAllowedAdminEmail('founder@setuagents.com.evil.com')).toBe(false)
  })
})
