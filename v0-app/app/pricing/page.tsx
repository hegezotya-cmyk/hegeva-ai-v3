"use client"

import { useI18n } from "@/lib/i18n/provider"
import { getStudioCopy } from "@/lib/i18n/studio-copy"

export default function PricingPage() {
  const { locale } = useI18n()
  const c = getStudioCopy(locale)
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium text-primary">HEGEVA AI</p>
      <h1 className="text-4xl font-bold tracking-tight">{c.pricing}</h1>
      <p className="mt-4 text-muted-foreground">
        {c.pricingBody}
      </p>
    </main>
  )
}
