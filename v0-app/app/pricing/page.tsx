"use client"

import { Building2, Check, Clapperboard, Crown, LockKeyhole, Sparkles, Zap } from "lucide-react"
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
  en: "Plan changes are coming soon",
  hu: "Csomagváltás hamarosan",
  de: "Tarifwechsel folgt bald",
  fr: "Changement d’offre bientôt disponible",
  es: "Cambio de plan próximamente",
} as const

const BILLING_CANCELLED_COPY = {
  en: "Checkout was cancelled. Your current plan was not changed and no HEGEVA entitlement was activated.",
  hu: "A fizetési folyamat megszakadt. A jelenlegi csomagod nem változott, és nem aktiválódott új HEGEVA jogosultság.",
  de: "Der Checkout wurde abgebrochen. Dein aktueller Tarif wurde nicht geändert und es wurde keine neue HEGEVA-Berechtigung aktiviert.",
  fr: "Le paiement a été annulé. Votre offre actuelle n’a pas été modifiée et aucun nouvel accès HEGEVA n’a été activé.",
  es: "El pago fue cancelado. Tu plan actual no cambió y no se activó ningún nuevo acceso de HEGEVA.",
} as const

const LIVE_BILLING_COPY = {
  en: { notice:"Live Stripe payments are active. Completing checkout creates a real monthly recurring charge.", checking:"Checking secure live billing…", ready:"Secure live Stripe checkout and verified webhook handling are ready.", incomplete:"Live checkout is disabled until Stripe prices, secrets and webhook handling are fully configured.", annual:"Planned annual billing includes two months free. Monthly checkout is currently available." },
  hu: { notice:"Az élő Stripe-fizetés aktív. A checkout befejezése valódi, havonta ismétlődő terhelést indít.", checking:"Biztonságos élő számlázás ellenőrzése…", ready:"A biztonságos élő Stripe checkout és az ellenőrzött webhook-kezelés készen áll.", incomplete:"Az élő checkout le van tiltva, amíg a Stripe árak, titkok és webhookok beállítása nem teljes.", annual:"A tervezett éves fizetés két hónap kedvezményt tartalmaz. Jelenleg a havi fizetés érhető el." },
  de: { notice:"Live-Zahlungen über Stripe sind aktiv. Der Abschluss des Checkouts startet eine echte monatliche Belastung.", checking:"Sichere Live-Abrechnung wird geprüft…", ready:"Sicherer Live-Checkout über Stripe und verifizierte Webhooks sind bereit.", incomplete:"Der Live-Checkout bleibt deaktiviert, bis Stripe-Preise, Geheimnisse und Webhooks vollständig eingerichtet sind.", annual:"Die geplante Jahresabrechnung enthält zwei Gratismonate. Der monatliche Checkout ist derzeit verfügbar." },
  fr: { notice:"Les paiements Stripe réels sont actifs. La validation du paiement déclenche un débit mensuel récurrent réel.", checking:"Vérification de la facturation réelle sécurisée…", ready:"Le paiement Stripe réel sécurisé et les webhooks vérifiés sont prêts.", incomplete:"Le paiement réel reste désactivé tant que les prix, secrets et webhooks Stripe ne sont pas entièrement configurés.", annual:"La facturation annuelle prévue inclut deux mois offerts. Le paiement mensuel est actuellement disponible." },
  es: { notice:"Los pagos reales de Stripe están activos. Completar el pago inicia un cargo mensual recurrente real.", checking:"Comprobando la facturación real segura…", ready:"El pago real seguro de Stripe y los webhooks verificados están listos.", incomplete:"El pago real seguirá desactivado hasta completar precios, secretos y webhooks de Stripe.", annual:"La facturación anual prevista incluye dos meses gratis. Actualmente está disponible el pago mensual." },
} as const

const EXPANSION_COPY = {
  en: { studio:"Studio", enterprise:"Enterprise", from:"From", soon:"Coming soon", contact:"Contact sales", annual:"per year · planned", annualSaving:"Planned annual billing includes two months free. Monthly checkout is the only test option currently available.", protection:"No usage overage charges. When an included AI limit is reached, AI requests pause instead of creating an extra bill. Prices are shown in GBP; applicable taxes are calculated before payment.", studioFeatures:["2,500 AI messages or operations each month","Build My App X20 and X30 Studio workflows","Advertising and video campaign studios","Priority build capacity and commercial workspace tools"], enterpriseFeatures:["AI and workspace limits agreed in writing","Teams, roles and compliance audit","Enterprise SSO/SAML when available","Onboarding, priority support and a tailored agreement"] },
  hu: { studio:"Studio", enterprise:"Enterprise", from:"Ettől", soon:"Hamarosan", contact:"Kapcsolatfelvétel", annual:"évente · tervezett", annualSaving:"A tervezett éves fizetés két hónap kedvezményt tartalmaz. Jelenleg csak a havi tesztfizetés érhető el.", protection:"Nincs túlhasználati díj. A csomagban foglalt AI-limit elérésekor az AI-kérések szünetelnek, nem keletkezik extra számla. Az árak GBP-ben értendők; az esetleges adók a fizetés előtt jelennek meg.", studioFeatures:["2 500 AI-üzenet vagy művelet havonta","Build My App X20 és X30 Studio munkafolyamatok","Reklám- és videókampány-stúdiók","Elsőbbségi buildkapacitás és kereskedelmi eszközök"], enterpriseFeatures:["Írásban rögzített AI- és munkaterület-limitek","Csapatok, szerepkörök és megfelelőségi audit","Enterprise SSO/SAML, amikor elérhető","Bevezetés, kiemelt támogatás és egyedi szerződés"] },
  de: { studio:"Studio", enterprise:"Enterprise", from:"Ab", soon:"Demnächst", contact:"Vertrieb kontaktieren", annual:"pro Jahr · geplant", annualSaving:"Die geplante Jahresabrechnung enthält zwei Gratismonate. Derzeit ist nur der monatliche Test-Checkout verfügbar.", protection:"Keine Mehrverbrauchsgebühren. Am enthaltenen KI-Limit pausieren KI-Anfragen, statt eine Zusatzrechnung zu erzeugen. Preise in GBP; anwendbare Steuern werden vor der Zahlung angezeigt.", studioFeatures:["2.500 KI-Nachrichten oder Vorgänge pro Monat","Build My App X20- und X30-Studio-Workflows","Werbe- und Videokampagnen-Studios","Priorisierte Build-Kapazität und kommerzielle Werkzeuge"], enterpriseFeatures:["Schriftlich vereinbarte KI- und Workspace-Limits","Teams, Rollen und Compliance-Audit","Enterprise SSO/SAML, sobald verfügbar","Onboarding, Prioritätssupport und individueller Vertrag"] },
  fr: { studio:"Studio", enterprise:"Enterprise", from:"À partir de", soon:"Bientôt", contact:"Contacter les ventes", annual:"par an · prévu", annualSaving:"La facturation annuelle prévue inclut deux mois offerts. Seul le paiement test mensuel est actuellement disponible.", protection:"Aucun frais de dépassement. À la limite IA incluse, les requêtes sont suspendues au lieu de créer une facture supplémentaire. Prix en GBP; les taxes applicables sont affichées avant paiement.", studioFeatures:["2 500 messages ou opérations IA par mois","Flux Studio Build My App X20 et X30","Studios de campagnes publicitaires et vidéo","Capacité prioritaire et outils commerciaux"], enterpriseFeatures:["Limites IA et espace convenues par écrit","Équipes, rôles et audit de conformité","SSO/SAML Enterprise dès disponibilité","Intégration, support prioritaire et accord sur mesure"] },
  es: { studio:"Studio", enterprise:"Enterprise", from:"Desde", soon:"Próximamente", contact:"Contactar ventas", annual:"al año · previsto", annualSaving:"La facturación anual prevista incluye dos meses gratis. Actualmente solo está disponible el pago de prueba mensual.", protection:"Sin cargos por exceso de uso. Al alcanzar el límite de IA incluido, las solicitudes se pausan en vez de generar una factura adicional. Precios en GBP; los impuestos aplicables se muestran antes del pago.", studioFeatures:["2.500 mensajes u operaciones de IA al mes","Flujos Studio Build My App X20 y X30","Estudios de campañas publicitarias y vídeo","Capacidad prioritaria y herramientas comerciales"], enterpriseFeatures:["Límites de IA y espacio acordados por escrito","Equipos, roles y auditoría de cumplimiento","SSO/SAML Enterprise cuando esté disponible","Incorporación, soporte prioritario y acuerdo a medida"] },
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
  const { data: session, isPending } = authClient.useSession()
  const [opening, setOpening] = useState<PaidPlan | null>(null)
  const [error, setError] = useState("")
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [billingCancelled, setBillingCancelled] = useState(false)
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
  const [billingStatusLoading, setBillingStatusLoading] = useState(false)

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
      if (!response.ok || typeof data?.url !== "string") throw new Error("checkout")
      window.location.assign(data.url)
    } catch {
      setError(c.unavailable)
      setOpening(null)
    }
  }

  const plans = [
    { key: "basic", name: c.basic, price: c.free, annualPrice: null, features: c.basicFeatures },
    { key: "premium", name: c.premium, price: "£14.99", annualPrice: "£149.90", features: c.premiumFeatures, featured: true },
    { key: "pro", name: c.pro, price: "£29.99", annualPrice: "£299.90", features: c.proFeatures },
    { key: "studio", name: expansion.studio, price: "£59.99", annualPrice: "£599.90", features: expansion.studioFeatures },
    { key: "enterprise", name: expansion.enterprise, price: `${expansion.from} £149`, annualPrice: null, features: expansion.enterpriseFeatures },
  ] as const

  const hasPaidPlan = currentPlan === "premium" || currentPlan === "pro"
  const liveBilling = billingStatus?.mode === "live"
  const billingReady = (billingStatus?.mode === "test" || billingStatus?.mode === "live") && billingStatus.checkoutEnabled === true && billingStatus.webhookConfigured === true

  return <AppShell><main className="pricing-wow relative isolate mx-auto max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
    <div className="pricing-aurora" aria-hidden><i/><i/><i/></div>
    <div className="pricing-hero mx-auto max-w-3xl text-center">
      <AICore state="active" className="mx-auto mb-4" />
      <p className="text-sm font-semibold tracking-[0.18em] text-primary">{c.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{c.title}</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{c.subtitle}</p>
      <p className="mt-5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{liveBilling ? LIVE_BILLING_COPY[locale].notice : c.sandbox}</p>
      {session?.user && <p role="status" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${billingReady ? "border-primary/30 bg-primary/10 text-primary" : "border-gold/30 bg-gold/10 text-gold"}`}>{billingStatusLoading ? (liveBilling ? LIVE_BILLING_COPY[locale].checking : c.checkingBilling) : billingReady ? (liveBilling ? LIVE_BILLING_COPY[locale].ready : c.billingReady) : (liveBilling ? LIVE_BILLING_COPY[locale].incomplete : c.billingIncomplete)}</p>}
      {billingCancelled && <p role="status" className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{BILLING_CANCELLED_COPY[locale]}</p>}
    </div>
    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan,index) => <IntelligenceCard key={plan.key} tone={index===1?"gold":index===2?"violet":index===3?"cyan":"neutral"} interactive className={`pricing-plan pricing-plan-${plan.key} flex p-6 sm:p-8 ${"featured" in plan && plan.featured ? "border-gold/40 ring-1 ring-gold/20" : ""}`}>
        <div className="flex w-full flex-col">
          <div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold">{plan.name}</h2><SignalIcon icon={index===1?Crown:index===2?Zap:index===3?Clapperboard:index===4?Building2:Sparkles} tone={index===1?"gold":index===2?"violet":index===3?"cyan":"emerald"} className="size-10 rounded-xl" /></div>
          <div className="mt-5 flex items-end gap-2"><strong className="text-4xl font-bold">{plan.price}</strong>{plan.key !== "basic" && <span className="pb-1 text-sm text-muted-foreground">/ {c.month}</span>}</div>
          {plan.annualPrice ? <p className="mt-2 text-sm font-medium text-primary">{plan.annualPrice} / {expansion.annual}</p> : <div className="h-7" />}
          <ul className="mt-7 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-primary"/><span>{feature}</span></li>)}</ul>
          {plan.key === "basic" ? <button type="button" disabled className="mt-auto rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground">{currentPlan === "basic" ? c.current : c.free}</button> : plan.key === "studio" ? <button type="button" disabled className="mt-auto rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground">{expansion.soon}</button> : plan.key === "enterprise" ? <Link prefetch={false} href="/contact" className="mt-auto rounded-xl border border-primary/40 bg-primary/10 px-5 py-3 text-center text-sm font-semibold text-primary">{expansion.contact}</Link> : <button type="button" disabled={opening !== null || isPending || planLoading || billingStatusLoading || (Boolean(session?.user) && !billingReady) || currentPlan === plan.key || hasPaidPlan} onClick={() => void checkout(plan.key)} className="mt-auto rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60">{currentPlan === plan.key ? c.current : hasPaidPlan ? PLAN_CHANGE_COPY[locale] : opening === plan.key ? c.opening : !session?.user && !isPending ? c.signIn : c.choose}</button>}
        </div>
      </IntelligenceCard>)}
    </div>
    <div className="mx-auto mt-8 max-w-3xl space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center">
      <p className="font-semibold text-primary">{liveBilling ? LIVE_BILLING_COPY[locale].annual : expansion.annualSaving}</p>
      <p className="text-sm leading-6 text-muted-foreground">{expansion.protection}</p>
    </div>
    {opening && <p className="mt-5 text-center text-sm text-muted-foreground">{c.starting}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">{error}</p>}
    <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground"><LockKeyhole className="size-4 text-primary"/>{c.secure}</p>
  </main></AppShell>
}
