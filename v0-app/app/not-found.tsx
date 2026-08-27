"use client"

import Link from "next/link"
import { Compass, Home, SearchX } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { IntelligenceCard, SignalIcon } from "@/components/visual-engine"
import { useI18n } from "@/lib/i18n/provider"

const copy = {
  en: {
    eyebrow: "HEGEVA navigation",
    title: "This route does not exist",
    body: "The page may have moved, or the address may be incomplete. Return to the Command Center or open the home page.",
    command: "Command Center",
    home: "Home",
  },
  hu: {
    eyebrow: "HEGEVA navigáció",
    title: "Ez az útvonal nem létezik",
    body: "Lehet, hogy az oldal áthelyezésre került, vagy a cím hiányos. Térj vissza a Command Centerbe vagy nyisd meg a főoldalt.",
    command: "Command Center",
    home: "Főoldal",
  },
  de: {
    eyebrow: "HEGEVA Navigation",
    title: "Diese Route existiert nicht",
    body: "Die Seite wurde möglicherweise verschoben oder die Adresse ist unvollständig. Kehren Sie zum Command Center oder zur Startseite zurück.",
    command: "Command Center",
    home: "Startseite",
  },
  fr: {
    eyebrow: "Navigation HEGEVA",
    title: "Cette route n’existe pas",
    body: "La page a peut-être été déplacée ou l’adresse est incomplète. Revenez au Command Center ou à l’accueil.",
    command: "Command Center",
    home: "Accueil",
  },
  es: {
    eyebrow: "Navegación HEGEVA",
    title: "Esta ruta no existe",
    body: "Es posible que la página se haya movido o que la dirección esté incompleta. Vuelve al Command Center o a la página principal.",
    command: "Command Center",
    home: "Inicio",
  },
} as const

export default function NotFound() {
  const { locale } = useI18n()
  const text = copy[locale]

  return (
    <AppShell>
      <main className="mx-auto flex min-h-[65vh] max-w-3xl items-center px-4 py-12 sm:px-6">
        <div className="w-full" role="status" aria-live="polite">
          <IntelligenceCard tone="cyan" className="w-full p-6 sm:p-9">
            <SignalIcon icon={SearchX} tone="cyan" />
            <p className="ve-eyebrow mt-6">{text.eyebrow}</p>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-cyan/80">404 · route unavailable</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{text.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{text.body}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/command-center" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                <Compass className="size-4" aria-hidden />
                {text.command}
              </Link>
              <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-background/35 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-cyan/25 hover:bg-background/55">
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
