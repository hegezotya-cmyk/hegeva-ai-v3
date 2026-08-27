"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, Bot, CreditCard, Gauge, LogOut, ShieldCheck, Sparkles, UserRound } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { AICore, SignalIcon } from "@/components/visual-engine"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { ACCOUNT_COPY } from "@/lib/i18n/account-copy"
import { LEADS_COPY } from "@/lib/i18n/leads-copy"

type PlanStatus = { plan:string; aiMessages:number; aiLimit:number; period:string }

const PAID_PLANS = new Set(["premium", "pro"])

export default function AccountPage() {
  const router = useRouter()
  const { locale } = useI18n()
  const c = ACCOUNT_COPY[locale]
  const leadsCopy = LEADS_COPY[locale]
  const [isOwner, setIsOwner] = useState(false)
  const { data: session, isPending } = authClient.useSession()
  const [plan, setPlan] = useState<PlanStatus | null>(null)
  const [planError, setPlanError] = useState(false)
  const [billingReturn, setBillingReturn] = useState(false)
  const [billingSuccess, setBillingSuccess] = useState(false)
  const [billingConfirmError, setBillingConfirmError] = useState("")
  const [loggingOut, setLoggingOut] = useState(false)
  const [openingBilling, setOpeningBilling] = useState(false)
  const [billingPortalError, setBillingPortalError] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setBillingReturn(params.get("billing") === "success")
  }, [])

  const loginCallbackHref = useMemo(() => {
    const callback = billingReturn ? "/account?billing=success" : "/account"
    return `/login?callbackURL=${encodeURIComponent(callback)}`
  }, [billingReturn])

  useEffect(() => {
    if (!session?.user) return
    let active = true

    const fetchPlan = async () => {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 8000)
      try {
        const response = await fetch("/api/plan/status", {
          credentials:"include",
          cache:"no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        })
        const data = await response.json().catch(() => null)
        if (!response.ok || !data) throw new Error("plan")
        return {
          plan: typeof data.plan === "string" ? data.plan : "basic",
          aiMessages: Number(data.aiMessages) || 0,
          aiLimit: Number(data.aiLimit) || 0,
          period: typeof data.period === "string" ? data.period : "",
        } satisfies PlanStatus
      } finally {
        window.clearTimeout(timeout)
      }
    }

    const clearBillingQuery = () => {
      const params = new URLSearchParams(window.location.search)
      if (!params.has("billing")) return
      params.delete("billing")
      const query = params.toString()
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`)
    }

    const loadPlan = async () => {
      const returnedFromCheckout = new URLSearchParams(window.location.search).get("billing") === "success"
      let latest = await fetchPlan()

      if (returnedFromCheckout && !PAID_PLANS.has(latest.plan)) {
        for (let attempt = 0; attempt < 4 && active; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200))
          latest = await fetchPlan()
          if (PAID_PLANS.has(latest.plan)) break
        }
      }

      if (!active) return
      setPlanError(false)
      setPlan(latest)

      if (returnedFromCheckout) {
        const paid = PAID_PLANS.has(latest.plan)
        setBillingSuccess(paid)
        setBillingConfirmError(paid ? "" : "entitlement_pending")
        clearBillingQuery()
      }
    }

    loadPlan().catch(() => {
      if (!active) return
      setPlanError(true)
      if (billingReturn) {
        setBillingSuccess(false)
        setBillingConfirmError("plan_status_unavailable")
      }
    })

    fetch("/api/admin/contact-leads", { credentials:"include", cache:"no-store" })
      .then((response) => { if (active) setIsOwner(response.ok) })
      .catch(() => {})

    return () => { active = false }
  }, [billingReturn, session?.user])

  async function logout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await authClient.signOut()
      router.replace("/")
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  async function openBillingPortal() {
    if (openingBilling) return
    setOpeningBilling(true)
    setBillingPortalError(false)
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || typeof data?.url !== "string" || !data.url.startsWith("https://billing.stripe.com/")) {
        throw new Error("portal")
      }
      window.location.assign(data.url)
    } catch {
      setBillingPortalError(true)
      setOpeningBilling(false)
    }
  }

  if (isPending) return <AppShell><main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><div className="ve-panel relative overflow-hidden rounded-3xl p-8 text-sm text-muted-foreground"><div className="flex items-center gap-4"><AICore state="thinking"/><span>{c.checking}</span></div></div></main></AppShell>

  if (!session?.user) return <AppShell><main className="relative mx-auto max-w-3xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8"><div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-violet/10 blur-3xl"/><PageHeader eyebrow={c.eyebrow} title={c.signInTitle} subtitle={c.signInBody}/>{billingReturn && <p role="status" className="mt-6 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-foreground shadow-[0_18px_60px_-45px_rgba(16,185,129,.8)]">{c.billingSignIn}</p>}<Link href={loginCallbackHref} className="mt-8 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-20px_rgba(16,185,129,.8)] transition hover:-translate-y-0.5">{c.signIn}</Link></main></AppShell>

  const used = plan?.aiMessages || 0
  const limit = plan?.aiLimit || 0
  const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

  return <AppShell>
    <main className="relative mx-auto max-w-6xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-32 top-28 h-72 w-72 rounded-full bg-primary/9 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-16 h-80 w-80 rounded-full bg-violet/9 blur-3xl" />

      <div className="relative z-10 flex items-start gap-4">
        <AICore state="active" className="mt-1" />
        <div className="min-w-0 flex-1"><PageHeader eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}/></div>
      </div>

      {billingSuccess && <p role="status" className="relative z-10 mt-6 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-foreground shadow-[0_18px_60px_-45px_rgba(16,185,129,.8)]">{c.billingSuccess}</p>}
      {billingConfirmError && <p role="alert" className="relative z-10 mt-4 rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm text-muted-foreground">{c.unavailable} <span className="font-mono">({billingConfirmError})</span></p>}

      <div className="relative z-10 mt-8 grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
        <section className="ve-panel ve-tone-cyan relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><SignalIcon icon={UserRound} tone="cyan" className="size-11 rounded-2xl"/><div><p className="ve-eyebrow mb-1">HEGEVA IDENTITY</p><h2 className="text-lg font-semibold">{c.details}</h2></div></div>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">{plan?.plan || "—"}</span>
          </div>

          <dl className="divide-y divide-border/80 rounded-2xl border border-white/8 bg-background/20 px-4">
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-muted-foreground">{c.name}</dt><dd className="break-words text-sm font-medium">{session.user.name || "—"}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-muted-foreground">{c.email}</dt><dd className="break-all text-sm font-medium">{session.user.email}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-muted-foreground">{c.plan}</dt><dd className="text-sm font-semibold capitalize text-primary">{plan?.plan || (planError ? "—" : c.checking)}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-muted-foreground">{c.period}</dt><dd className="text-sm font-medium">{plan?.period || "—"}</dd></div>
          </dl>

          {plan && <div className="mt-6 rounded-2xl border border-white/8 bg-background/25 p-4">
            <div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><Gauge className="size-4 text-cyan"/>{c.usage}</span><strong>{used} / {limit}</strong></div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary via-cyan to-violet transition-[width]" style={{width:`${percentage}%`}}/></div>
            <p className="mt-2 text-right text-xs text-muted-foreground">{percentage}%</p>
          </div>}
          {planError && <p className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-muted-foreground">{c.unavailable}</p>}
        </section>

        <aside className="ve-panel ve-tone-violet relative overflow-hidden rounded-3xl p-6">
          <div className="mb-5 flex items-center gap-3"><SignalIcon icon={Sparkles} tone="violet" className="size-11 rounded-2xl"/><div><p className="ve-eyebrow mb-1">HEGEVA CONTROL</p><h2 className="text-base font-semibold">Quick access</h2></div></div>
          <div className="grid gap-3">
            <Link href="/command-center" className="group flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/15"><span className="flex items-center gap-2"><Activity className="size-4"/>{c.workspace}</span><span>→</span></Link>
            <Link href="/assistant" className="group flex items-center justify-between rounded-2xl border border-cyan/20 bg-cyan/8 px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-cyan/35"><span className="flex items-center gap-2"><Bot className="size-4 text-cyan"/>{c.assistant}</span><span>→</span></Link>
            <Link href="/pricing" className="group flex items-center justify-between rounded-2xl border border-gold/20 bg-gold/8 px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-gold/35"><span className="flex items-center gap-2"><CreditCard className="size-4 text-gold"/>{c.pricing}</span><span>→</span></Link>
            {plan && PAID_PLANS.has(plan.plan) && <button type="button" disabled={openingBilling} onClick={() => void openBillingPortal()} className="min-h-11 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60">{openingBilling ? c.checking : `${c.plan} · Stripe Sandbox`}</button>}
            {billingPortalError && <p role="alert" className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-muted-foreground">{c.unavailable}</p>}
            {isOwner && <Link href="/admin/contact-leads" className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-center text-sm font-semibold text-primary transition hover:bg-primary/15">{leadsCopy.inbox}</Link>}
            <Link href="/contact" className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-background/25 px-5 py-3 text-sm font-semibold transition hover:bg-secondary"><ShieldCheck className="size-4 text-primary"/>{c.support}</Link>
            <button type="button" disabled={loggingOut} onClick={() => void logout()} className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-background/25 px-5 py-3 text-sm font-semibold text-muted-foreground transition hover:border-destructive/30 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"><LogOut className="size-4"/>{loggingOut ? c.checking : c.logout}</button>
          </div>
        </aside>
      </div>
    </main>
  </AppShell>
}