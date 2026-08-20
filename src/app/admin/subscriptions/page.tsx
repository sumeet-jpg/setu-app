// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Sub = {
  id: string
  user_id: string
  employee_slug: string
  employee_name: string
  employee_title: string
  owner_name: string
  owner_email: string
  owner_company: string
  status: 'trial' | 'active' | 'paused' | 'cancelled'
  trial_ends_at: string
  monthly_price_cents: number
  billing_months: number
  activated_at: string | null
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  trial:     'bg-amber-100 text-amber-700 border-amber-200',
  active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  paused:    'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs]           = useState<Sub[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('')
  const [updating, setUpdating]   = useState<string | null>(null)

  async function load(status?: string) {
    setLoading(true)
    const url = '/api/admin/subscriptions' + (status ? `?status=${status}` : '')
    const r = await fetch(url)
    const d = await r.json()
    setSubs(d.subscriptions ?? [])
    setLoading(false)
  }

  useEffect(() => { load(filter || undefined) }, [filter])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch('/api/admin/subscriptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    await load(filter || undefined)
    setUpdating(null)
  }

  const counts = subs.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">{subs.length} total · manage trial conversions and billing status</p>
      </div>

      {/* Stats */}
      <div className="mb-6 flex gap-3 flex-wrap">
        {[
          { label: 'Trial',     key: 'trial',     color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Active',    key: 'active',    color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Paused',    key: 'paused',    color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Cancelled', key: 'cancelled', color: 'bg-gray-50 border-gray-200 text-gray-500' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? '' : s.key)}
            className={`rounded-xl border px-4 py-2.5 text-center transition-all ${s.color} ${filter === s.key ? 'ring-2 ring-offset-1 ring-current' : ''}`}>
            <div className="text-xl font-bold">{counts[s.key] ?? 0}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Loading…</div>
      ) : subs.length === 0 ? (
        <div className="text-sm text-muted-foreground py-12 text-center">
          No subscriptions yet. They appear when someone completes the hire form.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Customer', 'Employee', 'Status', 'Price', 'Trial Ends', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subs.map(sub => (
                <tr key={sub.id} className="hover:bg-muted/30 align-middle">

                  {/* Customer */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground text-sm">{sub.owner_name ?? '—'}</p>
                    <a href={`mailto:${sub.owner_email}`} className="text-xs text-primary hover:underline">{sub.owner_email}</a>
                    {sub.owner_company && <p className="text-xs text-muted-foreground mt-0.5">{sub.owner_company}</p>}
                  </td>

                  {/* Employee */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm text-foreground">{sub.employee_name ?? sub.employee_slug}</p>
                    <p className="text-xs text-muted-foreground">{sub.employee_title ?? sub.employee_slug}</p>
                    <Link href={`/manage/${sub.employee_slug}`} target="_blank" className="text-xs text-primary hover:underline">Hub →</Link>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[sub.status] ?? ''}`}>
                      {sub.status}
                    </span>
                    {sub.status === 'trial' && (
                      <p className="text-xs text-muted-foreground mt-1">{daysLeft(sub.trial_ends_at)}d left</p>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm font-semibold text-foreground">
                      ${sub.monthly_price_cents ? Math.round(sub.monthly_price_cents / 100) : 49}/mo
                    </p>
                    <p className="text-xs text-muted-foreground">locked</p>
                  </td>

                  {/* Trial Ends */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-xs text-foreground">
                      {sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </p>
                    {sub.activated_at && (
                      <p className="text-xs text-muted-foreground">Activated {new Date(sub.activated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {sub.status !== 'active' && (
                        <button
                          onClick={() => updateStatus(sub.id, 'active')}
                          disabled={updating === sub.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {updating === sub.id ? '…' : 'Mark Active'}
                        </button>
                      )}
                      {sub.status !== 'cancelled' && (
                        <button
                          onClick={() => updateStatus(sub.id, 'cancelled')}
                          disabled={updating === sub.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      {sub.status === 'cancelled' && (
                        <button
                          onClick={() => updateStatus(sub.id, 'trial')}
                          disabled={updating === sub.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 font-semibold hover:bg-amber-200 disabled:opacity-50"
                        >
                          Reactivate Trial
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
