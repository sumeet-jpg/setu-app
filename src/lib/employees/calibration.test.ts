import { describe, it, expect } from 'vitest'
import { autonomyLabel, trustColor, autonomyPolicy, autonomyRulesText } from './calibration'

describe('autonomyLabel', () => {
  it('maps the full 0-1 range to the documented bands', () => {
    expect(autonomyLabel(0)).toBe('Supervised')
    expect(autonomyLabel(0.19)).toBe('Supervised')
    expect(autonomyLabel(0.2)).toBe('Guided')
    expect(autonomyLabel(0.39)).toBe('Guided')
    expect(autonomyLabel(0.4)).toBe('Collaborative')
    expect(autonomyLabel(0.59)).toBe('Collaborative')
    expect(autonomyLabel(0.6)).toBe('Trusted')
    expect(autonomyLabel(0.79)).toBe('Trusted')
    expect(autonomyLabel(0.8)).toBe('Autonomous')
    expect(autonomyLabel(1)).toBe('Autonomous')
  })
})

describe('trustColor', () => {
  it('maps score bands to the documented colors', () => {
    expect(trustColor(0.75)).toBe('#22c55e')
    expect(trustColor(0.5)).toBe('#6366f1')
    expect(trustColor(0.3)).toBe('#f59e0b')
    expect(trustColor(0.29)).toBe('#ef4444')
    expect(trustColor(0)).toBe('#ef4444')
  })
})

describe('autonomyPolicy', () => {
  it('at the system default (0.3), gates every real send/spend action behind explicit approval', () => {
    const policy = autonomyPolicy(0.3)
    expect(policy.send_email).toBe('always requires explicit approval')
    expect(policy.external_api).toBe('always requires explicit approval')
  })

  it('never loosens external_api below 0.9 — the highest tier requires an owner-earned, not system-assigned, trust level', () => {
    expect(autonomyPolicy(0.89).external_api).toBe('always requires explicit approval')
    expect(autonomyPolicy(0.9).external_api).toBe('can propose with full context')
  })

  it('never loosens send_email below 0.8', () => {
    expect(autonomyPolicy(0.79).send_email).toBe('always requires explicit approval')
    expect(autonomyPolicy(0.8).send_email).toBe('can propose, owner reviews text')
  })

  it('loosens low-risk drafting first, at 0.3', () => {
    expect(autonomyPolicy(0.29).draft_document).toBe('propose with justification')
    expect(autonomyPolicy(0.3).draft_document).toBe('can propose freely')
  })
})

describe('autonomyRulesText', () => {
  it('below 0.3, tells the model to request approval before every consequential action, unconditionally', () => {
    const text = autonomyRulesText(0.2)
    expect(text).toContain('request approval before every create/send/publish/delete/spend action')
  })

  it('at or above 0.3, still refuses to skip approval for irreversible or money-spending actions', () => {
    const text = autonomyRulesText(0.95)
    expect(text.toLowerCase()).toContain('never skip approval')
    expect(text.toLowerCase()).toContain('irreversible')
    expect(text.toLowerCase()).toContain('spending real money')
  })

  it('surfaces the numeric level and label so the model has real grounding, not just vibes', () => {
    const text = autonomyRulesText(0.65)
    expect(text).toContain('0.65')
    expect(text).toContain('Trusted')
  })
})
