"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, CircleDollarSign, FileCheck2, FileText, ReceiptText, Send, UserRoundPlus } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { getRevenuePathProgress, type RevenuePathCustomer, type RevenuePathDocument } from "@/lib/revenue-path"

const COPY = {
  en: {
    eyebrow: "FIRST REVENUE ENGINE",
    title: "Turn your first customer into your first payment.",
    subtitle: "Every step comes from saved workspace records. Nothing is completed until the business record exists.",
    current: "Your next revenue step",
    allComplete: "First revenue recorded",
    complete: "Complete",
    steps: [
      ["Add a customer", "Create your first customer record", "Open customers"],
      ["Create a quote", "Turn a customer need into a real quote", "Create quote"],
      ["Send the quote", "Move a prepared quote into a live conversation", "Open quotes"],
      ["Get it accepted", "Record a confirmed customer decision", "Review quotes"],
      ["Create the invoice", "Turn accepted work into a billable invoice", "Open invoices"],
      ["Record payment", "Celebrate your first recorded revenue", "Review payments"],
    ],
  },
  hu: {
    eyebrow: "ELSŐ BEVÉTEL MOTOR",
    title: "Vezesd az első ügyfeledet az első fizetésig.",
    subtitle: "Minden lépés mentett munkaterületi rekordból épül fel. Semmi sem kész, amíg a valódi üzleti rekord nem létezik.",
    current: "A következő bevételi lépésed",
    allComplete: "Az első bevétel rögzítve",
    complete: "Kész",
    steps: [
      ["Ügyfél hozzáadása", "Hozd létre az első ügyfélrekordot", "Ügyfelek megnyitása"],
      ["Ajánlat készítése", "Alakíts egy ügyféligényt valódi ajánlattá", "Ajánlat készítése"],
      ["Ajánlat elküldése", "Vidd a kész ajánlatot valódi ügyfélbeszélgetésbe", "Ajánlatok megnyitása"],
      ["Elfogadás rögzítése", "Rögzíts egy megerősített ügyféldöntést", "Ajánlatok áttekintése"],
      ["Számla készítése", "Alakítsd az elfogadott munkát számlává", "Számlák megnyitása"],
      ["Fizetés rögzítése", "Ünnepeld az első rögzített bevételedet", "Fizetések áttekintése"],
    ],
  },
  de: {
    eyebrow: "ERSTER UMSATZMOTOR",
    title: "Vom ersten Kunden zur ersten Zahlung.",
    subtitle: "Jeder Schritt basiert auf gespeicherten Workspace-Daten. Ein Schritt ist erst mit einem echten Geschäftsdatensatz abgeschlossen.",
    current: "Ihr nächster Umsatzschritt",
    allComplete: "Erster Umsatz erfasst",
    complete: "Erledigt",
    steps: [
      ["Kunde hinzufügen", "Ersten Kundendatensatz erstellen", "Kunden öffnen"],
      ["Angebot erstellen", "Kundenbedarf in ein echtes Angebot verwandeln", "Angebot erstellen"],
      ["Angebot senden", "Ein vorbereitetes Angebot in ein echtes Gespräch bringen", "Angebote öffnen"],
      ["Annahme erfassen", "Eine bestätigte Kundenentscheidung erfassen", "Angebote prüfen"],
      ["Rechnung erstellen", "Angenommene Arbeit abrechenbar machen", "Rechnungen öffnen"],
      ["Zahlung erfassen", "Ersten erfassten Umsatz feiern", "Zahlungen prüfen"],
    ],
  },
  fr: {
    eyebrow: "MOTEUR DU PREMIER REVENU",
    title: "Transformez votre premier client en premier paiement.",
    subtitle: "Chaque étape provient des données enregistrées. Rien n’est terminé sans un véritable enregistrement métier.",
    current: "Votre prochaine étape de revenu",
    allComplete: "Premier revenu enregistré",
    complete: "Terminé",
    steps: [
      ["Ajouter un client", "Créer votre premier dossier client", "Ouvrir les clients"],
      ["Créer un devis", "Transformer un besoin client en devis réel", "Créer un devis"],
      ["Envoyer le devis", "Faire passer un devis préparé à une vraie conversation", "Ouvrir les devis"],
      ["Enregistrer l’acceptation", "Enregistrer une décision client confirmée", "Examiner les devis"],
      ["Créer la facture", "Transformer le travail accepté en facture", "Ouvrir les factures"],
      ["Enregistrer le paiement", "Célébrer votre premier revenu enregistré", "Examiner les paiements"],
    ],
  },
  es: {
    eyebrow: "MOTOR DEL PRIMER INGRESO",
    title: "Convierte tu primer cliente en tu primer pago.",
    subtitle: "Cada paso proviene de datos guardados. Nada se completa hasta que exista el registro de negocio real.",
    current: "Tu siguiente paso de ingresos",
    allComplete: "Primer ingreso registrado",
    complete: "Completado",
    steps: [
      ["Añadir cliente", "Crea tu primer registro de cliente", "Abrir clientes"],
      ["Crear presupuesto", "Convierte una necesidad en un presupuesto real", "Crear presupuesto"],
      ["Enviar presupuesto", "Lleva un presupuesto preparado a una conversación real", "Abrir presupuestos"],
      ["Registrar aceptación", "Registra una decisión confirmada del cliente", "Revisar presupuestos"],
      ["Crear factura", "Convierte trabajo aceptado en una factura", "Abrir facturas"],
      ["Registrar pago", "Celebra tu primer ingreso registrado", "Revisar pagos"],
    ],
  },
} as const

const STEP_STYLES = [
  "border-emerald-400/35 bg-emerald-400/[.09] text-emerald-700 dark:text-emerald-300",
  "border-sky-400/35 bg-sky-400/[.09] text-sky-700 dark:text-sky-300",
  "border-violet-400/35 bg-violet-400/[.09] text-violet-700 dark:text-violet-300",
  "border-fuchsia-400/35 bg-fuchsia-400/[.09] text-fuchsia-700 dark:text-fuchsia-300",
  "border-amber-400/40 bg-amber-400/[.11] text-amber-800 dark:text-amber-300",
  "border-rose-400/35 bg-rose-400/[.09] text-rose-700 dark:text-rose-300",
] as const

const STEP_ICONS = [UserRoundPlus, FileText, Send, FileCheck2, ReceiptText, CircleDollarSign] as const
const STEP_HREFS = ["/business/customers", "/business/launch", "/business/invoices", "/business/invoices", "/business/invoices", "/business/invoices"] as const

export function RevenuePath() {
  const { locale } = useI18n()
  const copy = COPY[locale]
  const { items: customers } = useWorkspaceData<RevenuePathCustomer>("customers")
  const { items: documents } = useWorkspaceData<RevenuePathDocument>("invoice_documents")
  const progress = getRevenuePathProgress(customers, documents)
  const counts = [progress.customers, progress.quotes, progress.sentQuotes, progress.acceptedQuotes, progress.invoices, progress.paidInvoices]
  const allStepsComplete = counts.every((count) => count > 0)

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[.13] via-background to-violet-500/[.12] p-5 shadow-[0_24px_70px_-42px_hsl(var(--primary)/.7)] sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ve-eyebrow text-primary">{copy.eyebrow}</p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight">{copy.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{copy.subtitle}</p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-background/65 px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur">
          <span className="text-muted-foreground">{copy.current}: </span>
          <span className="text-primary">{allStepsComplete ? copy.allComplete : copy.steps[progress.nextStep][0]}</span>
        </div>
      </div>

      <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {copy.steps.map(([title, description, action], index) => {
          const Icon = STEP_ICONS[index]
          const complete = counts[index] > 0
          const current = index === progress.nextStep

          return (
            <Link
              key={title}
              href={STEP_HREFS[index]}
              className={`group relative min-h-44 overflow-hidden rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${STEP_STYLES[index]} ${current ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}`}
            >
              <div className="absolute right-0 top-0 size-24 -translate-y-8 translate-x-8 rounded-full bg-current opacity-[.07]" aria-hidden />
              <div className="relative flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-background/70 shadow-sm"><Icon className="size-5" aria-hidden /></span>
                {complete ? <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-300" aria-label={copy.complete} /> : <span className="rounded-full bg-background/65 px-2.5 py-1 text-xs font-bold tabular-nums">{counts[index]}</span>}
              </div>
              <p className="relative mt-5 text-xs font-bold uppercase tracking-[.14em] opacity-75">0{index + 1}</p>
              <h3 className="relative mt-1 text-lg font-semibold">{title}</h3>
              <p className="relative mt-2 text-sm leading-5 text-foreground/75">{description}</p>
              <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-bold">{action}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
