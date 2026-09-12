"use client"

import { Building2, Check, Crown, LockKeyhole, Sparkles, Zap } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { PRICING_COPY } from "@/lib/i18n/pricing-copy"
import { AICore, IntelligenceCard, SignalIcon } from "@/components/visual-engine"

type PaidPlan = "premium" | "pro"
type BillingStatus = { checkoutEnabled?: boolean; webhookConfigured?: boolean; mode?: string }

const PLAN_CHANGE_COPY = {
  en: "Manage plan",
  hu: "Csomag kezelése",
  de: "Tarif verwalten",
  fr: "Gérer l’offre",
  es: "Gestionar plan",
} as const

const BILLING_CANCELLED_COPY = {
  en: "Checkout was cancelled. Your current plan was not changed and no HEGEVA entitlement was activated.",
  hu: "A fizetési folyamat megszakadt. A jelenlegi csomagod nem változott, és nem aktiválódott új HEGEVA jogosultság.",
  de: "Der Checkout wurde abgebrochen. Dein aktueller Tarif wurde nicht geändert und es wurde keine neue HEGEVA-Berechtigung aktiviert.",
  fr: "Le paiement a été annulé. Votre offre actuelle n’a pas été modifiée et aucun nouvel accès HEGEVA n’a été activé.",
  es: "El pago fue cancelado. Tu plan actual no cambió y no se activó ningún nuevo acceso de HEGEVA.",
} as const

const LIVE_BILLING_COPY = {
  en: { notice:"Live Stripe payments are active. Completing checkout creates a real monthly recurring charge.", checking:"Checking secure live billing…", ready:"Secure checkout is ready. Your plan activates after payment is confirmed.", incomplete:"Secure checkout is temporarily unavailable. Please try again shortly or contact support.", annual:"Monthly billing is available today. Annual billing is planned." },
  hu: { notice:"Az élő Stripe-fizetés aktív. A checkout befejezése valódi, havonta ismétlődő terhelést indít.", checking:"Biztonságos élő számlázás ellenőrzése…", ready:"A biztonságos checkout készen áll. A csomagod a fizetés visszaigazolása után aktiválódik.", incomplete:"A biztonságos checkout átmenetileg nem érhető el. Próbáld meg később, vagy vedd fel a kapcsolatot a támogatással.", annual:"A havi fizetés jelenleg elérhető. Az éves fizetés tervezés alatt áll." },
  de: { notice:"Live-Zahlungen über Stripe sind aktiv. Der Abschluss des Checkouts startet eine echte monatliche Belastung.", checking:"Sichere Live-Abrechnung wird geprüft…", ready:"Der sichere Checkout ist bereit. Ihr Tarif wird nach Zahlungsbestätigung aktiviert.", incomplete:"Der sichere Checkout ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später oder kontaktieren Sie den Support.", annual:"Monatliche Abrechnung ist heute verfügbar. Jahresabrechnung ist geplant." },
  fr: { notice:"Les paiements Stripe réels sont actifs. La validation du paiement déclenche un débit mensuel récurrent réel.", checking:"Vérification de la facturation réelle sécurisée…", ready:"Le paiement sécurisé est prêt. Votre offre s’active après confirmation du paiement.", incomplete:"Le paiement sécurisé est temporairement indisponible. Réessayez plus tard ou contactez l’assistance.", annual:"La facturation mensuelle est disponible aujourd’hui. L’annuel est prévu." },
  es: { notice:"Los pagos reales de Stripe están activos. Completar el pago inicia un cargo mensual recurrente real.", checking:"Comprobando la facturación real segura…", ready:"El pago seguro está listo. Tu plan se activa cuando se confirme el pago.", incomplete:"El pago seguro no está disponible temporalmente. Inténtalo más tarde o contacta con soporte.", annual:"La facturación mensual está disponible hoy. La anual está prevista." },
} as const

const EXPANSION_COPY = {
  en: { studio:"Studio", enterprise:"Enterprise", from:"From", soon:"Coming soon", contact:"Contact sales", annual:"per year · planned", annualSaving:"Planned annual billing includes two months free. Monthly checkout is currently available.", protection:"No usage overage charges. When an included AI limit is reached, AI requests pause instead of creating an extra bill. Prices are shown in GBP; applicable taxes are calculated before payment.", studioFeatures:["Higher included AI capacity with priority build capacity","Build My App X20 and future X30 Studio workflows","Advertising and video campaign studios are being prepared for release","Commercial workspace tools and priority support"], enterpriseFeatures:["AI and workspace limits agreed in writing","Teams, roles and compliance audit","Enterprise SSO/SAML when available","Onboarding, priority support and a tailored agreement"] },
  hu: { studio:"Studio", enterprise:"Enterprise", from:"Ettől", soon:"Hamarosan", contact:"Kapcsolatfelvétel", annual:"évente · tervezett", annualSaving:"A tervezett éves fizetés két hónap kedvezményt tartalmaz. Jelenleg a havi fizetés érhető el.", protection:"Nincs túlhasználati díj. A csomagban foglalt AI-limit elérésekor az AI-kérések szünetelnek, nem keletkezik extra számla. Az árak GBP-ben értendők; az esetleges adók a fizetés előtt jelennek meg.", studioFeatures:["Magasabb befoglalt AI-kapacitás és elsőbbségi buildkapacitás","Build My App X20 és a jövőbeni X30 Studio-munkafolyamatok","A reklám- és videókampány-stúdiók kiadásra készülnek","Kereskedelmi eszközök és kiemelt támogatás"], enterpriseFeatures:["Írásban rögzített AI- és munkaterület-limitek","Csapatok, szerepkörök és megfelelőségi audit","Enterprise SSO/SAML, amikor elérhető","Bevezetés, kiemelt támogatás és egyedi szerződés"] },
  de: { studio:"Studio", enterprise:"Enterprise", from:"Ab", soon:"Demnächst", contact:"Vertrieb kontaktieren", annual:"pro Jahr · geplant", annualSaving:"Die geplante Jahresabrechnung enthält zwei Gratismonate. Der monatliche Checkout ist derzeit verfügbar.", protection:"Keine Mehrverbrauchsgebühren. Am enthaltenen KI-Limit pausieren KI-Anfragen, statt eine Zusatzrechnung zu erzeugen. Preise in GBP; anwendbare Steuern werden vor der Zahlung angezeigt.", studioFeatures:["Höhere enthaltene KI-Kapazität mit priorisierter Build-Kapazität","Build My App X20- und zukünftige X30-Studio-Workflows","Werbe- und Videokampagnen-Studios werden auf Veröffentlichung vorbereitet","Kommerzielle Werkzeuge und Prioritätssupport"], enterpriseFeatures:["Schriftlich vereinbarte KI- und Workspace-Limits","Teams, Rollen und Compliance-Audit","Enterprise SSO/SAML, sobald verfügbar","Onboarding, Prioritätssupport und individueller Vertrag"] },
  fr: { studio:"Studio", enterprise:"Enterprise", from:"À partir de", soon:"Bientôt", contact:"Contacter les ventes", annual:"par an · prévu", annualSaving:"La facturation annuelle prévue inclut deux mois offerts. Le paiement mensuel est actuellement disponible.", protection:"Aucun frais de dépassement. À la limite IA incluse, les requêtes sont suspendues au lieu de créer une facture supplémentaire. Prix en GBP; les taxes applicables sont affichées avant paiement.", studioFeatures:["Capacité IA incluse supérieure avec création prioritaire","Flux Studio Build My App X20 et futurs X30","Les studios publicitaires et vidéo sont en préparation pour la sortie","Outils commerciaux et support prioritaire"], enterpriseFeatures:["Limites IA et espace convenues par écrit","Équipes, rôles et audit de conformité","SSO/SAML Enterprise dès disponibilité","Intégration, support prioritaire et accord sur mesure"] },
  es: { studio:"Studio", enterprise:"Enterprise", from:"Desde", soon:"Próximamente", contact:"Contactar ventas", annual:"al año · previsto", annualSaving:"La facturación anual prevista incluye dos meses gratis. Actualmente está disponible el pago mensual.", protection:"Sin cargos por exceso de uso. Al alcanzar el límite de IA incluido, las solicitudes se pausan en vez de generar una factura adicional. Precios en GBP; los impuestos aplicables se muestran antes del pago.", studioFeatures:["Mayor capacidad de IA incluida con capacidad prioritaria","Flujos Studio Build My App X20 y futuros X30","Los estudios publicitarios y de vídeo se están preparando para su lanzamiento","Herramientas comerciales y soporte prioritario"], enterpriseFeatures:["Límites de IA y espacio acordados por escrito","Equipos, roles y auditoría de cumplimiento","SSO/SAML Enterprise cuando esté disponible","Incorporación, soporte prioritario y acuerdo a medida"] },
} as const

const CONVERSION_VALUE_COPY = {
  en: { subtitle:"Start with a clear business workspace. Upgrade when you want more capacity to organise customers, protect revenue and act on priorities.", basic:["Customer, quote, invoice and Planner workspace","Cloud sync after you sign in","A clear place to start building your business picture"], premium:["HEGEVA Core priorities from supported workspace records","Customer, invoice and follow-up workflows","Client Portal and higher workspace capacity"], pro:["Everything in Premium","More capacity for growing business activity","A clearer operational view as your business grows"], protection:"Straightforward monthly pricing. No surprise overage charges: when an included limit is reached, protected requests pause rather than creating an extra bill." },
  hu: { subtitle:"Kezdj egy átlátható üzleti munkaterülettel. Akkor válts magasabb csomagra, amikor több kapacitás kell az ügyfelek, bevétel és prioritások kezeléséhez.", basic:["Ügyfél-, ajánlat-, számla- és Tervező-munkaterület","Felhőszinkron bejelentkezés után","Tiszta kiindulópont a saját üzleti képed felépítéséhez"], premium:["HEGEVA Core prioritások támogatott munkaterületi rekordokból","Ügyfél-, számla- és utánkövetési munkafolyamatok","Ügyfélkapu és nagyobb munkaterületi kapacitás"], pro:["Minden, ami a Premiumban van","Több kapacitás a növekvő üzleti működéshez","Átláthatóbb működési kép a vállalkozás növekedésével"], protection:"Egyszerű havi árazás. Nincs váratlan túlhasználati díj: a csomagban foglalt limit elérésekor a védett kérések szünetelnek, nem keletkezik extra számla." },
  de: { subtitle:"Starten Sie mit einem klaren Business-Workspace. Wechseln Sie, wenn Sie mehr Kapazität für Kunden, Umsatzschutz und Prioritäten benötigen.", basic:["Workspace für Kunden, Angebote, Rechnungen und Planung","Cloud-Synchronisierung nach Anmeldung","Ein klarer Startpunkt für Ihr Betriebsbild"], premium:["HEGEVA-Core-Prioritäten aus unterstützten Workspace-Datensätzen","Workflows für Kunden, Rechnungen und Nachfassaktionen","Kundenportal und höhere Workspace-Kapazität"], pro:["Alles aus Premium","Mehr Kapazität für wachsende Geschäftsaktivität","Klarere Betriebsansicht beim Wachstum"], protection:"Übersichtliche monatliche Preise. Keine überraschenden Mehrverbrauchskosten: Erreichte enthaltene Limits pausieren geschützte Anfragen statt eine Zusatzrechnung zu erzeugen." },
  fr: { subtitle:"Commencez avec un espace de travail professionnel clair. Passez à l’offre supérieure lorsque vous avez besoin de plus de capacité pour vos clients, revenus et priorités.", basic:["Espace clients, devis, factures et planification","Synchronisation cloud après connexion","Un point de départ clair pour votre vue opérationnelle"], premium:["Priorités HEGEVA Core issues de données prises en charge","Flux clients, factures et suivis","Portail client et capacité d’espace supérieure"], pro:["Tout ce qui est inclus dans Premium","Plus de capacité pour l’activité en croissance","Une vue opérationnelle plus claire à mesure que vous grandissez"], protection:"Tarification mensuelle simple. Aucun dépassement surprise : lorsqu’une limite incluse est atteinte, les demandes protégées se mettent en pause au lieu de créer une facture supplémentaire." },
  es: { subtitle:"Empieza con un espacio de trabajo empresarial claro. Mejora cuando necesites más capacidad para clientes, ingresos y prioridades.", basic:["Espacio para clientes, presupuestos, facturas y planificación","Sincronización en la nube al iniciar sesión","Un punto de partida claro para tu visión operativa"], premium:["Prioridades de HEGEVA Core basadas en registros compatibles","Flujos de clientes, facturas y seguimientos","Portal de clientes y mayor capacidad de espacio"], pro:["Todo lo incluido en Premium","Más capacidad para una actividad empresarial en crecimiento","Una visión operativa más clara a medida que creces"], protection:"Precios mensuales sencillos. Sin cargos sorpresa por exceso: al alcanzar un límite incluido, las solicitudes protegidas se pausan en lugar de crear una factura adicional." },
} as const

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timeout)
  }
}

export default function PricingPage() {
  const router = useRouter()
  const { locale } = useI18n()
  const c = PRICING_COPY[locale]
  const expansion = EXPANSION_COPY[locale]
  const value = CONVERSION_VALUE_COPY[locale]
  const { data: session, isPending } = authClient.useSession()
  const [opening, setOpening] = useState<PaidPlan | null>(null)
  const [error, setError] = useState("")
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [billingCancelled, setBillingCancelled] = useState(false)
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
  const [billingStatusLoading, setBillingStatusLoading] = useState(false)
  const [publicBillingStatus, setPublicBillingStatus] = useState<BillingStatus | null>(null)

  const effectiveMode = billingStatus?.mode ?? publicBillingStatus?.mode ?? "live"

  useEffect(() => {
    let active = true
    void fetchWithTimeout("/api/billing/public-status", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok || !data) throw new Error("public-billing")
        if (active) setPublicBillingStatus(data)
      })
      .catch(() => {
        if (active) setPublicBillingStatus(null)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("billing") === "cancelled") {
      setBillingCancelled(true)
      params.delete("billing")
      const query = params.toString()
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`)
    }
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setCurrentPlan(null)
      setBillingStatus(null)
      setPlanLoading(false)
      return
    }

    let active = true
    setPlanLoading(true)
    setBillingStatusLoading(true)

    void fetchWithTimeout("/api/plan/status", {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok || typeof data?.plan !== "string") throw new Error("plan")
        if (active) setCurrentPlan(data.plan)
      })
      .catch(() => {
        if (active) {
          setCurrentPlan(null)
          setError(c.unavailable)
        }
      })
      .finally(() => {
        if (active) setPlanLoading(false)
      })

    void fetchWithTimeout("/api/billing/status", {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok || !data) throw new Error("billing")
        if (active) setBillingStatus(data)
      })
      .catch(() => {
        if (active) setBillingStatus({ checkoutEnabled: false, webhookConfigured: false })
      })
      .finally(() => {
        if (active) setBillingStatusLoading(false)
      })

    return () => {
      active = false
    }
  }, [session?.user, c.unavailable])

  async function checkout(plan: PaidPlan) {
    if (!session?.user) {
      router.push("/login?callbackURL=%2Fpricing")
      return
    }
    const billingMode = billingStatus?.mode === "live" ? "live" : billingStatus?.mode === "test" ? "test" : null
    const billingReady = billingMode !== null && billingStatus?.checkoutEnabled === true && billingStatus.webhookConfigured === true
    if (planLoading || billingStatusLoading || !billingReady) {
      setError(c.billingIncomplete)
      return
    }

    setBillingCancelled(false)
    setOpening(plan)
    setError("")

    try {
      const response = await fetchWithTimeout("/api/billing/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ plan, mode: billingMode }),
      }, 15000)
      const data = await response.json().catch(() => null)
      if (!response.ok || typeof data?.url !== "string" || !data.url.startsWith("https://checkout.stripe.com/")) throw new Error("checkout")
      window.location.assign(data.url)
    } catch {
      setError(c.unavailable)
      setOpening(null)
    }
  }

  const plans = [
    { key: "basic", name: c.basic, price: c.free, annualPrice: null, features: value.basic },
    { key: "premium", name: c.premium, price: "£14.99", annualPrice: "£149.90", features: value.premium, featured: true },
      { key: "pro", name: c.pro, price: "£29.99", annualPrice: "£299.90", features: value.pro },
    { key: "enterprise", name: expansion.enterprise, price: `${expansion.from} £149`, annualPrice: null, features: expansion.enterpriseFeatures },
  ] as const

  const hasPaidPlan = currentPlan === "premium" || currentPlan === "pro"
  const liveBilling = effectiveMode === "live"
  const billingReady = (billingStatus?.mode === "test" || billingStatus?.mode === "live") && billingStatus.checkoutEnabled === true && billingStatus.webhookConfigured === true

  return <AppShell><main className="pricing-wow relative isolate mx-auto max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
    <div className="pricing-aurora" aria-hidden><i/><i/><i/></div>
    <div className="pricing-hero mx-auto max-w-3xl text-center">
      <AICore state="active" className="mx-auto mb-4" />
      <p className="text-sm font-semibold tracking-[0.18em] text-primary">{c.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{c.title}</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{value.subtitle}</p>
      <p className="mt-5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{billingStatusLoading || liveBilling ? LIVE_BILLING_COPY[locale].notice : c.sandbox}</p>
      {session?.user && <p role="status" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${billingReady ? "border-primary/30 bg-primary/10 text-primary" : "border-gold/30 bg-gold/10 text-gold"}`}>{billingStatusLoading ? LIVE_BILLING_COPY[locale].checking : billingReady ? (liveBilling ? LIVE_BILLING_COPY[locale].ready : c.billingReady) : (liveBilling ? LIVE_BILLING_COPY[locale].incomplete : c.billingIncomplete)}</p>}
      {billingCancelled && <p role="status" className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{BILLING_CANCELLED_COPY[locale]}</p>}
    </div>
    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan,index) => <IntelligenceCard key={plan.key} tone={index===1?"gold":index===2?"violet":"neutral"} interactive className={`pricing-plan pricing-plan-${plan.key} flex p-6 sm:p-8 ${"featured" in plan && plan.featured ? "border-gold/40 ring-1 ring-gold/20" : ""}`}>
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold">{plan.name}</h2><SignalIcon icon={index===1?Crown:index===2?Zap:index===3?Building2:Sparkles} tone={index===1?"gold":index===2?"violet":index===3?"cyan":"emerald"} className="size-10 rounded-xl" /></div>
          <div className="mt-5 flex items-end gap-2"><strong className="text-4xl font-bold">{plan.price}</strong>{plan.key !== "basic" && <span className="pb-1 text-sm text-muted-foreground">/ {c.month}</span>}</div>
          {plan.annualPrice ? <p className="mt-2 text-sm font-medium text-primary">{plan.annualPrice} / {expansion.annual}</p> : <div className="h-7" />}
          <ul className="mt-7 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-primary"/><span>{feature}</span></li>)}</ul>
          {plan.key === "basic" ? <button type="button" disabled className="mt-auto rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground">{currentPlan === "basic" ? c.current : c.free}</button> : plan.key === "enterprise" ? <Link prefetch={false} href="/contact" className="mt-auto rounded-xl border border-primary/40 bg-primary/10 px-5 py-3 text-center text-sm font-semibold text-primary">{expansion.contact}</Link> : hasPaidPlan ? <Link prefetch={false} href="/account" className="mt-auto rounded-xl border border-primary/40 bg-primary/10 px-5 py-3 text-center text-sm font-semibold text-primary">{currentPlan === plan.key ? c.current : PLAN_CHANGE_COPY[locale]}</Link> : <button type="button" disabled={opening !== null || isPending || planLoading || billingStatusLoading || (Boolean(session?.user) && !billingReady) || currentPlan === plan.key} onClick={() => void checkout(plan.key)} className="mt-auto rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60">{currentPlan === plan.key ? c.current : opening === plan.key ? c.opening : !session?.user && !isPending ? c.signIn : c.choose}</button>}
        </div>
      </IntelligenceCard>)}
    </div>
    <div className="mx-auto mt-8 max-w-3xl space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center">
      <p className="font-semibold text-primary">{liveBilling ? LIVE_BILLING_COPY[locale].annual : expansion.annualSaving}</p>
      <p className="text-sm leading-6 text-muted-foreground">{value.protection}</p>
    </div>
    {opening && <p className="mt-5 text-center text-sm text-muted-foreground">{c.starting}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">{error}</p>}
    <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground"><LockKeyhole className="size-4 text-primary"/>{c.secure}</p>
  </main></AppShell>
}
