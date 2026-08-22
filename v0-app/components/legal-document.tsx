"use client"

import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/provider"
import { LEGAL_COPY } from "@/lib/i18n/legal-copy"

export function LegalDocument({ type }: { type: "privacy" | "terms" }) {
  const { locale } = useI18n()
  const copy = LEGAL_COPY[locale][type]
  return <AppShell>
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.intro} />
      <article className="glass-panel mt-8 rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{copy.updated}</p>
        <div className="mt-7 space-y-7">
          {copy.sections.map((section) => <section key={section.title}>
            <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.body}</p>
          </section>)}
        </div>
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm leading-7 text-muted-foreground">{copy.contact}</p>
          <Link href="/contact" className="mt-4 inline-flex rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15">HEGEVA Contact</Link>
        </div>
      </article>
    </main>
  </AppShell>
}
