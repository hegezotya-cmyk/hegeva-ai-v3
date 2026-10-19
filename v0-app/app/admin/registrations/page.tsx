"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { useI18n } from '@/lib/i18n/provider'
import { REGISTRATIONS_COPY } from '@/lib/i18n/registrations-copy'

type User = { id: string; name: string; email: string; emailVerified: boolean; createdAt: string | number }
export default function RegistrationsPage() {
  const { locale } = useI18n()
  const c = REGISTRATIONS_COPY[locale]
  const [users, setUsers] = useState<User[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading')
  const [offset, setOffset] = useState(0)
  const [nextOffset, setNextOffset] = useState<number | null>(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState('loading')
    setUsers([])
    async function load() {
      try {
        const response = await fetch(`/api/admin/registrations?offset=${offset}`, { credentials: 'include', cache: 'no-store', signal: controller.signal })
        if (controller.signal.aborted) return
        if (response.status === 401 || response.status === 403) { setState('denied'); return }
        const data = await response.json()
        if (!response.ok || !Array.isArray(data.users)) throw new Error('unavailable')
        if (controller.signal.aborted) return
        setUsers(data.users)
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
  return <AppShell><main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <PageHeader eyebrow="HEGEVA ADMIN" title={c.title} subtitle={c.subtitle} />
    <div className="mt-6 flex flex-wrap gap-3"><Link href="/account" className={button}>{c.account}</Link><button type="button" className={button} disabled={state === 'loading'} onClick={() => setRefresh(value => value + 1)}>{c.refresh}</button></div>
    {state === 'loading' && <p role="status" className="mt-6">{c.loading}</p>}
    {(state === 'denied' || state === 'error') && <p role="alert" className="mt-6">{state === 'denied' ? c.denied : c.error}</p>}
    {state === 'ready' && <section className="glass-panel mt-6 rounded-2xl p-4">
      {users.length === 0 ? <p>{c.empty}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{[c.name, c.email, c.date, c.verified].map(label => <th key={label} className="border-b border-border p-3">{label}</th>)}</tr></thead><tbody>{users.map(user => <tr key={user.id}><td className="p-3">{user.name}</td><td className="break-all p-3">{user.email}</td><td className="p-3">{date(user.createdAt)}</td><td className="p-3">{user.emailVerified ? c.yes : c.no}</td></tr>)}</tbody></table></div>}
      <div className="mt-4 flex gap-3"><button type="button" className={button} disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 50))}>{c.previous}</button><button type="button" className={button} disabled={nextOffset === null} onClick={() => nextOffset !== null && setOffset(nextOffset)}>{c.next}</button></div>
    </section>}
  </main></AppShell>
}
