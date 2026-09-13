"use client"

import Link from "next/link"
import { Check, Circle, ShieldCheck } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { useI18n } from "@/lib/i18n/provider"
import { FIRST_CUSTOMER_COPY } from "@/lib/i18n/first-customer-copy"
import { useWorkspaceData } from "@/lib/use-workspace-data"

type WorkspaceItem = { id: string }

export default function GetStartedPage() {
  const { locale } = useI18n()
  const c = FIRST_CUSTOMER_COPY[locale]
  const { items: customers } = useWorkspaceData<WorkspaceItem>("customers")
  const { items: invoices } = useWorkspaceData<WorkspaceItem>("invoice_documents")
  const { items: businessProfiles } = useWorkspaceData<WorkspaceItem>("business_profile")
  const { items: goals } = useWorkspaceData<WorkspaceItem>("goal_mode")
  const hasBusinessRecord = customers.length > 0 || invoices.length > 0 || businessProfiles.length > 0
  const incompleteSteps = c.steps.filter((_, index) => index === 0 ? !hasBusinessRecord : index === 1 ? goals.length === 0 : invoices.length === 0)
  const isReady = incompleteSteps.length === 0

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="mb-3 text-sm font-medium text-primary">HEGEVA AI</p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          {c.title}
        </h1>

        <p className="mt-4 max-w-3xl text-muted-foreground">{c.subtitle}</p>

        {isReady ? (
          <section className="mt-10 rounded-3xl border border-primary/25 bg-primary/[.05] p-6 sm:p-8">
            <div className="flex gap-4">
              <ShieldCheck className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="text-xl font-semibold">{c.readyTitle}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{c.readyBody}</p>
                <Link href="/command-center" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  {c.openCore}
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-10">
            <p className="ve-eyebrow">{c.eyebrow}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {incompleteSteps.map((step) => (
                <article key={step.href} className="glass-panel flex min-w-0 flex-col rounded-2xl p-6">
                  <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary"><Circle className="size-4" aria-hidden /></span>
                  <h2 className="mt-5 text-lg font-semibold">{step.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{step.body}</p>
                  <Link href={step.href} className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
                    {step.action}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 grid gap-6 rounded-3xl border border-border bg-card/30 p-6 sm:p-8 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="ve-eyebrow">{c.loopTitle}</p>
            <p className="mt-3 text-lg font-semibold leading-7">{c.loopBody}</p>
            <Link href="/command-center" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-primary/30 px-4 py-2 text-sm font-semibold text-primary">
              {c.openCore}
            </Link>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{c.proofTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.proofBody}</p>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              {c.proofItems.map((item) => <li key={item} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{item}</li>)}
            </ul>
            <p className="mt-5 text-xs font-medium text-muted-foreground">{c.boundary}</p>
          </div>
        </section>
      </main>
    </AppShell>
  )
}
