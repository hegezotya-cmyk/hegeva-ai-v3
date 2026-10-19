"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { useI18n } from '@/lib/i18n/provider'
import { REGISTRATIONS_COPY } from '@/lib/i18n/registrations-copy'

type User = { id: string; name: string; email: string; emailVerified: boolean; createdAt: string | number }
type Metrics = {
  generatedAt: string
  registrations: { total: number; verified: number; last7Days: number; last30Days: number }
  activation: { workspaceUsers: number; active7Days: number; active30Days: number }
  assistant: { operationsThisMonth: number; successfulThisMonth: number; failedThisMonth: number; timedOutThisMonth: number; activeUsersThisMonth: number; averageResponseMs: number | null }
  subscriptions: { active: number; trialing: number; pastDue: number }
}
export default function RegistrationsPage() {
  const { locale } = useI18n()
  const c = REGISTRATIONS_COPY[locale]
  const [users, setUsers] = useState<User[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading')
  const [offset, setOffset] = useState(0)
  const [nextOffset, setNextOffset] = useState<number | null>(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState('loading')
    setUsers([])
    setMetrics(null)
    async function load() {
      try {
        const response = await fetch(`/api/admin/registrations?offset=${offset}`, { credentials: 'include', cache: 'no-store', signal: controller.signal })
        if (controller.signal.aborted) return
        if (response.status === 401 || response.status === 403) { setState('denied'); return }
        const data = await response.json()
        if (!response.ok || !Array.isArray(data.users)) throw new Error('unavailable')
        if (controller.signal.aborted) return
        setUsers(data.users)
        setMetrics(data.metrics)
        setNextOffset(typeof data.nextOffset === 'number' ? data.nextOffset : null)
        setState('ready')
      } catch { if (!controller.signal.aborted) setState('error') }
    }
    void load()
    return () => controller.abort()
  }, [offset, refresh])

  const date = (value: string | number) => {
    const numeric = typeof value === 'number' || /^\d+$/.test(String(value)) ? Number(value) : null
    const parsed = new Date(numeric === null ? value : numeric < 1e12 ? numeric * 1000 : numeric)
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString(locale, { timeZone: 'Europe/London' })
  }
  const button = 'min-h-11 rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-50'
  const rate = (part: number, whole: number) => whole > 0 ? `${Math.round(part / whole * 100)}%` : '—'
  const metricGroups = metrics ? [
    { title: c.registrationsGroup, values: [[c.registrationTotal, metrics.registrations.total], [c.registrationVerified, `${metrics.registrations.verified} (${rate(metrics.registrations.verified, metrics.registrations.total)})`], [c.registrations7d, metrics.registrations.last7Days], [c.registrations30d, metrics.registrations.last30Days]] },
    { title: c.activationGroup, values: [[c.workspaceUsers, metrics.activation.workspaceUsers], [c.workspaceActive7d, metrics.activation.active7Days], [c.workspaceActive30d, metrics.activation.active30Days]] },
    { title: c.assistantGroup, values: [[c.assistantOperationsMonth, metrics.assistant.operationsThisMonth], [c.assistantUsersMonth, metrics.assistant.activeUsersThisMonth], [c.assistantSuccessful, metrics.assistant.successfulThisMonth], [c.assistantFailed, metrics.assistant.failedThisMonth], [c.assistantTimedOut, metrics.assistant.timedOutThisMonth], [c.averageResponse, metrics.assistant.averageResponseMs === null ? '—' : `${metrics.assistant.averageResponseMs} ms`]] },
    { title: c.subscriptionsGroup, values: [[c.subscriptionActive, metrics.subscriptions.active], [c.subscriptionTrialing, metrics.subscriptions.trialing], [c.subscriptionPastDue, metrics.subscriptions.pastDue]] },
  ] : []
  return <AppShell><main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <PageHeader eyebrow="HEGEVA ADMIN" title={c.title} subtitle={c.subtitle} />
    <div className="mt-6 flex flex-wrap gap-3"><Link href="/account" className={button}>{c.account}</Link><button type="button" className={button} disabled={state === 'loading'} onClick={() => setRefresh(value => value + 1)}>{c.refresh}</button></div>
    {state === 'loading' && <p role="status" className="mt-6">{c.loading}</p>}
    {(state === 'denied' || state === 'error') && <p role="alert" className="mt-6">{state === 'denied' ? c.denied : c.error}</p>}
    {state === 'ready' && metrics && <section className="mt-6" aria-labelledby="owner-metrics-title">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="owner-metrics-title" className="font-display text-2xl">{c.metricsTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{c.measuredAt}: {date(metrics.generatedAt)}</p></div></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{metricGroups.map(group => <article key={group.title} className="glass-panel rounded-2xl p-5"><h3 className="font-semibold text-primary">{group.title}</h3><dl className="mt-4 grid gap-3 sm:grid-cols-2">{group.values.map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border/70 bg-background/30 p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd></div>)}</dl></article>)}</div>
      <p className="mt-4 rounded-xl border border-border bg-background/30 p-4 text-xs leading-5 text-muted-foreground">{c.measurementDefinitions}</p>
    </section>}
    {state === 'ready' && <section className="glass-panel mt-6 rounded-2xl p-4">
      {users.length === 0 ? <p>{c.empty}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{[c.name, c.email, c.date, c.verified].map(label => <th key={label} className="border-b border-border p-3">{label}</th>)}</tr></thead><tbody>{users.map(user => <tr key={user.id}><td className="p-3">{user.name}</td><td className="break-all p-3">{user.email}</td><td className="p-3">{date(user.createdAt)}</td><td className="p-3">{user.emailVerified ? c.yes : c.no}</td></tr>)}</tbody></table></div>}
      <div className="mt-4 flex gap-3"><button type="button" className={button} disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 50))}>{c.previous}</button><button type="button" className={button} disabled={nextOffset === null} onClick={() => nextOffset !== null && setOffset(nextOffset)}>{c.next}</button></div>
    </section>}
  </main></AppShell>
}
