"use client"

import Link from "next/link"
import { ArrowUpRight, Banknote, CircleAlert, FileText, MessageSquareText, ShieldAlert } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { getMoneyTodayState, selectMoneyTodayActions, type MoneyTodayAction } from "@/lib/money-today"
import { useCoreDecision } from "@/lib/use-core-decision"

const copy = {
  en: {
    eyebrow: "TODAY'S MONEY",
    title: "Money actions for today",
    subtitle: "The most valuable follow-ups from your own workspace. Nothing is sent without your approval.",
    loading: "Preparing your money actions…",
    unauthenticated: "Sign in to see your business money actions.",
    unavailable: "Your money actions are temporarily unavailable. Try again shortly.",
    empty: "No money-related follow-ups need your attention today.",
    overdue: "Overdue invoices",
    quotes: "Quotes awaiting follow-up",
    followups: "Customer follow-ups due",
    overdueReason: "Payment is overdue. Prepare a reminder for your approval.",
    quoteReason: "This quote needs a timely follow-up to protect the opportunity.",
    followupReason: "A customer follow-up is due. Review the next step before sending anything.",
    open: "Open next step",
    items: "items",
  },
  hu: {
    eyebrow: "MAI PÉNZÜGYEK",
    title: "Mai pénzügyi teendők",
    subtitle: "A saját munkaterületed legértékesebb utánkövetései. Jóváhagyásod nélkül semmi nem kerül elküldésre.",
    loading: "Pénzügyi teendők előkészítése…",
    unauthenticated: "Jelentkezz be vállalkozásod pénzügyi teendőinek megtekintéséhez.",
    unavailable: "A pénzügyi teendők átmenetileg nem érhetők el. Próbáld meg hamarosan újra.",
    empty: "Ma nincs figyelmet igénylő pénzügyi utánkövetés.",
    overdue: "Lejárt számlák",
    quotes: "Utánkövetésre váró ajánlatok",
    followups: "Esedékes ügyfél-utánkövetések",
    overdueReason: "A fizetés lejárt. Készíts jóváhagyásra váró emlékeztetőt.",
    quoteReason: "Az ajánlatnak időszerű utánkövetésre van szüksége a lehetőség megőrzéséhez.",
    followupReason: "Esedékes az ügyfél-utánkövetés. Küldés előtt tekintsd át a következő lépést.",
    open: "Következő lépés megnyitása",
    items: "tétel",
  },
  de: {
    eyebrow: "GELD HEUTE",
    title: "Heutige Geldaktionen",
    subtitle: "Die wichtigsten Nachfassaktionen aus Ihrem Arbeitsbereich. Ohne Ihre Freigabe wird nichts versendet.",
    loading: "Geldaktionen werden vorbereitet…",
    unauthenticated: "Melden Sie sich an, um Ihre Geldaktionen zu sehen.",
    unavailable: "Ihre Geldaktionen sind vorübergehend nicht verfügbar. Bitte versuchen Sie es gleich erneut.",
    empty: "Heute benötigen keine zahlungsbezogenen Nachfassaktionen Ihre Aufmerksamkeit.",
    overdue: "Überfällige Rechnungen",
    quotes: "Angebote mit Nachfassbedarf",
    followups: "Fällige Kundennachfassungen",
    overdueReason: "Die Zahlung ist überfällig. Bereiten Sie eine Erinnerung zur Freigabe vor.",
    quoteReason: "Dieses Angebot braucht ein zeitnahes Nachfassen, um die Chance zu schützen.",
    followupReason: "Eine Kundennachfassung ist fällig. Prüfen Sie den nächsten Schritt vor dem Versand.",
    open: "Nächsten Schritt öffnen",
    items: "Einträge",
  },
  fr: {
    eyebrow: "ARGENT DU JOUR",
    title: "Actions financières du jour",
    subtitle: "Les relances les plus utiles de votre espace. Rien n’est envoyé sans votre accord.",
    loading: "Préparation des actions financières…",
    unauthenticated: "Connectez-vous pour consulter les actions financières de votre entreprise.",
    unavailable: "Vos actions financières sont temporairement indisponibles. Réessayez bientôt.",
    empty: "Aucune relance financière ne nécessite votre attention aujourd’hui.",
    overdue: "Factures en retard",
    quotes: "Devis à relancer",
    followups: "Relances client à échéance",
    overdueReason: "Le paiement est en retard. Préparez un rappel pour votre accord.",
    quoteReason: "Ce devis nécessite une relance rapide pour protéger l’opportunité.",
    followupReason: "Une relance client est due. Vérifiez l’étape suivante avant tout envoi.",
    open: "Ouvrir l’étape suivante",
    items: "éléments",
  },
  es: {
    eyebrow: "DINERO DE HOY",
    title: "Acciones de dinero para hoy",
    subtitle: "Los seguimientos más valiosos de tu espacio. No se envía nada sin tu aprobación.",
    loading: "Preparando tus acciones de dinero…",
    unauthenticated: "Inicia sesión para ver las acciones de dinero de tu negocio.",
    unavailable: "Tus acciones de dinero no están disponibles temporalmente. Inténtalo de nuevo pronto.",
    empty: "Hoy no hay seguimientos financieros que necesiten tu atención.",
    overdue: "Facturas vencidas",
    quotes: "Presupuestos pendientes de seguimiento",
    followups: "Seguimientos de clientes pendientes",
    overdueReason: "El pago está vencido. Prepara un recordatorio para aprobarlo.",
    quoteReason: "Este presupuesto necesita un seguimiento oportuno para proteger la oportunidad.",
    followupReason: "Hay un seguimiento de cliente pendiente. Revisa el siguiente paso antes de enviar nada.",
    open: "Abrir siguiente paso",
    items: "elementos",
  },
} as const

function actionCopy(action: MoneyTodayAction, locale: keyof typeof copy) {
  const c = copy[locale]
  if (action.id === "overdue-invoices") return { title: c.overdue, reason: c.overdueReason, Icon: ShieldAlert }
  if (action.id === "stale-quotes") return { title: c.quotes, reason: c.quoteReason, Icon: FileText }
  return { title: c.followups, reason: c.followupReason, Icon: MessageSquareText }
}

export function MoneyToday() {
  const { locale } = useI18n()
  const c = copy[locale]
  const core = useCoreDecision()
  const actions = selectMoneyTodayActions(core.data)
  const state = getMoneyTodayState(core.status, actions)

  return <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="rounded-3xl border border-border bg-card/65 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="ve-eyebrow">{c.eyebrow}</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{c.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{c.subtitle}</p></div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Banknote className="size-6" aria-hidden /></span>
      </div>
      {state === "loading" && <p className="mt-8 rounded-2xl border border-border bg-background/50 p-5 text-sm text-muted-foreground">{c.loading}</p>}
      {state === "unauthenticated" && <p className="mt-8 rounded-2xl border border-border bg-background/50 p-5 text-sm text-muted-foreground">{c.unauthenticated}</p>}
      {state === "unavailable" && <p className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-foreground">{c.unavailable}</p>}
      {state === "empty" && <p className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm text-foreground">{c.empty}</p>}
      {state === "ready" && <div className="mt-8 space-y-3">{actions.map((action) => {
        const detail = actionCopy(action, locale)
        return <article key={action.id} className="rounded-2xl border border-border bg-background/55 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><detail.Icon className="size-5" aria-hidden /></span><div className="min-w-0 flex-1"><h2 className="font-semibold">{detail.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{detail.reason}</p><p className="mt-2 text-sm font-medium">{action.count} {c.items}{action.amount !== undefined ? ` · ${new Intl.NumberFormat(locale, { style: "currency", currency: "GBP" }).format(action.amount)}` : ""}</p></div><Link href={action.href} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">{c.open}<ArrowUpRight className="size-4" aria-hidden /></Link></div></article>
      })}</div>}
      <Link href="/business/weekly-review" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">{locale === "hu" ? "Heti pénzügyi áttekintő" : "Weekly money review"}<ArrowUpRight className="size-4" aria-hidden /></Link>
      <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />{c.subtitle}</p>
    </div>
  </section>
}
