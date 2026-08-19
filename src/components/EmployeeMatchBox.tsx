'use client'
// @ts-nocheck
import { useState, useRef } from 'react'
import Link from 'next/link'

const GREEN   = '#0E5C34'
const GREEN_L = '#EAF5EE'
const GREEN_M = '#1A9655'
const INK     = '#0D0C09'
const GRAY    = '#E3E1DA'
const MUTED   = '#78746E'
const DIM     = '#9E9891'
const BG      = '#F6F5F1'
const WHITE   = '#FFFFFF'

interface Match {
  slug: string; name: string; title: string; dept: string
  emoji: string; color: string; tagline: string
  pricing: { label: string }; agentCount: number; years: number
  confidence: number; reasons: string[]
}

const PROMPTS = [
  'I need someone to run paid ads and track ROAS across Google and Meta',
  'Our support tickets are piling up and response times are too slow',
  'I want to automate invoicing and monthly financial close',
  'Help me build a sales pipeline and follow up with leads automatically',
  'Run our content calendar and coordinate social media posting',
]

export default function EmployeeMatchBox({ count = 0 }: { count?: number }) {
  const [problem, setProblem] = useState('')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<Match[] | null>(null)
  const [searched, setSearched] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const search = async (text?: string) => {
    const q = (text ?? problem).trim()
    if (!q || loading) return
    setLoading(true)
    setMatches(null)
    setSearched(q)
    try {
      const res = await fetch('/api/employees/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: q }),
      })
      const data = await res.json()
      setMatches(data.matches ?? [])
    } catch {
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); search() }
  }

  return (
    <div>
      {/* Input box */}
      <div style={{ background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 16,
        padding: '4px 6px 6px 6px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', marginBottom: matches !== null ? 24 : 0 }}>
        <textarea
          ref={inputRef}
          value={problem}
          onChange={e => setProblem(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Describe your business problem — e.g. 'our support tickets pile up and no one follows up with leads'…"
          rows={2}
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: 15,
            color: INK, background: 'transparent', padding: '12px 14px 4px', lineHeight: 1.6,
            fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 2px' }}>
          <span style={{ fontSize: 11, color: DIM }}>Press Enter or click Match</span>
          <button onClick={() => search()} disabled={loading || !problem.trim()}
            style={{ background: loading || !problem.trim() ? GRAY : INK,
              color: loading || !problem.trim() ? MUTED : WHITE, border: 'none',
              borderRadius: 10, padding: '8px 20px', fontWeight: 700, fontSize: 13,
              cursor: loading || !problem.trim() ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
            {loading ? 'Matching…' : 'Match me →'}
          </button>
        </div>
      </div>

      {/* Example prompts (shown before first search) */}
      {matches === null && !loading && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {PROMPTS.map(p => (
            <button key={p} onClick={() => { setProblem(p); search(p) }}
              style={{ fontSize: 12, color: MUTED, background: WHITE, border: `1px solid ${GRAY}`,
                borderRadius: 20, padding: '5px 14px', cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.15s, color 0.15s' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = GREEN; (e.currentTarget as HTMLElement).style.color = GREEN }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = GRAY; (e.currentTarget as HTMLElement).style.color = MUTED }}>
              {p.length > 60 ? p.slice(0, 57) + '…' : p}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {matches !== null && (
        <div>
          {matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: MUTED, fontSize: 14 }}>
              No strong match found. <Link href="/employees" style={{ color: GREEN, fontWeight: 600 }}>Browse all AI Employees →</Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
                Best matches for <em style={{ color: INK, fontStyle: 'normal', fontWeight: 600 }}>"{searched}"</em>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {matches.map((m, i) => (
                  <Link key={m.slug} href={`/employees/${m.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: WHITE, border: `1.5px solid ${i === 0 ? m.color + '60' : GRAY}`,
                      borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center',
                      gap: 16, cursor: 'pointer', transition: 'box-shadow 0.15s',
                      boxShadow: i === 0 ? `0 0 0 3px ${m.color}12` : 'none' }}
                      onMouseOver={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)'}
                      onMouseOut={e => (e.currentTarget as HTMLElement).style.boxShadow = i === 0 ? `0 0 0 3px ${m.color}12` : 'none'}>

                      {/* Avatar */}
                      <div style={{ width: 48, height: 48, borderRadius: 13, background: m.color + '14',
                        border: `1.5px solid ${m.color}25`, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {m.emoji}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          {i === 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, background: GREEN_L, color: GREEN,
                              borderRadius: 4, padding: '2px 7px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              Best match
                            </span>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 600, color: MUTED }}>{m.dept}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{m.title}</div>
                        {m.reasons.length > 0 && (
                          <div style={{ fontSize: 11, color: DIM, marginTop: 5 }}>
                            {m.reasons[0]}
                          </div>
                        )}
                      </div>

                      {/* Right: confidence + price */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: m.color, marginBottom: 4 }}>
                          {m.confidence}% match
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{m.pricing.label}</div>
                        <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{m.agentCount} agents</div>
                      </div>

                      <div style={{ fontSize: 18, color: MUTED, flexShrink: 0 }}>›</div>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Link href="/employees" style={{ fontSize: 13, color: GREEN, fontWeight: 600,
                  textDecoration: 'none', borderBottom: `1px solid ${GREEN}`, paddingBottom: 1 }}>
                  Browse all {count > 0 ? count : ''} AI Employees →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
