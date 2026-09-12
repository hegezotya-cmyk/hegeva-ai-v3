"use client"

import { FormEvent, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { PageHeader } from '@/components/page-header'
import { useI18n } from '@/lib/i18n/provider'
import { CONTACT_COPY } from '@/lib/i18n/contact-copy'

export default function ContactPage() {
  const { locale } = useI18n()
  const c = CONTACT_COPY[locale]
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<'success'|'error'|null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setBusy(true)
    setResult(null)
    const form = new FormData(formElement)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'), email: form.get('email'), company: form.get('company'),
          message: form.get('message'), website: form.get('website'), locale, startedAt,
        }),
      })
      if (!response.ok) throw new Error('contact_failed')
      formElement.reset()
      setStartedAt(Date.now())
      setResult('success')
    } catch {
      setResult('error')
    } finally {
      setBusy(false)
    }
  }

  return <AppShell>
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader eyebrow="HEGEVA AI" title={c.title} subtitle={c.subtitle} />
      <form onSubmit={submit} className="ve-panel mt-8 space-y-5 rounded-3xl p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium">{c.name}<input name="name" required minLength={2} maxLength={100} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 outline-none focus:border-primary/50" /></label>
          <label className="text-sm font-medium">{c.email}<input name="email" type="email" required maxLength={254} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 outline-none focus:border-primary/50" /></label>
        </div>
        <label className="block text-sm font-medium">{c.company}<input name="company" maxLength={120} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 outline-none focus:border-primary/50" /></label>
        <label className="block text-sm font-medium">{c.message}<textarea name="message" required minLength={10} maxLength={3000} rows={7} placeholder={c.placeholder} className="mt-2 w-full resize-y rounded-xl border border-input bg-input/30 px-3.5 py-3 outline-none placeholder:text-muted-foreground/70 focus:border-primary/50" /></label>
        <label className="absolute left-[-9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <p className="text-xs leading-relaxed text-muted-foreground">{c.privacy}</p>
        {result && <p role="status" className={result === 'success' ? 'rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary' : 'rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'}>{result === 'success' ? c.success : c.error}</p>}
        <button disabled={busy} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? c.sending : c.send}</button>
      </form>
    </main>
  </AppShell>
}
