"use client"

import Link from "next/link"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"
import { useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { IntelligenceCard, SignalIcon } from "@/components/visual-engine"
import { useI18n } from "@/lib/i18n/provider"

const copy = {
  en: {
    eyebrow: "HEGEVA system notice",
    title: "This workspace could not finish loading",
    body: "Your saved data has not been changed. Retry the current view, or return to the Command Center.",
    retry: "Retry",
    home: "Command Center",
    reference: "Reference",
  },
  hu: {
    eyebrow: "HEGEVA rendszerüzenet",
    title: "A munkaterület betöltése nem fejeződött be",
    body: "A mentett adataid nem változtak meg. Próbáld újra ezt a nézetet, vagy térj vissza a Command Centerbe.",
    retry: "Újrapróbálás",
    home: "Command Center",
    reference: "Hivatkozás",
  },
  de: {
    eyebrow: "HEGEVA Systemhinweis",
    title: "Dieser Arbeitsbereich konnte nicht vollständig geladen werden",
    body: "Ihre gespeicherten Daten wurden nicht verändert. Versuchen Sie die Ansicht erneut oder kehren Sie zum Command Center zurück.",
    retry: "Erneut versuchen",
    home: "Command Center",
    reference: "Referenz",
  },
  fr: {
    eyebrow: "Avis système HEGEVA",
    title: "Cet espace n’a pas pu terminer son chargement",
    body: "Vos données enregistrées n’ont pas été modifiées. Réessayez cette vue ou revenez au Command Center.",
    retry: "Réessayer",
    home: "Command Center",
    reference: "Référence",
  },
  es: {
    eyebrow: "Aviso del sistema HEGEVA",
    title: "Este espacio no pudo terminar de cargarse",
    body: "Tus datos guardados no se han modificado. Vuelve a intentar esta vista o regresa al Command Center.",
    retry: "Reintentar",
    home: "Command Center",
    reference: "Referencia",
  },
} as const

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useI18n()
  const text = copy[locale]

  useEffect(() => {
    console.error("HEGEVA application error", error)
  }, [error])

  return (
    <AppShell>
      <main className="mx-auto flex min-h-[65vh] max-w-3xl items-center px-4 py-12 sm:px-6">
        <div className="w-full" role="alert" aria-live="assertive">
          <IntelligenceCard tone="gold" className="w-full p-6 sm:p-9">
            <SignalIcon icon={AlertTriangle} tone="gold" />
            <p className="ve-eyebrow mt-6">{text.eyebrow}</p>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.04em]">{text.title}</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{text.body}</p>
            {error.digest && <p className="mt-3 text-xs text-muted-foreground">{text.reference}: {error.digest}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                <RotateCcw className="size-4" aria-hidden />
                {text.retry}
              </button>
              <Link href="/command-center" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-background/35 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/25 hover:bg-background/55">
                <Home className="size-4" aria-hidden />
                {text.home}
              </Link>
            </div>
          </IntelligenceCard>
        </div>
      </main>
    </AppShell>
  )
}
