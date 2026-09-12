"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { AUTH_COPY } from "@/lib/i18n/auth-copy"

type ResetPasswordPanelProps = {
  token?: string
  tokenError?: string
}

export function ResetPasswordPanel({ token, tokenError }: ResetPasswordPanelProps) {
  const { locale } = useI18n()
  const c = AUTH_COPY[locale]
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(tokenError ? c.invalid : "")
  const [complete, setComplete] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!token) {
      setError(c.invalid)
      return
    }

    if (password !== confirmation) {
      setError(c.mismatch)
      return
    }

    setBusy(true)

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (result.error) {
        setError(c.resetFailed)
        return
      }

      setComplete(true)
    } catch {
      setError(c.resetUnavailable)
    } finally {
      setBusy(false)
    }
  }

  if (complete) {
    return (
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">{c.updated}</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {c.sessionsClosed}
        </p>
        <Link href="/login" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          {c.returnLogin}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="glass-panel space-y-4 rounded-2xl p-6 sm:p-8">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{c.newPassword}</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{c.confirm}</span>
        <input
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="w-full rounded-xl border border-input bg-input/30 px-3.5 py-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </label>
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !token}
        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {busy ? c.updating : c.update}
      </button>
      <Link href="/login" className="block text-center text-sm font-medium text-muted-foreground hover:text-foreground">
        {c.back}
      </Link>
    </form>
  )
}
