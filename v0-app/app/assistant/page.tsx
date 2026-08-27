"use client"

import { AppShell } from "@/components/app-shell"
import { AssistantChat } from "@/components/assistant/assistant-chat"
import { useI18n } from "@/lib/i18n/provider"
import { AICore, IntelligenceCard, LiveStatus, SignalIcon } from "@/components/visual-engine"
import { BrainCircuit, ShieldCheck, Sparkles } from "lucide-react"

export default function AssistantPage() {
  const { t } = useI18n()
  return (
    <AppShell>
      <main className="relative mx-auto min-h-[80vh] max-w-6xl overflow-hidden px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-16 size-72 rounded-full bg-cyan/10 blur-3xl" />

        <div className="relative z-10">
          <IntelligenceCard tone="cyan" className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <AICore state="active" className="mt-1" />
                <div>
                  <p className="ve-eyebrow">HEGEVA intelligence</p>
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t.assistant.title}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t.assistant.subtitle}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:w-[430px] lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3"><LiveStatus label="AI ready" detail="Cloudflare AI" tone="emerald" /></div>
                <div className="rounded-2xl border border-cyan/20 bg-cyan/5 p-3"><LiveStatus label="Context active" detail="Session aware" tone="cyan" /></div>
                <div className="rounded-2xl border border-violet/20 bg-violet/5 p-3"><LiveStatus label="Protected" detail="Authenticated API" tone="violet" /></div>
              </div>
            </div>
          </IntelligenceCard>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <IntelligenceCard tone="emerald" className="p-4"><div className="flex items-center gap-3"><SignalIcon icon={BrainCircuit} tone="emerald" className="size-10 rounded-xl" /><div><p className="text-sm font-semibold">HEGEVA reasoning</p><p className="text-xs text-muted-foreground">Focused AI assistance</p></div></div></IntelligenceCard>
            <IntelligenceCard tone="cyan" className="p-4"><div className="flex items-center gap-3"><SignalIcon icon={Sparkles} tone="cyan" className="size-10 rounded-xl" /><div><p className="text-sm font-semibold">Fast responses</p><p className="text-xs text-muted-foreground">Built for daily work</p></div></div></IntelligenceCard>
            <IntelligenceCard tone="violet" className="p-4"><div className="flex items-center gap-3"><SignalIcon icon={ShieldCheck} tone="violet" className="size-10 rounded-xl" /><div><p className="text-sm font-semibold">Private session</p><p className="text-xs text-muted-foreground">Protected account context</p></div></div></IntelligenceCard>
          </div>

          <div className="mt-6">
            <AssistantChat />
          </div>
        </div>
      </main>
    </AppShell>
  )
}
