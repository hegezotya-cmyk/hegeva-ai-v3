"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/provider"
import { getStudioCopy } from "@/lib/i18n/studio-copy"

export default function GetStartedPage() {
  const { locale } = useI18n()
  const c = getStudioCopy(locale)
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium text-primary">HEGEVA AI</p>

      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
        {c.getTitle}
      </h1>

      <p className="mt-4 max-w-2xl text-muted-foreground">
        {c.getSub}
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Link
          href="/command-center"
          className="glass-panel rounded-2xl p-6 transition hover:-translate-y-0.5"
        >
          <h2 className="text-lg font-semibold">{c.cc}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {c.ccBody}
          </p>
        </Link>

        <Link
          href="/app-studio"
          className="glass-panel rounded-2xl p-6 transition hover:-translate-y-0.5"
        >
          <h2 className="text-lg font-semibold">{c.studio}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {c.studioBody}
          </p>
        </Link>

        <Link
          href="/business"
          className="glass-panel rounded-2xl p-6 transition hover:-translate-y-0.5"
        >
          <h2 className="text-lg font-semibold">{c.business}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {c.businessBody}
          </p>
        </Link>
      </div>
    </main>
  )
}
