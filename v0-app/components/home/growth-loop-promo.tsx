"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/provider"

const COPY = {
  en: { business: "Start your business", workflows: "Explore HEGEVA workflows for your business", built: "Built for UK small businesses", links: ["Customers", "→ Quotes", "→ Follow-ups", "→ Invoices", "→ Payments"] },
  hu: { business: "Indítsd el vállalkozásod", workflows: "Fedezd fel a HEGEVA munkafolyamatait vállalkozásodhoz", built: "UK-beli kisvállalkozásokhoz készült", links: ["Ügyfelek", "→ Ajánlatok", "→ Utánkövetések", "→ Számlák", "→ Fizetések"] },
  de: { business: "Unternehmen starten", workflows: "HEGEVA-Abläufe für Ihr Unternehmen entdecken", built: "Für britische Kleinunternehmen entwickelt", links: ["Kunden", "→ Angebote", "→ Nachfassaktionen", "→ Rechnungen", "→ Zahlungen"] },
  fr: { business: "Démarrer votre entreprise", workflows: "Explorer les flux HEGEVA pour votre entreprise", built: "Conçu pour les petites entreprises britanniques", links: ["Clients", "→ Devis", "→ Relances", "→ Factures", "→ Paiements"] },
  es: { business: "Inicia tu negocio", workflows: "Explora los flujos de HEGEVA para tu negocio", built: "Creado para pequeñas empresas del Reino Unido", links: ["Clientes", "→ Presupuestos", "→ Seguimientos", "→ Facturas", "→ Pagos"] },
} as const

type ChallengeEntry = { href: string; kicker: string; title: string; body: string; start: string }

export function GrowthLoopPromo({ challengeEntry }: { challengeEntry: Record<string, ChallengeEntry> }) {
  const { locale } = useI18n()
  const c = COPY[locale as keyof typeof COPY] ?? COPY.en
  const entry = challengeEntry[locale] ?? challengeEntry.en
  return <>
    <section className="mx-auto max-w-[94rem] px-4 pb-10 sm:px-6 lg:px-10" aria-labelledby="hegeva-demo-title"><div className="rounded-3xl border border-gold/25 bg-gold/[.04] p-6 sm:p-8"><p className="ve-eyebrow text-gold">{entry.kicker}</p><h2 id="hegeva-demo-title" className="mt-2 font-display text-3xl font-semibold">{entry.title}</h2><p className="mt-3 max-w-2xl text-muted-foreground">{entry.body}</p><div className="mt-5 flex flex-wrap gap-2 text-sm text-muted-foreground">{c.links.map((link) => <span key={link}>{link}</span>)}</div><div className="mt-6 flex flex-wrap gap-3"><Link data-acquisition-event="demo_entry_click" data-demo-analytics="entry" href={entry.href} className="hegeva-primary inline-flex min-h-11 items-center rounded-xl px-5 py-2 font-semibold">{entry.start}</Link><Link href="/get-started" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 py-2 font-semibold">{c.business}</Link></div></div></section>
    <section className="mx-auto max-w-[94rem] px-4 pb-16 sm:px-6 lg:px-10" aria-labelledby="uk-business-links-title"><div className="rounded-2xl border border-border bg-card/50 px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-8"><div><p className="section-kicker">{c.built}</p><h2 id="uk-business-links-title" className="mt-1 font-display text-xl font-semibold text-foreground">{c.workflows}</h2></div><nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm sm:mt-0" aria-label={c.workflows}><Link href="/ai-for-small-business" className="text-primary hover:underline">AI for small businesses</Link><Link href="/ai-for-trades" className="text-primary hover:underline">AI for trades</Link><Link href="/ai-for-electricians" className="text-primary hover:underline">AI for electricians</Link><Link href="/quote-and-invoice-software" className="text-primary hover:underline">Quote &amp; invoice software</Link><Link href="/ai-business-assistant" className="text-primary hover:underline">Business AI assistant</Link></nav></div></section>
  </>
}
