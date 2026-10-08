"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
} from "lucide-react"
import {
  buildAshnaDailyBrief,
  type AshnaDailyBrief,
} from "@/lib/ashna-daily-brief"
import type { HegevaCoreSignals } from "@/lib/hegeva-core"

type Locale = "en" | "hu" | "de" | "fr" | "es"

const copy = {
  en: {
    eyebrow: "Ashna · HEGEVA Core",
    title: "Daily brief",
    subtitle: "A read-only view of the real workspace signals Ashna is using today.",
    focus: "Today's focus",
    risks: "Risks to review",
    approvals: "Awaiting your approval",
    actions: "Prepared next actions",
    why: "Why this now",
    none: "No urgent risk is visible in the current workspace records.",
    approvalNone: "No prepared follow-ups are awaiting review.",
    actionNote: "Ashna prepares recommendations only. Any external action still needs your approval.",
    open: "Open",
  },
  hu: {
    eyebrow: "Ashna · HEGEVA Core",
    title: "Napi összefoglaló",
    subtitle: "Olvasási nézet Ashna mai, valós munkaterületi jeleiről.",
    focus: "Mai fókusz",
    risks: "Áttekintendő kockázatok",
    approvals: "Jóváhagyásodra vár",
    actions: "Előkészített következő lépések",
    why: "Miért ez a következő lépés?",
    none: "A jelenlegi munkaterületi rekordokban nincs látható sürgős kockázat.",
    approvalNone: "Nincs átnézésre váró előkészített utánkövetés.",
    actionNote: "Ashna csak javaslatokat készít elő. Minden külső művelethez továbbra is jóváhagyás kell.",
    open: "Megnyitás",
  },
  de: {
    eyebrow: "Ashna · HEGEVA Core",
    title: "Tagesübersicht",
    subtitle: "Schreibgeschützte Ansicht der echten Workspace-Signale, die Ashna heute nutzt.",
    focus: "Heutiger Fokus",
    risks: "Zu prüfende Risiken",
    approvals: "Warten auf Ihre Freigabe",
    actions: "Vorbereitete nächste Schritte",
    why: "Warum jetzt?",
    none: "In den aktuellen Workspace-Daten ist kein dringendes Risiko sichtbar.",
    approvalNone: "Keine vorbereiteten Nachfassungen warten auf Prüfung.",
    actionNote: "Ashna bereitet nur Empfehlungen vor. Jede externe Aktion braucht weiterhin Ihre Freigabe.",
    open: "Öffnen",
  },
  fr: {
    eyebrow: "Ashna · HEGEVA Core",
    title: "Brief quotidien",
    subtitle: "Vue en lecture seule des signaux réels utilisés aujourd’hui par Ashna.",
    focus: "Priorité du jour",
    risks: "Risques à examiner",
    approvals: "En attente de votre approbation",
    actions: "Prochaines actions préparées",
    why: "Pourquoi maintenant ?",
    none: "Aucun risque urgent n’est visible dans les données actuelles de l’espace.",
    approvalNone: "Aucun suivi préparé n’attend d’examen.",
    actionNote: "Ashna prépare uniquement des recommandations. Toute action externe requiert toujours votre approbation.",
    open: "Ouvrir",
  },
  es: {
    eyebrow: "Ashna · HEGEVA Core",
    title: "Resumen diario",
    subtitle: "Vista de solo lectura de las señales reales del espacio que Ashna utiliza hoy.",
    focus: "Prioridad de hoy",
    risks: "Riesgos que revisar",
    approvals: "Esperando tu aprobación",
    actions: "Próximas acciones preparadas",
    why: "¿Por qué ahora?",
    none: "No hay ningún riesgo urgente visible en los datos actuales del espacio.",
    approvalNone: "No hay seguimientos preparados pendientes de revisión.",
    actionNote: "Ashna solo prepara recomendaciones. Toda acción externa sigue requiriendo tu aprobación.",
    open: "Abrir",
  },
} as const

const priorityCopy: Record<Locale, Record<AshnaDailyBrief["primary"]["kind"], (count: number) => string>> = {
  en: {
    "complete-followups": (count) => `${count} approved follow-up${count === 1 ? "" : "s"} can be completed.`,
    "review-followups": (count) => `${count} customer follow-up${count === 1 ? "" : "s"} need your review.`,
    "overdue-invoices": (count) => `${count} overdue invoice${count === 1 ? "" : "s"} need attention.`,
    "customer-followups": (count) => `${count} customer follow-up${count === 1 ? "" : "s"} are due.`,
    "stale-quotes": (count) => `${count} quote${count === 1 ? "" : "s"} need follow-up.`,
    "overdue-tasks": (count) => `${count} task${count === 1 ? "" : "s"} are overdue.`,
    "today-tasks": (count) => `${count} task${count === 1 ? "" : "s"} are due today.`,
    "draft-invoices": (count) => `${count} draft invoice${count === 1 ? "" : "s"} are ready to review.`,
    clear: () => "Your current records show no urgent payment or task risk.",
    start: () => "Add your first customer, task or invoice to build today's operating picture.",
  },
  hu: {
    "complete-followups": (count) => `${count} jóváhagyott utánkövetés lezárható.`,
    "review-followups": (count) => `${count} ügyfél-utánkövetés vár átnézésre.`,
    "overdue-invoices": (count) => `${count} lejárt számla igényel figyelmet.`,
    "customer-followups": (count) => `${count} ügyfél-utánkövetés esedékes.`,
    "stale-quotes": (count) => `${count} ajánlat igényel utánkövetést.`,
    "overdue-tasks": (count) => `${count} feladat lejárt.`,
    "today-tasks": (count) => `${count} feladat ma esedékes.`,
    "draft-invoices": (count) => `${count} számlavázlat készen áll az átnézésre.`,
    clear: () => "A jelenlegi rekordokban nincs sürgős fizetési vagy feladatkockázat.",
    start: () => "Adj hozzá ügyfelet, feladatot vagy számlát a mai működési kép felépítéséhez.",
  },
  de: {
    "complete-followups": (count) => `${count} freigegebene Nachfassung${count === 1 ? "" : "en"} kann abgeschlossen werden.`,
    "review-followups": (count) => `${count} Kundennachfassung${count === 1 ? "" : "en"} braucht Ihre Prüfung.`,
    "overdue-invoices": (count) => `${count} überfällige Rechnung${count === 1 ? "" : "en"} braucht Aufmerksamkeit.`,
    "customer-followups": (count) => `${count} Kundennachfassung${count === 1 ? "" : "en"} ist fällig.`,
    "stale-quotes": (count) => `${count} Angebot${count === 1 ? "" : "e"} braucht Nachfassung.`,
    "overdue-tasks": (count) => `${count} Aufgabe${count === 1 ? "" : "n"} ist überfällig.`,
    "today-tasks": (count) => `${count} Aufgabe${count === 1 ? "" : "n"} ist heute fällig.`,
    "draft-invoices": (count) => `${count} Rechnungsentwurf${count === 1 ? "" : "e"} ist bereit zur Prüfung.`,
    clear: () => "Die aktuellen Daten zeigen kein dringendes Zahlungs- oder Aufgabenrisiko.",
    start: () => "Fügen Sie Kunde, Aufgabe oder Rechnung hinzu, um das heutige Betriebsbild zu erstellen.",
  },
  fr: {
    "complete-followups": (count) => `${count} suivi${count === 1 ? "" : "s"} approuvé${count === 1 ? "" : "s"} peut être terminé.`,
    "review-followups": (count) => `${count} suivi${count === 1 ? "" : "s"} client${count === 1 ? "" : "s"} attend${count === 1 ? "" : "ent"} votre examen.`,
    "overdue-invoices": (count) => `${count} facture${count === 1 ? "" : "s"} en retard nécessite${count === 1 ? "" : "nt"} votre attention.`,
    "customer-followups": (count) => `${count} suivi${count === 1 ? "" : "s"} client${count === 1 ? "" : "s"} est${count === 1 ? "" : " sont"} dû.`,
    "stale-quotes": (count) => `${count} devis nécessite${count === 1 ? "" : "nt"} un suivi.`,
    "overdue-tasks": (count) => `${count} tâche${count === 1 ? "" : "s"} est${count === 1 ? "" : " sont"} en retard.`,
    "today-tasks": (count) => `${count} tâche${count === 1 ? "" : "s"} est${count === 1 ? "" : " sont"} due${count === 1 ? "" : "s"} aujourd’hui.`,
    "draft-invoices": (count) => `${count} brouillon${count === 1 ? "" : "s"} de facture est prêt à être examiné.`,
    clear: () => "Les données actuelles ne montrent aucun risque urgent de paiement ou de tâche.",
    start: () => "Ajoutez un client, une tâche ou une facture pour créer la vue opérationnelle du jour.",
  },
  es: {
    "complete-followups": (count) => `${count} seguimiento${count === 1 ? "" : "s"} aprobado${count === 1 ? "" : "s"} puede completarse.`,
    "review-followups": (count) => `${count} seguimiento${count === 1 ? "" : "s"} de cliente necesita${count === 1 ? "" : "n"} revisión.`,
    "overdue-invoices": (count) => `${count} factura${count === 1 ? "" : "s"} vencida${count === 1 ? "" : "s"} requiere${count === 1 ? "" : "n"} atención.`,
    "customer-followups": (count) => `${count} seguimiento${count === 1 ? "" : "s"} de cliente está${count === 1 ? "" : "n"} pendiente${count === 1 ? "" : "s"}.`,
    "stale-quotes": (count) => `${count} presupuesto${count === 1 ? "" : "s"} necesita${count === 1 ? "" : "n"} seguimiento.`,
    "overdue-tasks": (count) => `${count} tarea${count === 1 ? "" : "s"} está${count === 1 ? "" : "n"} vencida${count === 1 ? "" : "s"}.`,
    "today-tasks": (count) => `${count} tarea${count === 1 ? "" : "s"} vence${count === 1 ? "" : "n"} hoy.`,
    "draft-invoices": (count) => `${count} borrador${count === 1 ? "" : "es"} de factura está listo para revisar.`,
    clear: () => "Los datos actuales no muestran ningún riesgo urgente de pago o tarea.",
    start: () => "Añade un cliente, una tarea o una factura para crear la vista operativa de hoy.",
  },
}

function PriorityRow({
  priority,
  locale,
  actionLabel,
}: {
  priority: AshnaDailyBrief["primary"]
  locale: Locale
  actionLabel: string
}) {
  return (
    <Link
      href={priority.href}
      className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-background/50 p-3 text-sm transition-colors hover:border-primary/40"
    >
      {priority.severity === "attention" ? (
        <AlertTriangle className="size-4 shrink-0 text-amber-400" aria-hidden />
      ) : (
        <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
      )}
      <span className="flex-1">{priorityCopy[locale][priority.kind](priority.count)}</span>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
        {actionLabel}
        <ArrowUpRight className="size-3.5" aria-hidden />
      </span>
    </Link>
  )
}

export function AshnaDailyBrief({
  locale,
  signals,
}: {
  locale: Locale
  signals: HegevaCoreSignals
}) {
  const t = copy[locale]
  const brief = buildAshnaDailyBrief(signals)

  return (
    <section className="v4-surface mt-6 border-y border-border px-4 py-6 sm:px-6" aria-labelledby="ashna-daily-brief-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ve-eyebrow">{t.eyebrow}</p>
          <h2 id="ashna-daily-brief-title" className="mt-1 font-display text-2xl font-semibold">{t.title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Sparkles className="size-6 text-primary" aria-hidden />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-primary/30 bg-primary/[.06] p-4">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{t.focus}</p>
          <p className="mt-3 text-sm leading-6">{priorityCopy[locale][brief.primary.kind](brief.primary.count)}</p>
          <p className="mt-4 text-xs text-muted-foreground">{t.why}</p>
          <Link href={brief.primary.href} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">
            {t.open}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </article>

        <article className="rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-400" aria-hidden />
            <h3 className="font-semibold">{t.risks}</h3>
          </div>
          <div className="mt-3 space-y-2">
            {brief.risks.length ? brief.risks.slice(0, 3).map((priority) => (
              <PriorityRow key={priority.kind} priority={priority} locale={locale} actionLabel={t.open} />
            )) : <p className="text-sm text-muted-foreground">{t.none}</p>}
          </div>
        </article>

        <article className="rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-primary" aria-hidden />
            <h3 className="font-semibold">{t.approvals}</h3>
          </div>
          <div className="mt-3 space-y-2">
            {brief.approvals.length ? brief.approvals.map((priority) => (
              <PriorityRow key={priority.kind} priority={priority} locale={locale} actionLabel={t.open} />
            )) : <p className="text-sm text-muted-foreground">{t.approvalNone}</p>}
          </div>
        </article>
      </div>

      {brief.preparedActions.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-background/40 p-4">
          <p className="text-sm font-semibold">{t.actions}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {brief.preparedActions.slice(0, 3).map((priority) => (
              <Link key={priority.kind} href={priority.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary/40">
                {priorityCopy[locale][priority.kind](priority.count)}
                <ArrowUpRight className="size-3.5 text-primary" aria-hidden />
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t.actionNote}</p>
        </div>
      )}
    </section>
  )
}
