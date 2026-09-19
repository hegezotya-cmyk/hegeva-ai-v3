"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, CheckCircle2, Clock3, FileText, Gauge, ShieldCheck, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { calculateBusinessScore, DEMO_SCORE_SIGNALS } from "@/lib/business-score"
import { recordAnalyticsEvent, saveDemoRegistrationContext } from "@/components/acquisition/acquisition-attribution"

type Stage = "intro" | "select" | "analysing" | "results"
type BusinessType = "electrician" | "builder" | "plumber" | "cleaner" | "property_maintenance" | "consultant" | "show_me"

const PROFILES: Record<BusinessType, { name: string; city: string; sector: string }> = {
  electrician: { name: "Northside Electrical Services", city: "Manchester, UK", sector: "Electrician" },
  builder: { name: "Stonebridge Building Services", city: "Birmingham, UK", sector: "Builder" },
  plumber: { name: "Northgate Plumbing Services", city: "Manchester, UK", sector: "Plumber" },
  cleaner: { name: "Crystal Clean UK", city: "Leeds, UK", sector: "Cleaning Services" },
  property_maintenance: { name: "PrimeCare Property Maintenance", city: "Stoke-on-Trent, UK", sector: "Property Maintenance" },
  consultant: { name: "Axis Business Consulting", city: "London, UK", sector: "Consultant" },
  show_me: { name: "Northside Electrical Services", city: "Manchester, UK", sector: "Example Small Business" },
}

const COPY = {
  en: {
    kicker: "HEGEVA 60-SECOND CHALLENGE",
    title: "Give HEGEVA 60 seconds.",
    subtitle: "See what your business could be missing — using clearly labelled fictional demo data.",
    start: "START FREE DEMO",
    trust: "No signup. No card. Nothing sent without your approval.",
    choose: "What kind of business should HEGEVA show you?",
    analysing: "HEGEVA is checking payments, quotes, customers and workload…",
    found: "I found 3 things worth your attention today.",
    demo: "DEMO BUSINESS — FICTIONAL DATA",
    attention: "£2,050 currently needs attention",
    p1t: "Recover £1,200 overdue payment",
    p1b: "Sarah Collins · invoice INV-1042 · 18 days overdue",
    p2t: "Protect £850 potential revenue",
    p2b: "Oak & Stone Property Ltd · quote QUO-1081 · no follow-up for 12 days",
    p3t: "Re-engage a returning customer",
    p3b: "Daniel Wright · 4 past jobs · inactive for 31 days",
    prepare: "PREPARE ACTION",
    prepared: "Prepared only. Nothing has been sent.",
    reminder: "Hi Sarah, just a quick reminder that invoice INV-1042 for £1,200 is now overdue. Please let me know if you need another copy of the invoice or have any questions.",
    scoreTitle: "HEGEVA Business Score",
    scoreIntro: "A transparent product heuristic based on the signals shown in this fictional demo.",
    why: "Why this score?",
    hide: "Hide score details",
    control: "HEGEVA shows the signals behind the score. You decide what to do.",
    interpretation: "Several areas need attention",
    finalTitle: "HEGEVA found something useful in under 60 seconds.",
    finalBody: "Now let it check your business.",
    tryMine: "TRY WITH MY BUSINESS",
    signupTrust: "No card required. You stay in control.",
    payments: "Payments",
    sales: "Sales follow-up",
    customers: "Customer attention",
    admin: "Admin control",
    scoreReasons: {
      overdue_invoice: "An invoice is overdue",
      invoice_14_days: "Invoice is 14+ days late",
      invoice_1000_plus: "Overdue value is £1,000+",
      quote_7_days: "Open quote has no follow-up for 7+ days",
      quote_10_days: "Quote has been waiting 10+ days",
      quote_500_plus: "Open quote value is £500+",
      returning_30_days: "Returning customer inactive for 30+ days",
      returning_3_jobs: "Customer has 3+ previous jobs",
      overdue_high_priority: "High-priority admin action is overdue",
      due_today_unresolved: "A due-today task is unresolved",
    },
    types: {
      electrician: "Electrician", builder: "Builder", plumber: "Plumber", cleaner: "Cleaner",
      property_maintenance: "Property Maintenance", consultant: "Consultant", show_me: "Just show me",
    },
  },
  hu: {
    kicker: "HEGEVA 60 MÁSODPERCES KIHÍVÁS",
    title: "Adj a HEGEVA-nak 60 másodpercet.",
    subtitle: "Nézd meg, mit hagyhat ki egy vállalkozás — egyértelműen jelölt, fiktív mintaadatokkal.",
    start: "INGYENES DEMÓ INDÍTÁSA",
    trust: "Nincs regisztráció. Nincs bankkártya. Jóváhagyásod nélkül semmi nem kerül elküldésre.",
    choose: "Milyen vállalkozást mutasson neked a HEGEVA?",
    analysing: "A HEGEVA ellenőrzi a fizetéseket, ajánlatokat, ügyfeleket és a munkaterhelést…",
    found: "3 dolgot találtam, ami ma figyelmet érdemel.",
    demo: "DEMÓ VÁLLALKOZÁS — FIKTÍV ADATOK",
    attention: "Jelenleg £2,050 igényel figyelmet",
    p1t: "£1,200 lejárt fizetés behajtása",
    p1b: "Sarah Collins · INV-1042 számla · 18 napja lejárt",
    p2t: "£850 lehetséges bevétel megvédése",
    p2b: "Oak & Stone Property Ltd · QUO-1081 ajánlat · 12 napja nincs utánkövetés",
    p3t: "Visszatérő ügyfél újraaktiválása",
    p3b: "Daniel Wright · 4 korábbi munka · 31 napja inaktív",
    prepare: "MŰVELET ELŐKÉSZÍTÉSE",
    prepared: "Csak előkészítve. Semmi nem került elküldésre.",
    reminder: "Szia Sarah, egy gyors emlékeztető: az INV-1042 számú, £1,200 összegű számla lejárt. Kérlek jelezd, ha szükséged van új példányra vagy kérdésed van.",
    scoreTitle: "HEGEVA Üzleti Pontszám",
    scoreIntro: "Átlátható termékheurisztika a fiktív demóban látható jelek alapján.",
    why: "Miért ennyi a pontszám?",
    hide: "Pontszám részleteinek elrejtése",
    control: "A HEGEVA megmutatja a pontszám mögötti jeleket. Te döntöd el, mit teszel.",
    interpretation: "Több terület figyelmet igényel",
    finalTitle: "A HEGEVA 60 másodpercen belül talált valami hasznosat.",
    finalBody: "Most nézze meg a te vállalkozásodat.",
    tryMine: "PRÓBÁLD A SAJÁT VÁLLALKOZÁSOMMAL",
    signupTrust: "Nem kell bankkártya. Te maradsz irányításban.",
    payments: "Fizetések",
    sales: "Értékesítési utánkövetés",
    customers: "Ügyfélfigyelem",
    admin: "Admin kontroll",
    scoreReasons: {
      overdue_invoice: "Van lejárt számla",
      invoice_14_days: "A számla legalább 14 napja lejárt",
      invoice_1000_plus: "A lejárt összeg legalább £1,000",
      quote_7_days: "Nyitott ajánlat 7+ napja utánkövetés nélkül",
      quote_10_days: "Az ajánlat 10+ napja vár",
      quote_500_plus: "A nyitott ajánlat értéke legalább £500",
      returning_30_days: "Visszatérő ügyfél 30+ napja inaktív",
      returning_3_jobs: "Az ügyfélnek legalább 3 korábbi munkája van",
      overdue_high_priority: "Magas prioritású admin feladat lejárt",
      due_today_unresolved: "Mai esedékes feladat nincs lezárva",
    },
    types: {
      electrician: "Villanyszerelő", builder: "Építő", plumber: "Vízvezeték-szerelő", cleaner: "Takarító",
      property_maintenance: "Ingatlankarbantartás", consultant: "Tanácsadó", show_me: "Csak mutasd",
    },
  },
  de: {
    kicker: "HEGEVA 60-SEKUNDEN-CHALLENGE", title: "Gib HEGEVA 60 Sekunden.",
    subtitle: "Sieh, was einem Unternehmen entgehen kann — mit klar gekennzeichneten fiktiven Demodaten.",
    start: "KOSTENLOSE DEMO STARTEN", trust: "Keine Anmeldung. Keine Karte. Nichts wird ohne deine Freigabe gesendet.",
    choose: "Welche Art Unternehmen soll HEGEVA zeigen?", analysing: "HEGEVA prüft Zahlungen, Angebote, Kunden und Arbeitslast…",
    found: "Ich habe 3 Dinge gefunden, die heute Aufmerksamkeit verdienen.", demo: "DEMO-UNTERNEHMEN — FIKTIVE DATEN",
    attention: "£2.050 benötigen aktuell Aufmerksamkeit", p1t: "£1.200 überfällige Zahlung verfolgen",
    p1b: "Sarah Collins · Rechnung INV-1042 · 18 Tage überfällig", p2t: "£850 potenziellen Umsatz schützen",
    p2b: "Oak & Stone Property Ltd · Angebot QUO-1081 · 12 Tage ohne Nachfassen", p3t: "Wiederkehrenden Kunden reaktivieren",
    p3b: "Daniel Wright · 4 frühere Aufträge · seit 31 Tagen inaktiv", prepare: "AKTION VORBEREITEN",
    prepared: "Nur vorbereitet. Nichts wurde gesendet.", reminder: "Hallo Sarah, kurze Erinnerung: Rechnung INV-1042 über £1.200 ist überfällig. Bitte sag Bescheid, wenn du eine weitere Kopie brauchst oder Fragen hast.",
    scoreTitle: "HEGEVA Business Score", scoreIntro: "Eine transparente Produktheuristik auf Basis der in dieser fiktiven Demo gezeigten Signale.",
    why: "Warum dieser Score?", hide: "Score-Details ausblenden", control: "HEGEVA zeigt die Signale hinter dem Score. Du entscheidest.",
    interpretation: "Mehrere Bereiche brauchen Aufmerksamkeit", finalTitle: "HEGEVA hat in weniger als 60 Sekunden etwas Nützliches gefunden.",
    finalBody: "Jetzt kann HEGEVA dein Unternehmen prüfen.", tryMine: "MIT MEINEM UNTERNEHMEN TESTEN",
    signupTrust: "Keine Karte erforderlich. Du behältst die Kontrolle.", payments: "Zahlungen", sales: "Vertriebs-Nachverfolgung",
    customers: "Kundenaufmerksamkeit", admin: "Admin-Kontrolle",
    scoreReasons: {
      overdue_invoice: "Eine Rechnung ist überfällig", invoice_14_days: "Rechnung ist 14+ Tage verspätet", invoice_1000_plus: "Überfälliger Wert ist £1.000+",
      quote_7_days: "Offenes Angebot seit 7+ Tagen ohne Nachfassen", quote_10_days: "Angebot wartet seit 10+ Tagen", quote_500_plus: "Offenes Angebot ist £500+ wert",
      returning_30_days: "Wiederkehrender Kunde seit 30+ Tagen inaktiv", returning_3_jobs: "Kunde hat 3+ frühere Aufträge",
      overdue_high_priority: "Wichtige Admin-Aktion ist überfällig", due_today_unresolved: "Heute fällige Aufgabe ist offen",
    },
    types: { electrician: "Elektriker", builder: "Bauunternehmen", plumber: "Installateur", cleaner: "Reinigung", property_maintenance: "Objektbetreuung", consultant: "Beratung", show_me: "Einfach zeigen" },
  },
  fr: {
    kicker: "DÉFI HEGEVA 60 SECONDES", title: "Donnez 60 secondes à HEGEVA.",
    subtitle: "Voyez ce qu’une entreprise peut manquer avec des données de démonstration fictives clairement identifiées.",
    start: "DÉMARRER LA DÉMO GRATUITE", trust: "Sans inscription. Sans carte. Rien n’est envoyé sans votre approbation.",
    choose: "Quel type d’entreprise HEGEVA doit-il vous montrer ?", analysing: "HEGEVA vérifie les paiements, devis, clients et la charge de travail…",
    found: "J’ai trouvé 3 éléments qui méritent votre attention aujourd’hui.", demo: "ENTREPRISE DÉMO — DONNÉES FICTIVES",
    attention: "£2 050 nécessitent actuellement votre attention", p1t: "Récupérer £1 200 de paiement en retard",
    p1b: "Sarah Collins · facture INV-1042 · 18 jours de retard", p2t: "Protéger £850 de revenu potentiel",
    p2b: "Oak & Stone Property Ltd · devis QUO-1081 · aucune relance depuis 12 jours", p3t: "Réactiver un client récurrent",
    p3b: "Daniel Wright · 4 travaux précédents · inactif depuis 31 jours", prepare: "PRÉPARER L’ACTION",
    prepared: "Préparé uniquement. Rien n’a été envoyé.", reminder: "Bonjour Sarah, petit rappel : la facture INV-1042 de £1 200 est maintenant en retard. Dites-moi si vous avez besoin d’une autre copie ou si vous avez des questions.",
    scoreTitle: "Score Business HEGEVA", scoreIntro: "Une heuristique produit transparente basée sur les signaux affichés dans cette démo fictive.",
    why: "Pourquoi ce score ?", hide: "Masquer les détails", control: "HEGEVA montre les signaux derrière le score. Vous décidez quoi faire.",
    interpretation: "Plusieurs domaines nécessitent une attention", finalTitle: "HEGEVA a trouvé quelque chose d’utile en moins de 60 secondes.",
    finalBody: "Maintenant, laissez-le examiner votre entreprise.", tryMine: "ESSAYER AVEC MON ENTREPRISE",
    signupTrust: "Aucune carte requise. Vous gardez le contrôle.", payments: "Paiements", sales: "Suivi commercial",
    customers: "Attention client", admin: "Contrôle administratif",
    scoreReasons: {
      overdue_invoice: "Une facture est en retard", invoice_14_days: "Facture en retard de 14+ jours", invoice_1000_plus: "Montant en retard de £1 000+",
      quote_7_days: "Devis ouvert sans relance depuis 7+ jours", quote_10_days: "Devis en attente depuis 10+ jours", quote_500_plus: "Valeur du devis ouvert de £500+",
      returning_30_days: "Client récurrent inactif depuis 30+ jours", returning_3_jobs: "Client avec 3+ travaux précédents",
      overdue_high_priority: "Action administrative prioritaire en retard", due_today_unresolved: "Tâche du jour non résolue",
    },
    types: { electrician: "Électricien", builder: "Bâtiment", plumber: "Plombier", cleaner: "Nettoyage", property_maintenance: "Maintenance immobilière", consultant: "Consultant", show_me: "Montrez-moi" },
  },
  es: {
    kicker: "RETO HEGEVA DE 60 SEGUNDOS", title: "Dale 60 segundos a HEGEVA.",
    subtitle: "Mira lo que una empresa podría estar pasando por alto con datos de demostración ficticios claramente identificados.",
    start: "INICIAR DEMO GRATIS", trust: "Sin registro. Sin tarjeta. Nada se envía sin tu aprobación.",
    choose: "¿Qué tipo de negocio quieres que HEGEVA te muestre?", analysing: "HEGEVA está revisando pagos, presupuestos, clientes y carga de trabajo…",
    found: "He encontrado 3 cosas que merecen atención hoy.", demo: "NEGOCIO DEMO — DATOS FICTICIOS",
    attention: "£2.050 requieren atención actualmente", p1t: "Recuperar £1.200 de pago vencido",
    p1b: "Sarah Collins · factura INV-1042 · 18 días vencida", p2t: "Proteger £850 de ingresos potenciales",
    p2b: "Oak & Stone Property Ltd · presupuesto QUO-1081 · 12 días sin seguimiento", p3t: "Reactivar un cliente recurrente",
    p3b: "Daniel Wright · 4 trabajos anteriores · inactivo 31 días", prepare: "PREPARAR ACCIÓN",
    prepared: "Solo preparado. No se ha enviado nada.", reminder: "Hola Sarah, un recordatorio rápido: la factura INV-1042 por £1.200 está vencida. Avísame si necesitas otra copia o tienes alguna pregunta.",
    scoreTitle: "HEGEVA Business Score", scoreIntro: "Una heurística de producto transparente basada en las señales de esta demostración ficticia.",
    why: "¿Por qué esta puntuación?", hide: "Ocultar detalles", control: "HEGEVA muestra las señales detrás de la puntuación. Tú decides qué hacer.",
    interpretation: "Varias áreas necesitan atención", finalTitle: "HEGEVA encontró algo útil en menos de 60 segundos.",
    finalBody: "Ahora deja que revise tu negocio.", tryMine: "PROBAR CON MI NEGOCIO",
    signupTrust: "No necesitas tarjeta. Tú mantienes el control.", payments: "Pagos", sales: "Seguimiento comercial",
    customers: "Atención al cliente", admin: "Control administrativo",
    scoreReasons: {
      overdue_invoice: "Hay una factura vencida", invoice_14_days: "Factura vencida hace 14+ días", invoice_1000_plus: "Valor vencido de £1.000+",
      quote_7_days: "Presupuesto abierto sin seguimiento durante 7+ días", quote_10_days: "Presupuesto esperando 10+ días", quote_500_plus: "Presupuesto abierto de £500+",
      returning_30_days: "Cliente recurrente inactivo durante 30+ días", returning_3_jobs: "Cliente con 3+ trabajos anteriores",
      overdue_high_priority: "Acción administrativa prioritaria vencida", due_today_unresolved: "Tarea de hoy sin resolver",
    },
    types: { electrician: "Electricista", builder: "Constructor", plumber: "Fontanero", cleaner: "Limpieza", property_maintenance: "Mantenimiento de propiedades", consultant: "Consultor", show_me: "Solo muéstrame" },
  },
} as const

const BUSINESS_TYPES = ["electrician", "builder", "plumber", "cleaner", "property_maintenance", "consultant", "show_me"] as const

export function SixtySecondChallenge() {
  const { locale } = useI18n()
  const c = COPY[locale as keyof typeof COPY] ?? COPY.en
  const [stage, setStage] = useState<Stage>("intro")
  const [selected, setSelected] = useState<BusinessType>("electrician")
  const [prepared, setPrepared] = useState(false)
  const [showWhy, setShowWhy] = useState(false)
  const resultsTracked = useRef(false)
  const score = useMemo(() => calculateBusinessScore(DEMO_SCORE_SIGNALS), [])
  const profile = PROFILES[selected]

  useEffect(() => {
    recordAnalyticsEvent("challenge_view", "/challenge", { challenge_version: "v1" })
  }, [])

  useEffect(() => {
    if (stage !== "results" || resultsTracked.current) return
    resultsTracked.current = true
    recordAnalyticsEvent("priority_viewed", "/challenge", { priority: 1, business_type: selected })
    recordAnalyticsEvent("business_score_view", "/challenge", { score: score.overall, business_type: selected })
  }, [stage, selected, score.overall])

  const begin = () => {
    recordAnalyticsEvent("challenge_start", "/challenge", { challenge_version: "v1" })
    setStage("select")
  }

  const chooseBusiness = (businessType: BusinessType) => {
    setSelected(businessType)
    setPrepared(false)
    resultsTracked.current = false
    recordAnalyticsEvent("business_type_selected", "/challenge", { business_type: businessType })
    recordAnalyticsEvent("demo_loaded", "/challenge", { business_type: businessType })
    setStage("analysing")
    window.setTimeout(() => {
      recordAnalyticsEvent("demo_analysis_complete", "/challenge", { business_type: businessType, priorities: 3 })
      setStage("results")
    }, 900)
  }

  const prepareAction = () => {
    recordAnalyticsEvent("prepare_action_click", "/challenge", { action_type: "invoice_followup", amount: 1200 })
    setPrepared(true)
    recordAnalyticsEvent("prepared_action_complete", "/challenge", { action_type: "invoice_followup", sent: false })
    recordAnalyticsEvent("challenge_complete", "/challenge", { score: score.overall, business_type: selected })
  }

  const tryMyBusiness = () => {
    saveDemoRegistrationContext(selected)
    recordAnalyticsEvent("try_my_business_click", "/challenge", { score: score.overall, business_type: selected, destination: "/login" })
  }

  const categories = [
    ["payments", c.payments],
    ["sales", c.sales],
    ["customers", c.customers],
    ["admin", c.admin],
  ] as const

  return (
    <main className="mx-auto w-full max-w-[94rem] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <section className="overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-to-br from-gold/[.09] via-background to-primary/[.05] shadow-2xl">
        <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <p className="ve-eyebrow text-gold">{c.kicker}</p>
          <h1 className="mt-4 max-w-5xl font-display text-4xl font-semibold tracking-[-.04em] sm:text-5xl lg:text-7xl">{c.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{c.subtitle}</p>

          {stage === "intro" && (
            <div className="mt-8">
              <button type="button" onClick={begin} className="hegeva-primary inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-sm font-bold">
                {c.start}<ArrowRight className="size-4" aria-hidden />
              </button>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden />{c.trust}</p>
            </div>
          )}

          {stage === "select" && (
            <div className="mt-9">
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">{c.choose}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {BUSINESS_TYPES.map((type) => (
                  <button key={type} type="button" onClick={() => chooseBusiness(type)} className="min-h-14 rounded-2xl border border-border bg-background/50 px-4 text-left text-sm font-semibold transition hover:border-gold/45 hover:bg-gold/[.06]">
                    {c.types[type]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === "analysing" && (
            <div className="mt-10 rounded-3xl border border-primary/25 bg-primary/[.045] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full border border-primary/30 bg-primary/10"><Sparkles className="size-5 text-primary" aria-hidden /></span>
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[.15em] text-primary">{c.demo}</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold">{profile.name}</h2>
                </div>
              </div>
              <p className="mt-6 animate-pulse text-base text-muted-foreground">{c.analysing}</p>
            </div>
          )}

          {stage === "results" && (
            <div className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[.15em] text-gold">{c.demo}</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold">{profile.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{profile.city} · {profile.sector}</p>
                </div>
                <div className="rounded-2xl border border-gold/30 bg-gold/[.07] px-4 py-3 text-right">
                  <small className="block text-xs text-muted-foreground">{c.found}</small>
                  <strong className="mt-1 block text-lg text-gold">{c.attention}</strong>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {[
                  [c.p1t, c.p1b, "£1,200", FileText],
                  [c.p2t, c.p2b, "£850", Clock3],
                  [c.p3t, c.p3b, "31 days", CheckCircle2],
                ].map(([title, body, value, Icon], index) => (
                  <article key={String(title)} className="rounded-3xl border border-border bg-background/45 p-5">
                    <div className="flex items-center justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-gold/10 text-gold"><Icon className="size-5" aria-hidden /></span><b className="font-mono text-sm text-gold">{String(value)}</b></div>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">0{index + 1}</p>
                    <h3 className="mt-1 text-lg font-semibold">{String(title)}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{String(body)}</p>
                    {index === 0 && (
                      <button type="button" onClick={prepareAction} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-gold/35 bg-gold/[.08] px-4 text-sm font-bold text-gold hover:bg-gold/[.12]">
                        {prepared ? <CheckCircle2 className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}{c.prepare}
                      </button>
                    )}
                  </article>
                ))}
              </div>

              {prepared && (
                <section className="mt-5 rounded-3xl border border-primary/30 bg-primary/[.055] p-5 sm:p-6">
                  <div className="flex items-center gap-2 font-semibold text-primary"><ShieldCheck className="size-5" aria-hidden />{c.prepared}</div>
                  <p className="mt-4 max-w-4xl rounded-2xl border border-border bg-background/55 p-4 text-sm leading-6">{c.reminder} Thanks, {profile.name}</p>
                </section>
              )}

              <section className="mt-8 rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/[.075] to-background p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <p className="ve-eyebrow text-gold">{c.scoreTitle}</p>
                    <div className="mt-2 flex items-end gap-3"><strong className="font-display text-6xl text-gold">{score.overall}</strong><span className="pb-2 text-lg text-muted-foreground">/100</span></div>
                    <p className="mt-1 font-semibold">{c.interpretation}</p>
                  </div>
                  <Gauge className="size-16 text-gold/70" aria-hidden />
                </div>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{c.scoreIntro}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {categories.map(([key, label]) => (
                    <div key={key} className="rounded-2xl border border-border bg-background/45 p-4">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <strong className="mt-1 block text-2xl">{score.categories[key].score}/100</strong>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => setShowWhy((value) => !value)} className="mt-5 min-h-11 rounded-xl border border-border px-4 text-sm font-semibold">
                  {showWhy ? c.hide : c.why}
                </button>

                {showWhy && (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {categories.map(([key, label]) => (
                      <article key={key} className="rounded-2xl border border-border p-4">
                        <div className="flex justify-between gap-3"><strong>{label}</strong><b>{score.categories[key].score}/100</b></div>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {score.categories[key].deductions.map((item) => (
                            <li key={item.code} className="flex justify-between gap-4"><span>{c.scoreReasons[item.code as keyof typeof c.scoreReasons]}</span><span>-{item.points}</span></li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                )}

                <p className="mt-5 text-sm text-muted-foreground">{c.control}</p>
              </section>

              <section className="mt-8 rounded-3xl border border-primary/30 bg-primary/[.05] p-6 text-center sm:p-8">
                <h2 className="font-display text-3xl font-semibold sm:text-4xl">{c.finalTitle}</h2>
                <p className="mt-3 text-muted-foreground">{c.finalBody}</p>
                <Link href="/login?mode=register&callbackURL=%2Fget-started" onClick={tryMyBusiness} className="hegeva-primary mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-sm font-bold">
                  {c.tryMine}<ArrowRight className="size-4" aria-hidden />
                </Link>
                <p className="mt-3 text-xs text-muted-foreground">{c.signupTrust}</p>
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
