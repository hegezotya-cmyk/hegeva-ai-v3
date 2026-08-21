"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient, signIn, signUp, useSession } from "@/lib/auth-client"

export function AuthPanel() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setBusy(true)

    try {
      if (mode === "register") {
        const result = await signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        })

        if (result.error) {
          setError(result.error.message || "Registration failed.")
          return
        }
      } else {
        const result = await signIn.email({
          email: email.trim(),
          password,
        })

        if (result.error) {
          setError(result.error.message || "Login failed.")
          return
        }
      }

      await authClient.getSession()
      router.push("/command-center")
      router.refresh()
    } catch {
      setError("Authentication is temporarily unavailable.")
    } finally {
      setBusy(false)
    }
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Checking your session…</p>
  }

  if (session?.user) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <p className="text-sm text-muted-foreground">You are signed in as</p>
        <p className="mt-1 font-semibold">{session.user.email}</p>
        <button
          type="button"
          onClick={() => router.push("/command-center")}
          className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Open Command Center
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
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register")
            setError("")
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              placeholder="Your name"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
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

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            maxLength={128}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            placeholder="Minimum 8 characters"
          />
        </label>

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        HEGEVA uses the connected Better Auth backend. Account access is only shown as active after a real authenticated session is returned.
      </p>
    </div>
  )
}
