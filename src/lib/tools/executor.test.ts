import { describe, it, expect } from 'vitest'
import { buildBaseUrl, buildAuthHeaders, applyToolOverrides } from './executor'

// This is what actually authenticates every real call the execute/monitor
// engines make against a customer's connected tool. A wrong header name or
// wrong Basic-auth shape here doesn't throw at connect time — it just
// makes every call to that tool fail (or worse, silently misauthenticate)
// the first time a real customer uses it.

describe('buildBaseUrl', () => {
  it('substitutes a {placeholder} from config', () => {
    expect(buildBaseUrl('https://{dc}.api.mailchimp.com/3.0', { dc: 'us21' })).toBe('https://us21.api.mailchimp.com/3.0')
  })

  it('substitutes multiple placeholders', () => {
    expect(buildBaseUrl('https://{server}.docusign.net/restapi/v2.1/accounts/{accountId}', { server: 'na3', accountId: 'abc-123' }))
      .toBe('https://na3.docusign.net/restapi/v2.1/accounts/abc-123')
  })

  it('leaves a URL with no placeholders untouched', () => {
    expect(buildBaseUrl('https://api.hubapi.com', {})).toBe('https://api.hubapi.com')
  })

  it('substitutes with empty string rather than leaving the literal placeholder when config is missing the key', () => {
    expect(buildBaseUrl('https://{shard}.echosign.com', {})).toBe('https://.echosign.com')
  })
})

describe('buildAuthHeaders', () => {
  it('bearer: standard Authorization header', () => {
    expect(buildAuthHeaders('bearer', 'my-token', {})).toEqual({ Authorization: 'Bearer my-token' })
  })

  it('oauth: also a Bearer header (token already retrieved externally)', () => {
    expect(buildAuthHeaders('oauth', 'oauth-token', {})).toEqual({ Authorization: 'Bearer oauth-token' })
  })

  it('api_key: defaults to X-Api-Key when config does not override the header name', () => {
    expect(buildAuthHeaders('api_key', 'secret', {})).toEqual({ 'X-Api-Key': 'secret' })
  })

  it('api_key: respects a config-provided header name', () => {
    expect(buildAuthHeaders('api_key', 'secret', { api_key_header: 'X-Custom-Key' })).toEqual({ 'X-Custom-Key': 'secret' })
  })

  it('basic: "user:pass" shape splits correctly', () => {
    const headers = buildAuthHeaders('basic', 'myuser:mypass', {})
    expect(headers.Authorization).toBe(`Basic ${Buffer.from('myuser:mypass').toString('base64')}`)
  })

  it('basic: a bare key with no colon defaults to "apikey" as username', () => {
    const headers = buildAuthHeaders('basic', 'justakey', {})
    expect(headers.Authorization).toBe(`Basic ${Buffer.from('apikey:justakey').toString('base64')}`)
  })

  it('account_sid: Twilio "SID:Token" shape', () => {
    const headers = buildAuthHeaders('account_sid', 'AC123:authtoken456', {})
    expect(headers.Authorization).toBe(`Basic ${Buffer.from('AC123:authtoken456').toString('base64')}`)
  })

  it('an unrecognized authType falls back to Bearer rather than sending no auth at all', () => {
    expect(buildAuthHeaders('something-new', 'a-key', {})).toEqual({ Authorization: 'Bearer a-key' })
  })
})

describe('applyToolOverrides', () => {
  it('mailchimp: Basic auth with "apikey" as username', () => {
    const { headers } = applyToolOverrides('mailchimp', 'my-mc-key', {}, {})
    expect(headers.Authorization).toBe(`Basic ${Buffer.from('apikey:my-mc-key').toString('base64')}`)
  })

  it('semrush: moves the key to a query param and strips Authorization', () => {
    const { headers, query } = applyToolOverrides('semrush', 'sr-key', { Authorization: 'Bearer sr-key' }, {})
    expect(query.key).toBe('sr-key')
    expect(headers.Authorization).toBeUndefined()
  })

  it('pipedrive: moves the key to api_token query param', () => {
    const { query } = applyToolOverrides('pipedrive', 'pd-key', {}, {})
    expect(query.api_token).toBe('pd-key')
  })

  it('datadog: splits "apiKey:appKey" into two headers', () => {
    const { headers } = applyToolOverrides('datadog', 'apikey123:appkey456', {}, {})
    expect(headers['DD-API-KEY']).toBe('apikey123')
    expect(headers['DD-APPLICATION-KEY']).toBe('appkey456')
  })

  it('a tool with no override passes headers/query through unchanged', () => {
    const headers = { Authorization: 'Bearer x' }
    const query = { foo: 'bar' }
    expect(applyToolOverrides('hubspot', 'x', headers, query)).toEqual({ headers, query })
  })

  // New this session — Scheduling/E-signature category buildout.
  it('dropbox-sign: Basic auth with the key as username and a BLANK password (not the mailchimp "apikey:" shape)', () => {
    const { headers } = applyToolOverrides('dropbox-sign', 'ds-key', {}, {})
    expect(headers.Authorization).toBe(`Basic ${Buffer.from('ds-key:').toString('base64')}`)
    // Specifically distinct from mailchimp's shape, since both are "basic" authType
    // and it would be an easy copy-paste mistake to reuse mailchimp's override.
    expect(headers.Authorization).not.toBe(`Basic ${Buffer.from('apikey:ds-key').toString('base64')}`)
  })

  it('pandadoc: "Authorization: API-Key {key}", and removes the generic X-Api-Key header the api_key authType would otherwise leave behind', () => {
    const generic = buildAuthHeaders('api_key', 'pd-key', {})
    const { headers } = applyToolOverrides('pandadoc', 'pd-key', generic, {})
    expect(headers.Authorization).toBe('API-Key pd-key')
    expect(headers['X-Api-Key']).toBeUndefined()
  })

  // New this session — the second, profile-audit-driven registry expansion.
  it('discord: "Authorization: Bot {token}" — a raw Bearer header authenticates as nothing', () => {
    const generic = buildAuthHeaders('bearer', 'bot-token', {})
    const { headers } = applyToolOverrides('discord', 'bot-token', generic, {})
    expect(headers.Authorization).toBe('Bot bot-token')
  })

  it('pagerduty: "Authorization: Token token={key}", and removes the generic X-Api-Key header', () => {
    const generic = buildAuthHeaders('api_key', 'pd-key', {})
    const { headers } = applyToolOverrides('pagerduty', 'pd-key', generic, {})
    expect(headers.Authorization).toBe('Token token=pd-key')
    expect(headers['X-Api-Key']).toBeUndefined()
  })

  it('okta: "Authorization: SSWS {token}", and removes the generic X-Api-Key header', () => {
    const generic = buildAuthHeaders('api_key', 'okta-key', {})
    const { headers } = applyToolOverrides('okta', 'okta-key', generic, {})
    expect(headers.Authorization).toBe('SSWS okta-key')
    expect(headers['X-Api-Key']).toBeUndefined()
  })
})
