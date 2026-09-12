"use client"

import Link from 'next/link'
import { ArrowRight, MessageSquare } from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'
import { CONTACT_COPY } from '@/lib/i18n/contact-copy'

export function ContactCta() {
  const { locale } = useI18n()
  const c = CONTACT_COPY[locale]
  return <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
    <div className="glass-panel relative overflow-hidden rounded-3xl p-7 sm:p-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-gold/10" aria-hidden />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-primary"><MessageSquare className="size-4" aria-hidden /><span className="text-xs font-semibold uppercase tracking-[.18em]">HEGEVA AI</span></div>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">{c.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.subtitle}</p>
        </div>
        <Link href="/contact" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{c.send}<ArrowRight className="size-4" aria-hidden /></Link>
      </div>
    </div>
  </section>
}
