import { describe, it, expect, beforeAll } from 'vitest'

// Decrypts real customer API keys (Slack, HubSpot, Mailchimp, etc.) before
// every real tool call the execute/monitor engines make. A round-trip or
// tamper-detection regression here either bricks every connected
// integration or, worse, silently accepts a corrupted/tampered key.

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-key-at-least-32-characters'
})

import { encrypt, decrypt } from './crypto'

describe('encrypt / decrypt', () => {
  it('round-trips a plaintext value', () => {
    const secret = 'sk-live-abc123-real-api-key'
    expect(decrypt(encrypt(secret))).toBe(secret)
  })

  it('handles an empty string', () => {
    expect(decrypt(encrypt(''))).toBe('')
  })

  it('handles unicode content', () => {
    const secret = 'ключ-🔑-密钥'
    expect(decrypt(encrypt(secret))).toBe(secret)
  })

  it('produces a different ciphertext each time for the same plaintext (random IV)', () => {
    const a = encrypt('same-secret')
    const b = encrypt('same-secret')
    expect(a).not.toBe(b)
  })

  it('produces the documented ivHex.tagHex.encryptedHex format', () => {
    const ciphertext = encrypt('anything')
    expect(ciphertext.split('.')).toHaveLength(3)
  })

  it('rejects a ciphertext with a flipped byte in the auth tag (tamper detection)', () => {
    const ciphertext = encrypt('sensitive-key')
    const [iv, tag, enc] = ciphertext.split('.')
    const tamperedTag = (parseInt(tag[0], 16) ^ 0xf).toString(16) + tag.slice(1)
    expect(() => decrypt([iv, tamperedTag, enc].join('.'))).toThrow()
  })

  it('rejects a ciphertext with tampered encrypted content', () => {
    const ciphertext = encrypt('sensitive-key')
    const [iv, tag, enc] = ciphertext.split('.')
    const tamperedEnc = (parseInt(enc[0], 16) ^ 0xf).toString(16) + enc.slice(1)
    expect(() => decrypt([iv, tag, tamperedEnc].join('.'))).toThrow()
  })

  it('rejects a malformed (wrong part count) ciphertext instead of silently returning garbage', () => {
    expect(() => decrypt('not-the-right-format')).toThrow('Invalid encrypted key format')
    expect(() => decrypt('a.b')).toThrow('Invalid encrypted key format')
  })

  it('a value encrypted under one key does not decrypt under a different key', () => {
    const ciphertext = encrypt('secret-under-key-a')
    process.env.ENCRYPTION_KEY = 'a-totally-different-encryption-key-value'
    expect(() => decrypt(ciphertext)).toThrow()
    process.env.ENCRYPTION_KEY = 'test-encryption-key-at-least-32-characters'
  })
})
