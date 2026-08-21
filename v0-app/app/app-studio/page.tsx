import Link from "next/link"
import { ArrowRight, Hammer, Sparkles, Wrench } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StudioModuleCard } from "@/components/app-studio/module-card"

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
            status="coming"
            accent="cyan"
          />
          <StudioModuleCard
            icon={Wrench}
            moduleKey="fix"
            href="/app-studio/fix-my-app"
            status="coming"
            accent="gold"
          />
        </div>
      </div>
    </AppShell>
  )
}

function AppStudioHubHeader() {
  return (
    <PageHeader
      eyebrow="HEGEVA App Studio"
      title="Build software the HEGEVA way"
      subtitle="Three flagship modules take you from a raw idea to a professional, production-ready application — guided end to end by HEGEVA AI."
      action={
        <Link
          href="/app-studio/prompt-my-app"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 glow-emerald"
        >
          Start with an idea
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    />
  )
}
