import { describe, it, expect } from 'vitest'
import { extractKeywords } from './context'

describe('extractKeywords', () => {
  it('drops stop words and short tokens', () => {
    const kw = extractKeywords([{ role: 'user', content: 'What is the best way to do this for us' }])
    expect(kw.has('what')).toBe(false)
    expect(kw.has('the')).toBe(false)
    expect(kw.has('for')).toBe(false)
    expect(kw.has('us')).toBe(false) // length 2, filtered by length > 3
  })

  it('keeps meaningful lowercase keywords', () => {
    const kw = extractKeywords([{ role: 'user', content: 'Draft a Halloween campaign for Mailchimp' }])
    expect(kw.has('draft')).toBe(true)
    expect(kw.has('halloween')).toBe(true)
    expect(kw.has('campaign')).toBe(true)
    expect(kw.has('mailchimp')).toBe(true)
  })

  it('only looks at the last 4 messages, so an old topic does not keep matching forever', () => {
    const messages = [
      { role: 'user', content: 'unicorn' },
      { role: 'assistant', content: 'ok' },
      { role: 'user', content: 'giraffe' },
      { role: 'assistant', content: 'ok' },
      { role: 'user', content: 'zebra' },
    ]
    const kw = extractKeywords(messages)
    expect(kw.has('unicorn')).toBe(false)
    expect(kw.has('zebra')).toBe(true)
  })

  it('strips punctuation so it does not fragment matching', () => {
    const kw = extractKeywords([{ role: 'user', content: "What's our CAC/LTV ratio, exactly?" }])
    expect(kw.has('exactly')).toBe(true)
  })
})
