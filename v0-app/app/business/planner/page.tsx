"use client"

import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { LocalPlanner } from "@/components/business/planner"
import { useI18n } from "@/lib/i18n/provider"
import { getBusinessModulesCopy } from "@/lib/i18n/business-modules-copy"
import Link from "next/link"
import { ArrowUpRight, Sparkles } from "lucide-react"

const PROGRESS_COPY = {
  en: { eyebrow: "TOGETHER, FORWARD", title: "We can make it happen.", body: "One real next step is enough to move your business forward today.", action: "Start your next step" },
  hu: { eyebrow: "EGYÜTT, ELŐRE", title: "Együtt megcsináljuk.", body: "Ma egy valódi következő lépés is elég ahhoz, hogy a vállalkozásod előrébb haladjon.", action: "Következő lépés indítása" },
  de: { eyebrow: "GEMEINSAM VORAN", title: "Wir schaffen das gemeinsam.", body: "Ein echter nächster Schritt genügt, um Ihr Unternehmen heute voranzubringen.", action: "Nächsten Schritt starten" },
  fr: { eyebrow: "ENSEMBLE, EN AVANT", title: "Nous allons y arriver ensemble.", body: "Une vraie prochaine étape suffit pour faire avancer votre activité aujourd’hui.", action: "Démarrer la prochaine étape" },
  es: { eyebrow: "JUNTOS, ADELANTE", title: "Lo conseguiremos juntos.", body: "Un siguiente paso real basta para hacer avanzar tu negocio hoy.", action: "Iniciar el siguiente paso" },
} as const

export default function PlannerPage() {
  const { locale } = useI18n()
  const c = getBusinessModulesCopy(locale)
  const progress = PROGRESS_COPY[locale]
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={c.eyebrow}
          title={c.planner.title}
          subtitle={c.planner.subtitle}
          action={
            <aside className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[.16] via-emerald/[.08] to-violet/[.13] p-5 shadow-[0_22px_52px_-36px_rgba(0,0,0,.9)]">
              <div className="absolute -right-7 -top-7 size-28 rounded-full bg-gold/20 blur-2xl" aria-hidden />
              <div className="absolute -bottom-10 left-10 size-24 rounded-full bg-violet/20 blur-2xl" aria-hidden />
              <div className="relative">
                <div className="flex items-center gap-2 text-gold">
                  <Sparkles className="size-4" aria-hidden />
                  <p className="text-[11px] font-bold uppercase tracking-[.17em]">{progress.eyebrow}</p>
                </div>
                <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground">{progress.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{progress.body}</p>
                <Link href="/business/launch" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-gold">
                  {progress.action}<ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </div>
            </aside>
          }
        />
        <div className="mt-8">
          <LocalPlanner />
        </div>
      </div>
    </AppShell>
  )
}
