"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient, signIn, signUp, useSession } from "@/lib/auth-client"
import { HEGEVA_EMAIL_VERIFICATION_CALLBACK } from "@/lib/auth-verification"
import { useI18n } from "@/lib/i18n/provider"
import { AUTH_COPY } from "@/lib/i18n/auth-copy"
import { SkeletonSurface } from "@/components/visual-engine"
import { DEMO_REGISTRATION_KEY, readDemoRegistrationContext } from "@/components/acquisition/acquisition-attribution"

export function AuthPanel() {
  const router = useRouter()
  const { locale } = useI18n()
  const c = AUTH_COPY[locale]
  const { data: session, isPending } = useSession()
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [verificationPending, setVerificationPending] = useState(false)
  const [passwordRecoveryAvailable, setPasswordRecoveryAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "register") setMode("register")
  }, [])

  useEffect(() => {
    if (mode === "register" && !isPending && !session?.user) {
      const demoContext = readDemoRegistrationContext()
      window.dispatchEvent(new CustomEvent("hegeva:analytics-event", {
        detail: {
          event: "registration_start",
          path: "/login",
          params: demoContext ? { entry_context: "demo", demo_business_type: demoContext.businessType } : {},
        },
      }))
    }
  }, [mode, isPending, session?.user])

  async function checkPasswordRecovery() {
    if (passwordRecoveryAvailable !== null) return passwordRecoveryAvailable

    try {
      const response = await fetch("/api/system/email-status", {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      })
      const payload = await response.json().catch(() => null)
      const available = Boolean(response.ok && payload?.passwordRecovery === true)
      setPasswordRecoveryAvailable(available)
      return available
    } catch {
      setPasswordRecoveryAvailable(false)
      return false
    }
  }

  function safeCallbackURL(fallback = "/command-center") {
    const value = new URLSearchParams(window.location.search).get("callbackURL")
    return value?.startsWith("/") && !value.startsWith("//") ? value : fallback
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setBusy(true)
    try {
      if (mode === "forgot") {
        const recoveryAvailable = await checkPasswordRecovery()
        if (!recoveryAvailable) {
          setError(c.authUnavailable)
          return
        }

        const result = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: "/reset-password",
        })

        if (result.error) {
          setError(c.authFailed)
          return
        }

        setSuccess(c.resetSent)
        return
      }

      if (mode === "register") {
        const result = await signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
          callbackURL: HEGEVA_EMAIL_VERIFICATION_CALLBACK,
        })

        if (result.error) {
          setError(c.authFailed)
          return
        }
        try { sessionStorage.removeItem(DEMO_REGISTRATION_KEY) } catch {}
        setVerificationPending(true)
        setSuccess(c.verificationRequired)
        return
      } else {
        const result = await signIn.email({
          email: email.trim(),
          password,
          callbackURL: HEGEVA_EMAIL_VERIFICATION_CALLBACK,
        })

        if (result.error) {
          if (result.error.code === "EMAIL_NOT_VERIFIED") {
            setVerificationPending(true)
            setError(c.verificationRequired)
          } else {
            setError(c.authFailed)
          }
          return
        }
      }

      const verifiedSession = await authClient.getSession()
      if (!verifiedSession.data?.user) {
        setError(c.authFailed)
        return
      }

      router.push(safeCallbackURL())
      router.refresh()
    } catch {
      setError(c.authUnavailable)
    } finally {
      setBusy(false)
    }
  }

  async function resendVerification() {
    setError("")
    setSuccess("")
    setBusy(true)

    try {
      const result = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: HEGEVA_EMAIL_VERIFICATION_CALLBACK,
      })

      if (result.error) {
        if (result.error.code === "EMAIL_ALREADY_VERIFIED") {
          setSuccess(c.alreadyVerified)
        } else {
          setError(c.verificationUnavailable)
        }
        return
      }

      setSuccess(c.verificationResent)
    } catch {
      setError(c.verificationUnavailable)
    } finally {
      setBusy(false)
    }
  }

  if (isPending) {
    return <SkeletonSurface lines={4} className="min-h-64" />
  }

  if (session?.user) {
    return (
      <div className="ve-panel rounded-3xl p-6">
        <p className="text-sm text-muted-foreground">{c.signedIn}</p>
        <p className="mt-1 font-semibold">{session.user.email}</p>
        <button
          type="button"
          onClick={() => router.push(safeCallbackURL())}
          className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {c.open}
        </button>
      </div>
    )
  }

  return (
    <div className="ve-panel rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex gap-2 rounded-xl border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login")
            setError("")
            setSuccess("")
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          {c.login}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register")
            setError("")
            setSuccess("")
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          {c.register}
        </button>
      </div>

      <form onSubmit={handleSubmit} data-registration-active={mode === "register" ? "true" : undefined} className="space-y-4">
        {mode === "register" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">{c.name}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              placeholder={c.yourName}
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{c.email}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            placeholder="you@example.com"
          />
        </label>

        {mode !== "forgot" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">{c.password}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              maxLength={128}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              placeholder={c.minPassword}
            />
          </label>
        )}

        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              setError("")
              setSuccess("")
              setMode("forgot")
              void checkPasswordRecovery()
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            {c.forgot}
          </button>
        )}

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
            {success}
          </p>
        )}

        {verificationPending && (
          <button
            type="button"
            onClick={() => void resendVerification()}
            disabled={busy || !email.trim()}
            className="w-full rounded-xl border border-input px-4 py-3 text-sm font-semibold text-foreground disabled:opacity-60"
          >
            {c.resendVerification}
          </button>
        )}

        <button
          type="submit"
          disabled={busy || (mode === "forgot" && passwordRecoveryAvailable === false)}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? c.wait : mode === "login" ? c.login : mode === "register" ? c.create : c.sendReset}
        </button>

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setError("")
              setSuccess("")
            }}
            className="w-full text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {c.back}
          </button>
        )}
      </form>

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        {c.honesty}
      </p>
    </div>
  )
}
