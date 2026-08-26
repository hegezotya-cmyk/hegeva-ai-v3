"use client"

import { Check, LockKeyhole } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { PRICING_COPY } from "@/lib/i18n/pricing-copy"

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
    const billingReady = billingStatus?.mode === "test" && billingStatus.checkoutEnabled === true && billingStatus.webhookConfigured === true
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
        body: JSON.stringify({ plan, mode: "test" }),
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
    { key: "basic", name: c.basic, price: c.free, features: c.basicFeatures },
    { key: "premium", name: c.premium, price: "£14.99", features: c.premiumFeatures, featured: true },
    { key: "pro", name: c.pro, price: "£29.99", features: c.proFeatures },
  ] as const

  const hasPaidPlan = currentPlan === "premium" || currentPlan === "pro"
  const billingReady = billingStatus?.mode === "test" && billingStatus.checkoutEnabled === true && billingStatus.webhookConfigured === true

  return <AppShell><main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold tracking-[0.18em] text-primary">{c.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{c.title}</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{c.subtitle}</p>
      <p className="mt-5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{c.sandbox}</p>
      {session?.user && <p role="status" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${billingReady ? "border-primary/30 bg-primary/10 text-primary" : "border-gold/30 bg-gold/10 text-gold"}`}>{billingStatusLoading ? c.checkingBilling : billingReady ? c.billingReady : c.billingIncomplete}</p>}
      {billingCancelled && <p role="status" className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{BILLING_CANCELLED_COPY[locale]}</p>}
    </div>
    <div className="mt-10 grid gap-5 lg:grid-cols-3">
      {plans.map((plan) => <section key={plan.key} className={`glass-panel flex rounded-3xl p-6 sm:p-8 ${"featured" in plan && plan.featured ? "border-primary/50 ring-1 ring-primary/25" : ""}`}>
        <div className="flex w-full flex-col">
          <h2 className="text-xl font-semibold">{plan.name}</h2>
          <div className="mt-5 flex items-end gap-2"><strong className="text-4xl font-bold">{plan.price}</strong>{plan.key !== "basic" && <span className="pb-1 text-sm text-muted-foreground">/ {c.month}</span>}</div>
          <ul className="mt-7 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-primary"/><span>{feature}</span></li>)}</ul>
          {plan.key === "basic" ? <button type="button" disabled className="mt-8 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground">{currentPlan === "basic" ? c.current : c.free}</button> : <button type="button" disabled={opening !== null || isPending || planLoading || billingStatusLoading || (Boolean(session?.user) && !billingReady) || currentPlan === plan.key || hasPaidPlan} onClick={() => void checkout(plan.key)} className="mt-8 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60">{currentPlan === plan.key ? c.current : hasPaidPlan ? PLAN_CHANGE_COPY[locale] : opening === plan.key ? c.opening : !session?.user && !isPending ? c.signIn : c.choose}</button>}
        </div>
      </section>)}
    </div>
    {opening && <p className="mt-5 text-center text-sm text-muted-foreground">{c.starting}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">{error}</p>}
    <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground"><LockKeyhole className="size-4 text-primary"/>{c.secure}</p>
  </main></AppShell>
}
