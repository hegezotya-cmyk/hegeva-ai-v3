"use client"

import { useI18n } from "@/lib/i18n/provider"
import { AUTH_COPY } from "@/lib/i18n/auth-copy"

export function ResetPasswordHeader() {
  const { locale } = useI18n()
  const c = AUTH_COPY[locale]
  return <div className="mb-8"><p className="mb-3 text-sm font-medium text-primary">HEGEVA AI</p><h1 className="text-4xl font-bold tracking-tight">{c.resetTitle}</h1><p className="mt-4 text-muted-foreground">{c.resetSubtitle}</p></div>
}
