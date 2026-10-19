"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, ShieldCheck } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { FIRST_CUSTOMER_COPY } from "@/lib/i18n/first-customer-copy"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { trackActivationEvent } from "@/lib/conversion-tracking"
import { activationIdentity } from "@/lib/activation-measurement"
import { FirstWowQuickStart } from "@/components/get-started/first-wow"

type WorkspaceItem = { id: string }
type WorkspaceDocument = { id: string; type: "invoice" | "quote"; status?: string }

export default function GetStartedPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const { locale } = useI18n()
  const c = FIRST_CUSTOMER_COPY[locale]
  const { items: customers } = useWorkspaceData<WorkspaceItem>("customers")
  const { items: documents } = useWorkspaceData<WorkspaceDocument>("invoice_documents")
  const quotes = documents.filter((item) => item.type === "quote")
  const sentQuotes = quotes.filter((item) => ["sent", "accepted", "invoiced"].includes(item.status || "draft"))
  const hasBusinessRecord = customers.length > 0 || documents.length > 0
  const completedSteps = [customers.length > 0, quotes.length > 0, sentQuotes.length > 0]
  const nextStepIndex = completedSteps.findIndex((complete) => !complete)
  const nextStep = nextStepIndex >= 0 ? c.steps[nextStepIndex] : null
  const completedCount = completedSteps.filter(Boolean).length
  const isReady = nextStep === null

  useEffect(() => {
    if (session?.user) trackActivationEvent("get_started_viewed", "/get-started", activationIdentity(session.user.id))
    if (!isPending && !session?.user) router.replace("/login?mode=register&callbackURL=%2Fget-started")
  }, [isPending, router, session?.user])

  if (isPending || !session?.user) return null

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="mb-3 text-sm font-medium text-primary">HEGEVA AI</p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          {c.title}
        </h1>

        <p className="mt-4 max-w-3xl text-muted-foreground">{c.subtitle}</p>

        {!hasBusinessRecord && <FirstWowQuickStart />}

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
        ) : nextStep && (
          <section className="mt-10" aria-labelledby="next-onboarding-step">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="ve-eyebrow">{c.eyebrow}</p>
              <strong className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary">{completedCount}/{c.steps.length}</strong>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" aria-label={`${completedCount}/${c.steps.length}`}>
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completedCount / c.steps.length * 100}%` }} />
            </div>
            <article className="glass-panel mt-5 flex min-w-0 flex-col rounded-2xl p-6 sm:p-8">
              <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{nextStepIndex + 1}</span>
              <h2 id="next-onboarding-step" className="mt-5 text-2xl font-semibold">{nextStep.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{nextStep.body}</p>
              <Link href={nextStep.href} className="mt-5 inline-flex min-h-11 w-fit items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                {nextStep.action}
              </Link>
            </article>
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
