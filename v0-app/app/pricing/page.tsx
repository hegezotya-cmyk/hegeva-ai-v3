"use client"

import { Check, Crown, LockKeyhole, ShieldCheck, Sparkles, Star, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { PRICING_COPY } from "@/lib/i18n/pricing-copy"
import { AICore, IntelligenceCard, SignalIcon } from "@/components/visual-engine"

type PaidPlan = "premium" | "pro"
type BillingStatus = { checkoutEnabled?: boolean; webhookConfigured?: boolean; mode?: string }

const PLAN_CHANGE_COPY = { en:"Plan changes are coming soon",hu:"Csomagváltás hamarosan",de:"Tarifwechsel folgt bald",fr:"Changement d’offre bientôt disponible",es:"Cambio de plan próximamente" } as const
const BILLING_CANCELLED_COPY = { en:"Checkout was cancelled. Your current plan was not changed and no HEGEVA entitlement was activated.",hu:"A fizetési folyamat megszakadt. A jelenlegi csomagod nem változott, és nem aktiválódott új HEGEVA jogosultság.",de:"Der Checkout wurde abgebrochen. Dein aktueller Tarif wurde nicht geändert und es wurde keine neue HEGEVA-Berechtigung aktiviert.",fr:"Le paiement a été annulé. Votre offre actuelle n’a pas été modifiée et aucun nouvel accès HEGEVA n’a été activé.",es:"El pago fue cancelado. Tu plan actual no cambió y no se activó ningún nuevo acceso de HEGEVA." } as const

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 10000) {
  const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  try { return await fetch(input, { ...init, signal: controller.signal }) } finally { window.clearTimeout(timeout) }
}

export default function PricingPage() {
  const router = useRouter(); const { locale } = useI18n(); const c = PRICING_COPY[locale]
  const { data: session, isPending } = authClient.useSession()
  const [opening, setOpening] = useState<PaidPlan | null>(null); const [error, setError] = useState("")
  const [currentPlan, setCurrentPlan] = useState<string | null>(null); const [planLoading, setPlanLoading] = useState(false)
  const [billingCancelled, setBillingCancelled] = useState(false); const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null); const [billingStatusLoading, setBillingStatusLoading] = useState(false)

  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("billing") === "cancelled") { setBillingCancelled(true); params.delete("billing"); const query = params.toString(); window.history.replaceState(null,"",`${window.location.pathname}${query?`?${query}`:""}${window.location.hash}`) } }, [])
  useEffect(() => {
    if (!session?.user) { setCurrentPlan(null); setBillingStatus(null); setPlanLoading(false); return }
    let active = true; setPlanLoading(true); setBillingStatusLoading(true)
    void fetchWithTimeout("/api/plan/status", { credentials:"include", cache:"no-store", headers:{Accept:"application/json"} })
      .then(async response => { const data = await response.json().catch(()=>null); if (!response.ok || typeof data?.plan !== "string") throw new Error("plan"); if(active) setCurrentPlan(data.plan) })
      .catch(()=>{ if(active){ setCurrentPlan(null); setError(c.unavailable) } }).finally(()=>{ if(active) setPlanLoading(false) })
    void fetchWithTimeout("/api/billing/status", { credentials:"include", cache:"no-store", headers:{Accept:"application/json"} })
      .then(async response => { const data = await response.json().catch(()=>null); if(!response.ok || !data) throw new Error("billing"); if(active) setBillingStatus(data) })
      .catch(()=>{ if(active) setBillingStatus({checkoutEnabled:false,webhookConfigured:false}) }).finally(()=>{ if(active) setBillingStatusLoading(false) })
    return () => { active = false }
  }, [session?.user, c.unavailable])

  async function checkout(plan: PaidPlan) {
    if (!session?.user) { router.push("/login?callbackURL=%2Fpricing"); return }
    const billingReady = billingStatus?.mode === "test" && billingStatus.checkoutEnabled === true && billingStatus.webhookConfigured === true
    if (planLoading || billingStatusLoading || !billingReady) { setError(c.billingIncomplete); return }
    setBillingCancelled(false); setOpening(plan); setError("")
    try {
      const response = await fetchWithTimeout("/api/billing/checkout", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json",Accept:"application/json"}, body:JSON.stringify({ plan, mode:"test" }) }, 15000)
      const data = await response.json().catch(()=>null); if(!response.ok || typeof data?.url !== "string") throw new Error("checkout"); window.location.assign(data.url)
    } catch { setError(c.unavailable); setOpening(null) }
  }

  const plans = [
    { key:"basic", name:c.basic, price:c.free, features:c.basicFeatures, tone:"cyan" as const, icon:Sparkles },
    { key:"premium", name:c.premium, price:"£14.99", features:c.premiumFeatures, featured:true, tone:"gold" as const, icon:Crown },
    { key:"pro", name:c.pro, price:"£29.99", features:c.proFeatures, tone:"violet" as const, icon:Zap },
  ] as const
  const hasPaidPlan = currentPlan === "premium" || currentPlan === "pro"
  const billingReady = billingStatus?.mode === "test" && billingStatus.checkoutEnabled === true && billingStatus.webhookConfigured === true

  return <AppShell><main className="relative mx-auto max-w-6xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
    <div className="pointer-events-none absolute -left-20 top-24 size-72 rounded-full bg-cyan/10 blur-3xl" />
    <div className="pointer-events-none absolute right-0 top-12 size-80 rounded-full bg-gold/10 blur-3xl" />
    <div className="pointer-events-none absolute bottom-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-violet/10 blur-3xl" />

    <div className="relative mx-auto max-w-3xl text-center">
      <div className="mx-auto mb-5 flex w-fit items-center gap-3 rounded-full border border-white/10 bg-background/35 px-4 py-2 backdrop-blur-md"><AICore state="active" className="scale-90"/><span className="text-xs font-semibold uppercase tracking-[.18em] text-primary">HEGEVA PLANS</span></div>
      <p className="ve-eyebrow">{c.eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl"><span className="text-gradient-emerald">{c.title}</span></h1>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{c.subtitle}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="ve-panel ve-tone-emerald rounded-2xl p-3 text-sm"><ShieldCheck className="mx-auto size-4 text-primary"/><p className="mt-2 text-xs text-muted-foreground">Secure account plans</p></div>
        <div className="ve-panel ve-tone-cyan rounded-2xl p-3 text-sm"><Star className="mx-auto size-4 text-cyan"/><p className="mt-2 text-xs text-muted-foreground">Simple monthly options</p></div>
        <div className="ve-panel ve-tone-gold rounded-2xl p-3 text-sm"><LockKeyhole className="mx-auto size-4 text-gold"/><p className="mt-2 text-xs text-muted-foreground">Stripe sandbox protected</p></div>
      </div>
      <p className="mt-5 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold shadow-[0_0_32px_-18px_var(--gold)]">{c.sandbox}</p>
      {session?.user && <p role="status" className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${billingReady?"border-primary/30 bg-primary/10 text-primary":"border-gold/30 bg-gold/10 text-gold"}`}>{billingStatusLoading?c.checkingBilling:billingReady?c.billingReady:c.billingIncomplete}</p>}
      {billingCancelled && <p role="status" className="mt-4 rounded-2xl border border-white/10 bg-background/35 px-4 py-3 text-sm text-muted-foreground">{BILLING_CANCELLED_COPY[locale]}</p>}
    </div>

    <div className="relative mt-10 grid gap-5 lg:grid-cols-3">
      {plans.map((plan,index) => <IntelligenceCard key={plan.key} tone={plan.tone} interactive className={`flex min-h-[31rem] p-6 sm:p-8 ${"featured" in plan&&plan.featured?"border-gold/50 ring-1 ring-gold/25 shadow-[0_30px_90px_-45px_rgba(250,204,21,.45)] lg:-translate-y-3":""}`}>
        <div className="flex w-full flex-col">
          {"featured" in plan&&plan.featured && <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.14em] text-gold"><Crown className="size-3.5"/>HEGEVA FEATURED</div>}
          <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[.14em] text-muted-foreground">Level {index+1}</p><h2 className="mt-1 font-display text-xl font-semibold">{plan.name}</h2></div><SignalIcon icon={plan.icon} tone={plan.tone} className="size-11 rounded-xl"/></div>
          <div className="mt-6 flex items-end gap-2"><strong className={`font-display text-4xl font-bold ${index===1?"text-gold":index===2?"text-violet":"text-cyan"}`}>{plan.price}</strong>{plan.key!=="basic"&&<span className="pb-1 text-sm text-muted-foreground">/ {c.month}</span>}</div>
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <ul className="space-y-3">{plan.features.map(feature => <li key={feature} className="flex gap-3 text-sm text-muted-foreground"><span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${index===1?"border-gold/25 bg-gold/10 text-gold":index===2?"border-violet/25 bg-violet/10 text-violet":"border-cyan/25 bg-cyan/10 text-cyan"}`}><Check className="size-3"/></span><span>{feature}</span></li>)}</ul>
          <div className="mt-auto pt-8">
            {plan.key==="basic" ? <button type="button" disabled className="w-full rounded-xl border border-white/10 bg-background/25 px-5 py-3 text-sm font-semibold text-muted-foreground">{currentPlan==="basic"?c.current:c.free}</button> : <button type="button" disabled={opening!==null||isPending||planLoading||billingStatusLoading||(Boolean(session?.user)&&!billingReady)||currentPlan===plan.key||hasPaidPlan} onClick={()=>void checkout(plan.key)} className={`w-full rounded-xl px-5 py-3 text-sm font-semibold transition duration-200 disabled:opacity-60 ${index===1?"bg-gold text-gold-foreground shadow-[0_0_34px_-14px_var(--gold)] hover:-translate-y-0.5":"bg-primary text-primary-foreground shadow-[0_0_34px_-14px_var(--primary)] hover:-translate-y-0.5"}`}>{currentPlan===plan.key?c.current:hasPaidPlan?PLAN_CHANGE_COPY[locale]:opening===plan.key?c.opening:!session?.user&&!isPending?c.signIn:c.choose}</button>}
          </div>
        </div>
      </IntelligenceCard>)}
    </div>
    {opening&&<p className="mt-5 text-center text-sm text-muted-foreground">{c.starting}</p>}
    {error&&<p role="alert" className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">{error}</p>}
    <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground"><LockKeyhole className="size-4 text-primary"/>{c.secure}</p>
  </main></AppShell>
}
