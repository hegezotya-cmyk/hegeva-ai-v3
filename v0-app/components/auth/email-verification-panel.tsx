"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/provider"
import { AUTH_COPY } from "@/lib/i18n/auth-copy"

type EmailVerificationPanelProps = {
  status?: string
  error?: string
}

export function EmailVerificationPanel({
  status,
  error,
}: EmailVerificationPanelProps) {
  const { locale } = useI18n()
  const c = AUTH_COPY[locale]
  const expired = error === "TOKEN_EXPIRED"
  const invalid = Boolean(error) && !expired
  const verified = status === "verified" && !error

  const title = verified
    ? c.verificationSuccessful
    : expired
      ? c.verificationExpired
      : invalid
        ? c.verificationInvalid
        : c.verificationRequired
  const message = verified
    ? c.verificationSuccessfulBody
    : expired
      ? c.verificationExpiredBody
      : invalid
        ? c.verificationInvalidBody
        : c.verificationRequiredBody

  return (
    <section className="glass-panel rounded-2xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>
      <Link href="/login" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
        {verified ? c.continueToLogin : c.returnLogin}
      </Link>
    </section>
  )
}
