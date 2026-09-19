"use client"

import Link from "next/link"
import { ArrowRight, FileText, MessageSquareText, ShieldCheck, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"

type SupportedLocale = "en" | "hu" | "de" | "fr" | "es"

type NicheLandingProps = {
  slug: string
  labels: Record<SupportedLocale, string>
}

const COPY = {
  en: {
    eyebrow: "HEGEVA AI FOR SMALL BUSINESS",
    titleStart: "AI workspace for",
    subtitle: "Keep customers, quotes, invoices and follow-ups in one place — then see what needs attention next.",
    bullets: [
      ["Customers", "Keep customer records and follow-ups organised."],
      ["Quotes", "See open quotes that may need a follow-up."],
      ["Invoices", "Spot overdue invoices and prepare a reminder."],
      ["Next actions", "HEGEVA prepares the next step. You stay in control."],
    ],
    challenge: "TRY THE 60-SECOND CHALLENGE",
    trust: "No signup. No card. Fictional demo data only.",
    second: "See HEGEVA work before connecting your own business.",
    boundary: "Nothing is sent automatically. HEGEVA prepares; you approve.",
  },
  hu: {
    eyebrow: "HEGEVA AI KISVÁLLALKOZÁSOKNAK",
    titleStart: "AI munkatér",
    subtitle: "Ügyfelek, ajánlatok, számlák és utánkövetések egy helyen — majd lásd, mi igényel figyelmet.",
    bullets: [
      ["Ügyfelek", "Tartsd rendszerezve az ügyfélrekordokat és utánkövetéseket."],
      ["Ajánlatok", "Lásd, mely nyitott ajánlatok igényelhetnek utánkövetést."],
      ["Számlák", "Ismerd fel a lejárt számlákat és készíts emlékeztetőt."],
      ["Következő lépések", "A HEGEVA előkészít. Te maradsz irányításban."],
    ],
    challenge: "60 MÁSODPERCES KIHÍVÁS",
    trust: "Nincs regisztráció. Nincs bankkártya. Csak fiktív demóadatok.",
    second: "Nézd meg működés közben, mielőtt a saját vállalkozásodat csatlakoztatod.",
    boundary: "Semmi nem kerül automatikusan elküldésre. A HEGEVA előkészít; te jóváhagyod.",
  },
  de: {
    eyebrow: "HEGEVA AI FÜR KLEINE UNTERNEHMEN",
    titleStart: "AI-Arbeitsbereich für",
    subtitle: "Kunden, Angebote, Rechnungen und Nachfassaktionen an einem Ort — und sofort sehen, was Aufmerksamkeit braucht.",
    bullets: [
      ["Kunden", "Kundendaten und Nachfassaktionen organisiert halten."],
      ["Angebote", "Offene Angebote erkennen, die Nachfassen brauchen."],
      ["Rechnungen", "Überfällige Rechnungen erkennen und Erinnerung vorbereiten."],
      ["Nächste Schritte", "HEGEVA bereitet vor. Sie behalten die Kontrolle."],
    ],
    challenge: "60-SEKUNDEN-CHALLENGE TESTEN",
    trust: "Keine Anmeldung. Keine Karte. Nur fiktive Demodaten.",
    second: "HEGEVA zuerst in Aktion sehen, bevor Sie Ihr eigenes Unternehmen verbinden.",
    boundary: "Nichts wird automatisch gesendet. HEGEVA bereitet vor; Sie genehmigen.",
  },
  fr: {
    eyebrow: "HEGEVA AI POUR PETITES ENTREPRISES",
    titleStart: "Espace IA pour",
    subtitle: "Clients, devis, factures et relances au même endroit — puis voyez ce qui mérite votre attention.",
    bullets: [
      ["Clients", "Gardez les fiches clients et relances organisées."],
      ["Devis", "Repérez les devis ouverts qui nécessitent une relance."],
      ["Factures", "Repérez les factures échues et préparez un rappel."],
      ["Prochaines actions", "HEGEVA prépare. Vous gardez le contrôle."],
    ],
    challenge: "ESSAYER LE DÉFI 60 SECONDES",
    trust: "Sans inscription. Sans carte. Données de démonstration fictives uniquement.",
    second: "Voyez HEGEVA fonctionner avant de connecter votre propre entreprise.",
    boundary: "Rien n’est envoyé automatiquement. HEGEVA prépare ; vous approuvez.",
  },
  es: {
    eyebrow: "HEGEVA AI PARA PEQUEÑAS EMPRESAS",
    titleStart: "Espacio de IA para",
    subtitle: "Clientes, presupuestos, facturas y seguimientos en un solo lugar — y vea qué necesita atención.",
    bullets: [
      ["Clientes", "Mantén organizados los clientes y seguimientos."],
      ["Presupuestos", "Detecta presupuestos abiertos que necesitan seguimiento."],
      ["Facturas", "Detecta facturas vencidas y prepara un recordatorio."],
      ["Siguientes pasos", "HEGEVA prepara. Tú mantienes el control."],
    ],
    challenge: "PROBAR EL RETO DE 60 SEGUNDOS",
    trust: "Sin registro. Sin tarjeta. Solo datos de demostración ficticios.",
    second: "Mira HEGEVA en acción antes de conectar tu propio negocio.",
    boundary: "Nada se envía automáticamente. HEGEVA prepara; tú apruebas.",
  },
} as const

const icons = [Users, MessageSquareText, FileText, ShieldCheck]

export function NicheLanding({ slug, labels }: NicheLandingProps) {
  const { locale } = useI18n()
  const selected = (locale in COPY ? locale : "en") as SupportedLocale
  const c = COPY[selected]
  const label = labels[selected]

  return (
    <main className="mx-auto w-full max-w-[94rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <section className="overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-to-br from-gold/[.09] via-background to-primary/[.045] p-6 shadow-2xl sm:p-9 lg:p-12">
        <p className="ve-eyebrow text-gold">{c.eyebrow}</p>
        <h1 className="mt-4 max-w-5xl font-display text-4xl font-semibold tracking-[-.04em] sm:text-5xl lg:text-7xl">
          {c.titleStart} {label}.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{c.subtitle}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.bullets.map(([title, body], index) => {
            const Icon = icons[index]
            return (
              <article key={title} className="rounded-2xl border border-border bg-background/45 p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-gold/10 text-gold"><Icon className="size-5" aria-hidden /></span>
                <h2 className="mt-4 font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </article>
            )
          })}
        </div>

        <section className="mt-8 rounded-3xl border border-primary/30 bg-primary/[.045] p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{c.second}</h2>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              href="/challenge"
              className="hegeva-primary inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-sm font-bold"
              data-acquisition-event="demo_entry_click"
              data-niche={slug}
            >
              {c.challenge}<ArrowRight className="size-4" aria-hidden />
            </Link>
            <p className="text-sm text-muted-foreground">{c.trust}</p>
          </div>
          <p className="mt-5 text-xs font-medium text-muted-foreground">{c.boundary}</p>
        </section>
      </section>
    </main>
  )
}
