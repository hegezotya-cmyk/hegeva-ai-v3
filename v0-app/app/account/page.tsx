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
  const [billingSessionId, setBillingSessionId] = useState("")
  const [billingSuccess, setBillingSuccess] = useState(false)
  const [billingConfirmError, setBillingConfirmError] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setBillingReturn(params.get("billing") === "success")
    const sessionId = params.get("session_id") || ""
    setBillingSessionId(sessionId.startsWith("cs_test_") ? sessionId : "")
  }, [])

  const loginCallbackHref = useMemo(() => {
    const target = new URLSearchParams()
    if (billingReturn) target.set("billing", "success")
    if (billingSessionId) target.set("session_id", billingSessionId)
    const callback = target.size > 0 ? `/account?${target.toString()}` : "/account"
    return `/login?callbackURL=${encodeURIComponent(callback)}`
  }, [billingReturn, billingSessionId])

  useEffect(() => {
    if (!session?.user) return
    let active = true
    const loadPlan = async () => {
      const params = new URLSearchParams(window.location.search)
      const returnedFromCheckout = params.get("billing") === "success"
      const sessionId = params.get("session_id")

      if (returnedFromCheckout) {
        if (!sessionId?.startsWith("cs_test_")) {
          if (active) {
            setBillingSuccess(false)
            setBillingConfirmError("missing_session_id")
          }
        } else {
          const confirmResponse = await fetch("/api/billing/confirm", {
            method:"POST",
            credentials:"include",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({sessionId}),
          }).catch(() => null)
          if (!confirmResponse?.ok) {
            const errorData = await confirmResponse?.json().catch(() => null)
            const code = typeof errorData?.code === "string" ? errorData.code : `http_${confirmResponse?.status || 0}`
            if (active) {
              setBillingSuccess(false)
              setBillingConfirmError(code)
            }
          } else if (active) {
            setBillingConfirmError("")
            setBillingSuccess(true)
          }
        }
      }

      const response = await fetch("/api/plan/status", { credentials:"include", cache:"no-store" })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data) throw new Error("plan")
      if (active) {
        setPlanError(false)
        setPlan({
          plan: typeof data.plan === "string" ? data.plan : "basic",
          aiMessages: Number(data.aiMessages) || 0,
          aiLimit: Number(data.aiLimit) || 0,
          period: typeof data.period === "string" ? data.period : "",
        })
      }
    }
    loadPlan()
      .catch(() => { if (active) setPlanError(true) })
    /*
      The separate admin check must not block plan confirmation or display.
    */
    fetch("/api/admin/contact-leads", { credentials:"include", cache:"no-store" })
      .then((response) => { if (active) setIsOwner(response.ok) })
      .catch(() => {})
    return () => { active = false }
  }, [session?.user])

  async function logout() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
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
      {billingConfirmError && <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{c.unavailable} <span className="font-mono">({billingConfirmError})</span></p>}
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
          {isOwner && <Link href="/admin/contact-leads" className="rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary/15">{leadsCopy.inbox}</Link>}
          <Link href="/contact" className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold transition-colors hover:bg-secondary">{c.support}</Link>
          <button type="button" onClick={() => void logout()} className="mt-3 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">{c.logout}</button>
        </aside>
      </div>
    </main>
  </AppShell>
}
