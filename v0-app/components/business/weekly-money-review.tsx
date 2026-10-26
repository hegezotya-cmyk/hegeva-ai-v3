"use client"

import Link from "next/link"
import { ArrowUpRight, CalendarDays, CircleAlert } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { getWeeklyMoneyReviewState, selectWeeklyMoneyReview } from "@/lib/weekly-money-review"
import { useCoreDecision } from "@/lib/use-core-decision"

const copy = {
  en: { eyebrow: "WEEKLY MONEY REVIEW", title: "Your weekly money priorities", subtitle: "The three most valuable reviews from your workspace. Nothing is sent without your approval.", loading: "Preparing your weekly review…", unauthenticated: "Sign in to see your weekly money review.", unavailable: "Your weekly review is temporarily unavailable. Try again shortly.", empty: "No money-related reviews need your attention this week.", open: "Review next step", items: "items", labels: { "overdue-invoices": "Overdue invoices", "stale-quotes": "Quotes awaiting follow-up", "customer-followups": "Customer follow-ups due" } },
  hu: { eyebrow: "HETI PÉNZÜGYI ÁTTEKINTŐ", title: "Heti pénzügyi prioritások", subtitle: "A munkaterületed három legértékesebb felülvizsgálata. Jóváhagyásod nélkül semmi nem kerül elküldésre.", loading: "Heti áttekintő előkészítése…", unauthenticated: "Jelentkezz be a heti pénzügyi áttekintő megtekintéséhez.", unavailable: "A heti áttekintő átmenetileg nem érhető el. Próbáld meg hamarosan újra.", empty: "Ezen a héten nincs figyelmet igénylő pénzügyi áttekintés.", open: "Következő lépés áttekintése", items: "tétel", labels: { "overdue-invoices": "Lejárt számlák", "stale-quotes": "Utánkövetésre váró ajánlatok", "customer-followups": "Esedékes ügyfél-utánkövetések" } },
} as const

export function WeeklyMoneyReview() {
  const { locale } = useI18n()
  const c = copy[locale === "hu" ? "hu" : "en"]
  const core = useCoreDecision()
  const actions = selectWeeklyMoneyReview(core.data)
  const state = getWeeklyMoneyReviewState(core.status, actions)
  return <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"><div className="rounded-3xl border border-border bg-card/65 p-6 shadow-sm sm:p-8"><div className="flex gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarDays className="size-6" /></span><div><p className="ve-eyebrow">{c.eyebrow}</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{c.title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{c.subtitle}</p></div></div>{state !== "ready" && <p className="mt-8 rounded-2xl border border-border bg-background/50 p-5 text-sm text-muted-foreground">{c[state]}</p>}{state === "ready" && <div className="mt-8 space-y-3">{actions.map((action) => <article key={action.id} className="rounded-2xl border border-border bg-background/55 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><h2 className="font-semibold">{c.labels[action.id]}</h2><p className="mt-2 text-sm font-medium">{action.count} {c.items}{action.amount !== undefined ? ` · ${new Intl.NumberFormat(locale, { style: "currency", currency: "GBP" }).format(action.amount)}` : ""}</p></div><Link href={action.href} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">{c.open}<ArrowUpRight className="size-4" /></Link></div></article>)}</div>}<p className="mt-6 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><CircleAlert className="mt-0.5 size-3.5 shrink-0" />{c.subtitle}</p></div></section>
}
