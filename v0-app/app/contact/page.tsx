"use client"

import { FormEvent, useState } from 'react'
import { Mail, MessageSquareText, Send, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { AICore, IntelligenceCard, SignalIcon } from '@/components/visual-engine'
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
        body: JSON.stringify({ name: form.get('name'), email: form.get('email'), company: form.get('company'), message: form.get('message'), website: form.get('website'), locale, startedAt }),
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

  const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-background/35 px-3.5 py-3 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-cyan/45 focus:bg-background/55 focus:shadow-[0_0_28px_-14px_var(--cyan)]"

  return <AppShell>
    <main className="relative mx-auto max-w-6xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-cyan/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-44 size-72 rounded-full bg-violet/10 blur-3xl" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="pt-2">
          <div className="mb-5 flex items-center gap-4"><AICore state="active" /><div><p className="ve-eyebrow mb-1">HEGEVA AI · CONTACT</p><p className="text-xs text-muted-foreground">Direct support channel</p></div></div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl"><span className="text-gradient-emerald">{c.title}</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">{c.subtitle}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <IntelligenceCard tone="cyan" className="flex items-start gap-4 p-5"><SignalIcon icon={Mail} tone="cyan" /><div><p className="text-sm font-semibold text-foreground">Secure contact</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Messages are submitted through the HEGEVA contact endpoint.</p></div></IntelligenceCard>
            <IntelligenceCard tone="violet" className="flex items-start gap-4 p-5"><SignalIcon icon={ShieldCheck} tone="violet" /><div><p className="text-sm font-semibold text-foreground">Privacy-aware</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Only the information you submit is sent with the form.</p></div></IntelligenceCard>
          </div>
        </section>

        <IntelligenceCard tone="cyan" className="p-1 sm:p-1.5">
          <form onSubmit={submit} className="rounded-[1.35rem] bg-background/35 p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3"><SignalIcon icon={MessageSquareText} tone="cyan" className="size-10 rounded-xl" /><div><p className="text-sm font-semibold text-foreground">HEGEVA message channel</p><p className="text-xs text-muted-foreground">Send a real enquiry to the team.</p></div></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium">{c.name}<input name="name" required minLength={2} maxLength={100} className={inputClass} /></label>
              <label className="text-sm font-medium">{c.email}<input name="email" type="email" required maxLength={254} className={inputClass} /></label>
            </div>
            <label className="mt-5 block text-sm font-medium">{c.company}<input name="company" maxLength={120} className={inputClass} /></label>
            <label className="mt-5 block text-sm font-medium">{c.message}<textarea name="message" required minLength={10} maxLength={3000} rows={7} placeholder={c.placeholder} className={`${inputClass} resize-y`} /></label>
            <label className="absolute left-[-9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{c.privacy}</p>
            {result && <p role="status" className={result === 'success' ? 'mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary' : 'mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'}>{result === 'success' ? c.success : c.error}</p>}
            <button disabled={busy} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_28px_-12px_var(--primary)] transition hover:brightness-105 disabled:opacity-60"><Send className="size-4" aria-hidden />{busy ? c.sending : c.send}</button>
          </form>
        </IntelligenceCard>
      </div>
    </main>
  </AppShell>
}
