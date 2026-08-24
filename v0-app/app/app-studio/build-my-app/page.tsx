import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Rocket } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BuildMyApp } from "@/components/app-studio/build-my-app"
import { ProjectExport } from "@/components/app-studio/project-export"
import { ProjectHistory } from "@/components/app-studio/project-history"

export const metadata: Metadata = {
  title: "Build My App X10 — HEGEVA App Studio",
  description:
    "A guided AI app-building environment that takes you from idea to build: requirements, architecture, UI, database, authentication, AI, payments and security.",
}

export default function BuildMyAppPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/app-studio/build-my-app-x20"
          className="group flex flex-col gap-4 rounded-2xl border border-gold/30 bg-gold/5 p-5 transition-colors hover:border-gold/50 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              <Rocket className="size-5" aria-hidden />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-base text-foreground">Build My App X20</strong>
                <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">PRO · BETA</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Use the stronger X20 builder for verified live apps, resumable progress and AI improvement passes.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold">
            Open X20 <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>
      </div>
      <BuildMyApp />
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <ProjectHistory />
        <ProjectExport />
      </div>
    </AppShell>
  )
}
