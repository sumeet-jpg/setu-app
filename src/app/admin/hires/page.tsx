// @ts-nocheck
import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmployeeHires, getHireSubscriptions } from '@/lib/services/admin.service'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { HireStatusUpdater, HireNotesEditor } from './hire-actions'
import { EMPLOYEES } from '@/lib/employees/profiles'

export const metadata: Metadata = { title: 'Employee Hires' }

const EMOJI: Record<string, string> = Object.fromEntries(EMPLOYEES.map(e => [e.slug, e.emoji]))

const STATUS_PILL: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  contacted:  'bg-blue-100 text-blue-700',
  onboarding: 'bg-violet-100 text-violet-700',
  active:     'bg-emerald-100 text-emerald-700',
  churned:    'bg-gray-100 text-gray-500',
}

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'Active', value: 'active' },
  { label: 'Churned', value: 'churned' },
]

export default async function HiresPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; employee?: string }>
}) {
  const { status, employee } = await searchParams
  let hires: any[] = []
  let subs: any[] = []
  try {
    [hires, subs] = await Promise.all([
      getEmployeeHires({ status: status || undefined, employee_slug: employee || undefined }),
      getHireSubscriptions(),
    ])
  } catch {
    hires = []; subs = []
  }

  // Build a lookup: email+slug → subscription record
  const subLookup: Record<string, any> = {}
  for (const s of subs) {
    subLookup[`${s.owner_email}|${s.employee_slug}`] = s
  }

  // Summary counts
  const counts = hires.reduce<Record<string, number>>((acc, h) => {
    acc[h.status] = (acc[h.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title="Employee Hires"
        description={`${hires.length} hire request${hires.length !== 1 ? 's' : ''}${status ? ` · ${status}` : ''}`}
      />

      {/* Stats chips */}
      <div className="mb-6 flex gap-3 flex-wrap">
        {[
          { label: 'Pending',    key: 'pending',    color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Contacted',  key: 'contacted',  color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Onboarding', key: 'onboarding', color: 'bg-violet-50 border-violet-200 text-violet-700' },
          { label: 'Active',     key: 'active',     color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Churned',    key: 'churned',    color: 'bg-gray-50 border-gray-200 text-gray-500' },
        ].map(s => (
          <Link
            key={s.key}
            href={`/admin/hires?status=${s.key}`}
            className={`rounded-xl border px-4 py-2.5 text-center transition-opacity hover:opacity-80 ${s.color}`}
          >
            <div className="text-xl font-bold">{counts[s.key] ?? 0}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <a
            key={f.value}
            href={f.value ? `/admin/hires?status=${f.value}` : '/admin/hires'}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (status ?? '') === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-primary/10'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {hires.length === 0 ? (
        <EmptyState message="No hire requests yet. They appear here when prospects submit the hire form on any employee profile." />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Employee', 'Contact', 'Subscription', 'Use Case', 'Timeline', 'Status', 'Notes', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {hires.map(hire => (
                <tr key={hire.id} className="hover:bg-muted/30 align-top">

                  {/* Employee */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{EMOJI[hire.employee_slug] ?? '🤖'}</span>
                      <div>
                        <p className="font-semibold text-foreground text-sm leading-tight">{hire.employee_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{hire.employee_title}</p>
                        <Link
                          href={`/employees/${hire.employee_slug}`}
                          target="_blank"
                          className="text-xs text-primary hover:underline"
                        >
                          View profile →
                        </Link>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm text-foreground">{hire.name}</p>
                    <a href={`mailto:${hire.email}`} className="text-xs text-primary hover:underline">{hire.email}</a>
                    <p className="text-xs text-muted-foreground mt-0.5">{hire.company}{hire.role ? ` · ${hire.role}` : ''}</p>
                    {hire.company_size && <p className="text-xs text-muted-foreground">{hire.company_size} employees</p>}
                  </td>

                  {/* Subscription */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {(() => {
                      const sub = subLookup[`${hire.email}|${hire.employee_slug}`]
                      if (!sub) return <span className="text-xs text-muted-foreground">—</span>
                      const daysLeft = sub.trial_ends_at
                        ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000))
                        : null
                      const price = sub.monthly_price_cents ? `$${Math.round(sub.monthly_price_cents / 100)}/mo` : '$49/mo'
                      return (
                        <div>
                          {sub.status === 'trial' && <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{daysLeft}d left</span>}
                          {sub.status === 'active' && <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Active</span>}
                          {sub.status === 'cancelled' && <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Cancelled</span>}
                          <p className="text-xs text-muted-foreground mt-0.5">{price} · locked</p>
                          <Link href={`/manage/${hire.employee_slug}`} className="text-xs text-primary hover:underline">Hub →</Link>
                        </div>
                      )
                    })()}
                  </td>

                  {/* Use Case */}
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-xs text-foreground line-clamp-3 leading-relaxed">{hire.use_case}</p>
                  </td>

                  {/* Timeline */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">{hire.timeline || '—'}</span>
                  </td>

                  {/* Status updater */}
                  <td className="px-4 py-3">
                    <HireStatusUpdater hire={hire} />
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3 min-w-[180px]">
                    <HireNotesEditor hire={hire} />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-xs text-muted-foreground">
                      {new Date(hire.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(hire.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
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
