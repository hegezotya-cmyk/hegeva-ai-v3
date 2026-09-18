import { AppShell } from "@/components/app-shell"
import { Hero } from "@/components/home/hero"
import { ContactCta } from "@/components/home/contact-cta"
import { FlagshipSections } from "@/components/home/flagship-sections"
import { OutcomeLauncher } from "@/components/outcome-launcher"
import Link from "next/link"
import { AcquisitionAttribution } from "@/components/acquisition/acquisition-attribution"

export default function HomePage() {
  return (
    <AppShell>
      <AcquisitionAttribution path="/" />
      <Hero />
      <OutcomeLauncher />
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="rounded-3xl border border-gold/25 bg-gold/[.04] p-6 sm:p-8"><p className="ve-eyebrow text-gold">SEE HEGEVA AT WORK</p><h2 className="mt-2 font-display text-3xl font-semibold">Explore HEGEVA with a business like yours.</h2><p className="mt-3 max-w-2xl text-muted-foreground">Choose an example workflow using clearly labelled fictional sample data.</p><div className="mt-5 flex flex-wrap gap-2 text-sm text-muted-foreground"><span>Customers</span><span>→ Quotes</span><span>→ Follow-ups</span><span>→ Invoices</span><span>→ Payments</span></div><div className="mt-6 flex flex-wrap gap-3"><Link data-acquisition-event="demo_entry_click" data-demo-analytics="entry" href="/demo" className="hegeva-primary inline-flex min-h-11 items-center rounded-xl px-5 py-2 font-semibold">Explore demo</Link><Link href="/get-started" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 py-2 font-semibold">Start your business</Link></div></div></section>
      <FlagshipSections />
      <ContactCta />
    </AppShell>
  )
}
