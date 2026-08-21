"use client"

import { AuthPanel } from "@/components/auth/auth-panel"
import { useI18n } from "@/lib/i18n/provider"
import { AUTH_COPY } from "@/lib/i18n/auth-copy"

export default function LoginPage() {
  const { locale } = useI18n()
  const c = AUTH_COPY[locale]
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-5xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <section>
        <p className="mb-3 text-sm font-medium text-primary">HEGEVA AI</p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          {c.title}
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          {c.subtitle}
        </p>
        <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="glass-panel rounded-xl p-4">Better Auth session security</div>
          <div className="glass-panel rounded-xl p-4">Cloudflare D1 account data</div>
          <div className="glass-panel rounded-xl p-4">Protected AI endpoints</div>
          <div className="glass-panel rounded-xl p-4">Password recovery backend ready</div>
        </div>
      </section>

      <AuthPanel />
    </main>
  )
}
