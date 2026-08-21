"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"

type ResetPasswordPanelProps = {
  token?: string
  tokenError?: string
}

export function ResetPasswordPanel({ token, tokenError }: ResetPasswordPanelProps) {
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(tokenError ? "This reset link is invalid or has expired." : "")
  const [complete, setComplete] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!token) {
      setError("This reset link is invalid or has expired.")
      return
    }

    if (password !== confirmation) {
      setError("The passwords do not match.")
      return
    }

    setBusy(true)

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (result.error) {
        setError(result.error.message || "Password reset failed.")
        return
      }

      setComplete(true)
    } catch {
      setError("Password reset is temporarily unavailable.")
    } finally {
      setBusy(false)
    }
  }

  if (complete) {
    return (
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Password updated</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Your existing sessions were securely closed. Sign in again with your new password.
        </p>
        <Link href="/login" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          Return to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="glass-panel space-y-4 rounded-2xl p-6 sm:p-8">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">New password</span>
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
        <span className="mb-1.5 block text-sm font-medium">Confirm new password</span>
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
        {busy ? "Updating…" : "Update password"}
      </button>
      <Link href="/login" className="block text-center text-sm font-medium text-muted-foreground hover:text-foreground">
        Back to login
      </Link>
    </form>
  )
}
