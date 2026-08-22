"use client"

import Link from "next/link"
import { ArrowRight, Hammer, Sparkles, Wrench } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StudioModuleCard } from "@/components/app-studio/module-card"
import { useI18n } from "@/lib/i18n/provider"
import { getStudioCopy } from "@/lib/i18n/studio-copy"

export default function AppStudioPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <AppStudioHubHeader />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <StudioModuleCard
            icon={Sparkles}
            moduleKey="prompt"
            href="/app-studio/prompt-my-app"
            status="beta"
            accent="emerald"
          />
          <StudioModuleCard
            icon={Hammer}
            moduleKey="build"
            href="/app-studio/build-my-app"
            status="beta"
            accent="cyan"
          />
          <StudioModuleCard
            icon={Wrench}
            moduleKey="fix"
            href="/app-studio/fix-my-app"
            status="beta"
            accent="gold"
          />
        </div>
      </div>
    </AppShell>
  )
}

function AppStudioHubHeader() {
  const { locale } = useI18n()
  const c = getStudioCopy(locale)
  return (
    <PageHeader
      eyebrow="HEGEVA App Studio"
      title={c.hubTitle}
      subtitle={c.hubSub}
      action={
        <Link
          href="/app-studio/prompt-my-app"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 glow-emerald"
        >
          {c.start}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    />
  )
}
