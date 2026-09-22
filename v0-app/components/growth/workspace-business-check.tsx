"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Gauge, ShieldCheck, Sparkles } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { calculateBusinessScoreFromWorkspace, type BusinessScoreCategory, type BusinessScoreWorkspaceCustomer, type BusinessScoreWorkspaceDocument, type BusinessScoreWorkspaceTask } from "@/lib/business-score"
import { recordAnalyticsEvent } from "@/components/acquisition/acquisition-attribution"

const COPY = {
  en: {
    eyebrow: "AUTHENTICATED BUSINESS CHECK",
    title: "Check your real workspace data.",
    subtitle: "HEGEVA calculates this score only from the current signed-in workspace. It does not create, change or send anything.",
    loading: "Checking your authenticated workspace data…",
    unavailable: "Your workspace data is not available for a score right now. HEGEVA will not use a browser-only fallback for this check.",
    incomplete: "Not enough supported workspace data yet to calculate a truthful score.",
    incompleteBody: "Add real customers with follow-up dates, invoices or quotes with due dates, and Planner tasks with due dates. HEGEVA will then show only the categories supported by those records.",
    active: "ACTIVE WORKSPACE · REAL DATA",
    score: "HEGEVA Business Score",
    calculation: "How this score is calculated",
    coverage: "Observed categories",
    noDeductions: "No supported deduction is present in this category.",
    boundary: "Aggregate evidence only · no customer names or document references are shown here · no action is executed.",
    categories: { payments: "Payments", sales: "Sales follow-up", customers: "Customer attention", admin: "Admin control" },
    reasons: {
      overdue_invoice: "An invoice is overdue",
      invoice_14_days: "An invoice is 14+ days late",
      invoice_1000_plus: "The recorded overdue invoice total is £1,000+",
      quote_7_days: "An open quote is 7+ days past its recorded due date",
      quote_10_days: "An open quote is 10+ days past its recorded due date",
      quote_500_plus: "Recorded past-due open quote value is £500+",
      customer_followup_due: "A customer follow-up is due",
      overdue_high_priority: "A high-priority Planner task is overdue",
      due_today_unresolved: "A due-today Planner task remains unresolved",
    },
    actions: { customers: "Add customer follow-up", invoices: "Add invoice or quote", planner: "Add Planner task" },
  },
  hu: {
    eyebrow: "HITELESÍTETT ÜZLETI ELLENŐRZÉS",
    title: "Ellenőrizd a valódi munkaterületi adataidat.",
    subtitle: "A HEGEVA ezt a pontszámot csak az aktuálisan bejelentkezett munkaterületből számítja. Nem hoz létre, módosít vagy küld el semmit.",
    loading: "A hitelesített munkaterületi adatok ellenőrzése…",
    unavailable: "A munkaterületi adatok most nem érhetők el pontszámhoz. A HEGEVA ehhez az ellenőrzéshez nem használ böngészőbeli tartalékadatot.",
    incomplete: "Még nincs elég alátámasztott munkaterületi adat a valósághű pontszámhoz.",
    incompleteBody: "Adj hozzá valódi ügyfeleket utánkövetési dátummal, határidős számlákat vagy ajánlatokat, illetve határidős Tervező-feladatokat. A HEGEVA csak az ezek által alátámasztott kategóriákat mutatja.",
    active: "AKTÍV MUNKATERÜLET · VALÓDI ADATOK",
    score: "HEGEVA Üzleti Pontszám",
    calculation: "A pontszám számítása",
    coverage: "Megfigyelt kategóriák",
    noDeductions: "Ebben a kategóriában nincs alátámasztott levonás.",
    boundary: "Csak összesített bizonyíték · itt nincs ügyfélnév vagy dokumentumhivatkozás · nincs végrehajtott művelet.",
    categories: { payments: "Fizetések", sales: "Értékesítési utánkövetés", customers: "Ügyfélfigyelem", admin: "Admin kontroll" },
    reasons: {
      overdue_invoice: "Van lejárt számla",
      invoice_14_days: "Egy számla legalább 14 napja lejárt",
      invoice_1000_plus: "A rögzített lejárt számlák összege legalább £1,000",
      quote_7_days: "Egy nyitott ajánlat 7+ napja túl van a rögzített határidején",
      quote_10_days: "Egy nyitott ajánlat 10+ napja túl van a rögzített határidején",
      quote_500_plus: "A rögzített, lejárt nyitott ajánlatok értéke legalább £500",
      customer_followup_due: "Egy ügyfél-utánkövetés esedékes",
      overdue_high_priority: "Egy magas prioritású Tervező-feladat lejárt",
      due_today_unresolved: "Egy mai Tervező-feladat még nincs lezárva",
    },
    actions: { customers: "Ügyfél-utánkövetés hozzáadása", invoices: "Számla vagy ajánlat hozzáadása", planner: "Tervező-feladat hozzáadása" },
  },
  de: {
    eyebrow: "AUTHENTIFIZIERTER BUSINESS-CHECK",
    title: "Prüfe deine echten Workspace-Daten.",
    subtitle: "HEGEVA berechnet diesen Score nur aus dem aktuell angemeldeten Workspace. Es wird nichts erstellt, geändert oder versendet.",
    loading: "Authentifizierte Workspace-Daten werden geprüft…",
    unavailable: "Deine Workspace-Daten sind momentan nicht für einen Score verfügbar. HEGEVA verwendet dafür keinen Browser-Ersatz.",
    incomplete: "Noch nicht genügend unterstützte Workspace-Daten für einen wahrheitsgemäßen Score.",
    incompleteBody: "Füge echte Kunden mit Nachfassdatum, Rechnungen oder Angebote mit Fälligkeit sowie Planer-Aufgaben mit Fälligkeit hinzu. HEGEVA zeigt dann nur Kategorien, die von diesen Daten gestützt werden.",
    active: "AKTIVER WORKSPACE · ECHTE DATEN",
    score: "HEGEVA Business Score",
    calculation: "So wird dieser Score berechnet",
    coverage: "Beobachtete Kategorien",
    noDeductions: "In dieser Kategorie liegt kein gestützter Abzug vor.",
    boundary: "Nur aggregierte Nachweise · keine Kundennamen oder Dokumentreferenzen · keine Aktion wird ausgeführt.",
    categories: { payments: "Zahlungen", sales: "Vertriebsnachfassung", customers: "Kundenaufmerksamkeit", admin: "Admin-Kontrolle" },
    reasons: {
      overdue_invoice: "Eine Rechnung ist überfällig",
      invoice_14_days: "Eine Rechnung ist 14+ Tage überfällig",
      invoice_1000_plus: "Die erfasste überfällige Rechnungssumme beträgt £1.000+",
      quote_7_days: "Ein offenes Angebot ist 7+ Tage über der erfassten Fälligkeit",
      quote_10_days: "Ein offenes Angebot ist 10+ Tage über der erfassten Fälligkeit",
      quote_500_plus: "Der erfasste Wert überfälliger offener Angebote beträgt £500+",
      customer_followup_due: "Eine Kundennachfassung ist fällig",
      overdue_high_priority: "Eine wichtige Planer-Aufgabe ist überfällig",
      due_today_unresolved: "Eine heutige Planer-Aufgabe ist offen",
    },
    actions: { customers: "Kundennachfassung hinzufügen", invoices: "Rechnung oder Angebot hinzufügen", planner: "Planer-Aufgabe hinzufügen" },
  },
  fr: {
    eyebrow: "BILAN MÉTIER AUTHENTIFIÉ",
    title: "Vérifiez les données réelles de votre espace.",
    subtitle: "HEGEVA calcule ce score uniquement à partir de l’espace actuellement connecté. Rien n’est créé, modifié ou envoyé.",
    loading: "Vérification des données de l’espace authentifié…",
    unavailable: "Les données de votre espace ne sont pas disponibles pour un score actuellement. HEGEVA n’utilise pas de copie de navigateur pour ce bilan.",
    incomplete: "Pas encore assez de données étayées pour calculer un score honnête.",
    incompleteBody: "Ajoutez de vrais clients avec une date de relance, des factures ou devis avec une échéance, et des tâches de planning avec une date. HEGEVA n’affichera alors que les catégories étayées.",
    active: "ESPACE ACTIF · DONNÉES RÉELLES",
    score: "Score Business HEGEVA",
    calculation: "Calcul de ce score",
    coverage: "Catégories observées",
    noDeductions: "Aucune déduction étayée dans cette catégorie.",
    boundary: "Preuves agrégées uniquement · aucun nom de client ni référence de document · aucune action exécutée.",
    categories: { payments: "Paiements", sales: "Suivi commercial", customers: "Attention client", admin: "Contrôle administratif" },
    reasons: {
      overdue_invoice: "Une facture est en retard",
      invoice_14_days: "Une facture a 14+ jours de retard",
      invoice_1000_plus: "Le total enregistré des factures en retard est de £1 000+",
      quote_7_days: "Un devis ouvert dépasse de 7+ jours son échéance enregistrée",
      quote_10_days: "Un devis ouvert dépasse de 10+ jours son échéance enregistrée",
      quote_500_plus: "La valeur enregistrée des devis ouverts en retard est de £500+",
      customer_followup_due: "Une relance client est due",
      overdue_high_priority: "Une tâche de planning prioritaire est en retard",
      due_today_unresolved: "Une tâche de planning due aujourd’hui reste ouverte",
    },
    actions: { customers: "Ajouter une relance client", invoices: "Ajouter une facture ou un devis", planner: "Ajouter une tâche de planning" },
  },
  es: {
    eyebrow: "REVISIÓN EMPRESARIAL AUTENTICADA",
    title: "Revisa los datos reales de tu espacio.",
    subtitle: "HEGEVA calcula esta puntuación solo con el espacio conectado actualmente. No crea, modifica ni envía nada.",
    loading: "Comprobando los datos del espacio autenticado…",
    unavailable: "Los datos de tu espacio no están disponibles para una puntuación ahora. HEGEVA no usa una copia del navegador para esta revisión.",
    incomplete: "Aún no hay suficientes datos respaldados para calcular una puntuación veraz.",
    incompleteBody: "Añade clientes reales con fecha de seguimiento, facturas o presupuestos con vencimiento y tareas del planificador con fecha. HEGEVA mostrará solo las categorías respaldadas por esos datos.",
    active: "ESPACIO ACTIVO · DATOS REALES",
    score: "Puntuación Business HEGEVA",
    calculation: "Cómo se calcula esta puntuación",
    coverage: "Categorías observadas",
    noDeductions: "No hay ninguna deducción respaldada en esta categoría.",
    boundary: "Solo evidencia agregada · sin nombres de clientes ni referencias de documentos · no se ejecuta ninguna acción.",
    categories: { payments: "Pagos", sales: "Seguimiento comercial", customers: "Atención al cliente", admin: "Control administrativo" },
    reasons: {
      overdue_invoice: "Hay una factura vencida",
      invoice_14_days: "Una factura lleva 14+ días vencida",
      invoice_1000_plus: "El total registrado de facturas vencidas es £1.000+",
      quote_7_days: "Un presupuesto abierto supera 7+ días su vencimiento registrado",
      quote_10_days: "Un presupuesto abierto supera 10+ días su vencimiento registrado",
      quote_500_plus: "El valor registrado de presupuestos abiertos vencidos es £500+",
      customer_followup_due: "Hay un seguimiento de cliente pendiente",
      overdue_high_priority: "Una tarea prioritaria del planificador está vencida",
      due_today_unresolved: "Una tarea del planificador para hoy sigue abierta",
    },
    actions: { customers: "Añadir seguimiento de cliente", invoices: "Añadir factura o presupuesto", planner: "Añadir tarea del planificador" },
  },
} as const

const CATEGORY_ORDER: BusinessScoreCategory[] = ["payments", "sales", "customers", "admin"]

export function WorkspaceBusinessCheck() {
  const { locale } = useI18n()
  const { data: session } = useSession()
  const { items: customers, syncState: customerSync } = useWorkspaceData<BusinessScoreWorkspaceCustomer>("customers")
  const { items: invoices, syncState: invoiceSync } = useWorkspaceData<BusinessScoreWorkspaceDocument>("invoice_documents")
  const { items: tasks, syncState: taskSync } = useWorkspaceData<BusinessScoreWorkspaceTask>("planner")
  const [mounted, setMounted] = useState(false)
  const tracked = useRef(false)
  const c = COPY[locale as keyof typeof COPY] ?? COPY.en
  const cloudCustomers = customerSync === "cloud" ? customers : []
  const cloudInvoices = invoiceSync === "cloud" ? invoices : []
  const cloudTasks = taskSync === "cloud" ? tasks : []
  const scoreResult = useMemo(() => calculateBusinessScoreFromWorkspace({
    today: new Date().toISOString().slice(0, 10),
    invoices: cloudInvoices,
    customers: cloudCustomers,
    tasks: cloudTasks,
  }), [cloudCustomers, cloudInvoices, cloudTasks])
  const score = scoreResult.score
  const canRenderScore = scoreResult.state === "ready"
  const waitingForWorkspaceData = !canRenderScore && [customerSync, invoiceSync, taskSync].some((syncState) => syncState === "checking" || syncState === "saving")
  const workspaceUnavailable = !canRenderScore && [customerSync, invoiceSync, taskSync].includes("error")

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted || !session?.user || !canRenderScore || tracked.current) return
    tracked.current = true
    const score = scoreResult.score?.overall ?? 0
    const scoreBand = score < 50 ? "0-49" : score < 75 ? "50-74" : "75-100"
    recordAnalyticsEvent("own_business_result", "/challenge", { score_band: scoreBand, observed_categories: scoreResult.observedCategories.length })
  }, [canRenderScore, mounted, scoreResult, session?.user])

  if (!mounted || !session?.user) return null

  return (
    <section className="mt-8 rounded-3xl border border-primary/30 bg-primary/[.045] p-5 sm:p-7" aria-live="polite">
      <p className="ve-eyebrow text-primary">{c.eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{c.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{c.subtitle}</p>

      {waitingForWorkspaceData && <p className="mt-5 rounded-2xl border border-border bg-background/45 p-4 text-sm text-muted-foreground">{c.loading}</p>}
      {workspaceUnavailable && <p role="alert" className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/[.06] p-4 text-sm text-muted-foreground">{c.unavailable}</p>}

      {!canRenderScore && !waitingForWorkspaceData && !workspaceUnavailable && scoreResult.state === "incomplete" && (
        <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/[.06] p-5">
          <h3 className="font-semibold text-gold">{c.incomplete}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{c.incompleteBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/business/customers" className="inline-flex min-h-10 items-center rounded-xl border border-primary/30 px-3 text-xs font-semibold text-primary">{c.actions.customers}</Link>
            <Link href="/business/invoices" className="inline-flex min-h-10 items-center rounded-xl border border-primary/30 px-3 text-xs font-semibold text-primary">{c.actions.invoices}</Link>
            <Link href="/business/planner" className="inline-flex min-h-10 items-center rounded-xl border border-primary/30 px-3 text-xs font-semibold text-primary">{c.actions.planner}</Link>
          </div>
        </div>
      )}

      {canRenderScore && score && (
        <div className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[.15em] text-primary">{c.active}</p>
              <p className="mt-3 text-sm text-muted-foreground">{c.score}</p>
              <div className="mt-1 flex items-end gap-2"><strong className="font-display text-6xl text-gold">{score.overall}</strong><span className="pb-2 text-lg text-muted-foreground">/100</span></div>
            </div>
            <Gauge className="size-16 text-gold/70" aria-hidden />
          </div>
          <p className="mt-5 text-sm font-semibold">{c.coverage}: {scoreResult.observedCategories.map((category) => c.categories[category]).join(" · ")}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_ORDER.filter((category) => scoreResult.observedCategories.includes(category)).map((category) => (
              <div key={category} className="rounded-2xl border border-border bg-background/45 p-4"><span className="text-xs text-muted-foreground">{c.categories[category]}</span><strong className="mt-1 block text-2xl">{score.categories[category].score}/100</strong></div>
            ))}
          </div>
          <section className="mt-6">
            <h3 className="font-semibold">{c.calculation}</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {scoreResult.observedCategories.map((category) => {
                const deductions = score.categories[category].deductions
                return <article key={category} className="rounded-2xl border border-border bg-background/35 p-4"><div className="flex justify-between gap-3"><strong>{c.categories[category]}</strong><b>{score.categories[category].score}/100</b></div>{deductions.length ? <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{deductions.map((deduction) => <li key={deduction.code} className="flex justify-between gap-4"><span>{c.reasons[deduction.code as keyof typeof c.reasons]}</span><span>-{deduction.points}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{c.noDeductions}</p>}</article>
              })}
            </div>
          </section>
        </div>
      )}

      <p className="mt-6 flex gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />{c.boundary}</p>
    </section>
  )
}
