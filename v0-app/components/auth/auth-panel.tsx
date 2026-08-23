"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient, signIn, signUp, useSession } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { AUTH_COPY } from "@/lib/i18n/auth-copy"

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
  const [passwordRecoveryAvailable, setPasswordRecoveryAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    fetch("/api/system/email-status", {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null)
        if (!active) return
        setPasswordRecoveryAvailable(Boolean(response.ok && payload?.passwordRecovery === true))
      })
      .catch(() => {
        if (active) setPasswordRecoveryAvailable(false)
      })

    return () => {
      active = false
    }
  }, [])

  function safeCallbackURL() {
    const value = new URLSearchParams(window.location.search).get("callbackURL")
    return value?.startsWith("/") && !value.startsWith("//") ? value : "/command-center"
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setBusy(true)

    try {
      if (mode === "forgot") {
        if (passwordRecoveryAvailable === false) {
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
      } else if (mode === "register") {
        const result = await signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        })

        if (result.error) {
          setError(c.authFailed)
          return
        }
      } else {
        const result = await signIn.email({
          email: email.trim(),
          password,
        })

        if (result.error) {
          setError(c.authFailed)
          return
        }
      }

      await authClient.getSession()
      router.push(safeCallbackURL())
      router.refresh()
    } catch {
      setError(c.authUnavailable)
    } finally {
      setBusy(false)
    }
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">{c.checking}</p>
  }

  if (session?.user) {
    return (
      <div className="glass-panel rounded-2xl p-6">
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
    <div className="glass-panel rounded-2xl p-6 sm:p-8">
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

      <form onSubmit={handleSubmit} className="space-y-4">
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
              if (passwordRecoveryAvailable === false) {
                setError(c.authUnavailable)
                return
              }
              setMode("forgot")
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
