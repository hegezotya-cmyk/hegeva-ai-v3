"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
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

  if (isPending) return <AppShell><main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><div className="glass-panel rounded-3xl p-8 text-sm text-muted-foreground">{c.checking}</div></main></AppShell>

  if (!session?.user) return <AppShell><main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"><PageHeader eyebrow={c.eyebrow} title={c.signInTitle} subtitle={c.signInBody}/>{billingReturn && <p role="status" className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-foreground">{c.billingSignIn}</p>}<Link href={loginCallbackHref} className="mt-8 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{c.signIn}</Link></main></AppShell>

  const used = plan?.aiMessages || 0
  const limit = plan?.aiLimit || 0
  const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

  return <AppShell>
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}/>
      {billingSuccess && <p role="status" className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-foreground">{c.billingSuccess}</p>}
      {billingConfirmError && <p role="alert" className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-muted-foreground">{c.unavailable} <span className="font-mono">({billingConfirmError})</span></p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <h2 className="text-lg font-semibold">{c.details}</h2>
          <dl className="mt-6 divide-y divide-border">
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-muted-foreground">{c.name}</dt><dd className="break-words text-sm font-medium">{session.user.name || "—"}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-muted-foreground">{c.email}</dt><dd className="break-all text-sm font-medium">{session.user.email}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-muted-foreground">{c.plan}</dt><dd className="text-sm font-semibold capitalize text-primary">{plan?.plan || (planError ? "—" : c.checking)}</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-sm text-muted-foreground">{c.period}</dt><dd className="text-sm font-medium">{plan?.period || "—"}</dd></div>
          </dl>
          {plan && <div className="mt-5">
            <div className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{c.usage}</span><strong>{used} / {limit}</strong></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{width:`${percentage}%`}}/></div>
          </div>}
          {planError && <p className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-muted-foreground">{c.unavailable}</p>}
        </section>
        <aside className="glass-panel flex flex-col gap-3 rounded-3xl p-6">
          <Link href="/command-center" className="rounded-xl bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground">{c.workspace}</Link>
          <Link href="/assistant" className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold transition-colors hover:bg-secondary">{c.assistant}</Link>
          <Link href="/pricing" className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold transition-colors hover:bg-secondary">{c.pricing}</Link>
          {plan && PAID_PLANS.has(plan.plan) && <button type="button" disabled={openingBilling} onClick={() => void openBillingPortal()} className="min-h-11 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60">{openingBilling ? c.checking : `${c.plan} · Stripe Sandbox`}</button>}
          {billingPortalError && <p role="alert" className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-muted-foreground">{c.unavailable}</p>}
          {isOwner && <Link href="/admin/contact-leads" className="rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary/15">{leadsCopy.inbox}</Link>}
          <Link href="/contact" className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold transition-colors hover:bg-secondary">{c.support}</Link>
          <button type="button" disabled={loggingOut} onClick={() => void logout()} className="mt-3 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60">{loggingOut ? c.checking : c.logout}</button>
        </aside>
      </div>
    </main>
  </AppShell>
}
