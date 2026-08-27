"use client"

import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { AssistantChat } from "@/components/assistant/assistant-chat"
import { useI18n } from "@/lib/i18n/provider"
import { AICore, IntelligenceCard, LiveStatus, SignalIcon } from "@/components/visual-engine"
import { Activity, ArrowUpRight, BrainCircuit, BriefcaseBusiness, Cpu, LayoutDashboard, ShieldCheck, Sparkles, WandSparkles, Zap } from "lucide-react"

export default function AssistantPage() {
  const { t } = useI18n()
  const quickActions = [
    { href: "/command-center", label: "Command Center", icon: LayoutDashboard, tone: "emerald" as const },
    { href: "/business", label: "Business Workspace", icon: BriefcaseBusiness, tone: "cyan" as const },
    { href: "/app-studio", label: "App Studio", icon: WandSparkles, tone: "violet" as const },
  ]

  return (
    <AppShell>
      <main className="relative mx-auto min-h-[80vh] max-w-[1500px] overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[8%] top-0 size-80 rounded-full bg-cyan/9 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 left-[48%] size-72 rounded-full bg-violet/8 blur-3xl" />

        <div className="relative z-10">
          <IntelligenceCard tone="cyan" className="overflow-hidden p-5 sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan/45 to-transparent" aria-hidden />
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <AICore state="active" className="mt-1" />
                <div>
                  <p className="ve-eyebrow">HEGEVA intelligence cockpit</p>
                  <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl lg:text-5xl">{t.assistant.title}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t.assistant.subtitle}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 xl:w-[520px]">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3"><LiveStatus label="AI ready" detail="Cloudflare AI" tone="emerald" /></div>
                <div className="rounded-2xl border border-cyan/20 bg-cyan/5 p-3"><LiveStatus label="Context active" detail="Session aware" tone="cyan" /></div>
                <div className="rounded-2xl border border-violet/20 bg-violet/5 p-3"><LiveStatus label="Protected" detail="Authenticated API" tone="violet" /></div>
              </div>
            </div>
          </IntelligenceCard>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div className="grid gap-3 sm:grid-cols-3">
                <IntelligenceCard tone="emerald" className="p-4"><div className="flex items-center gap-3"><SignalIcon icon={BrainCircuit} tone="emerald" className="size-10 rounded-xl" /><div><p className="text-sm font-semibold">HEGEVA reasoning</p><p className="text-xs text-muted-foreground">Focused AI assistance</p></div></div></IntelligenceCard>
                <IntelligenceCard tone="cyan" className="p-4"><div className="flex items-center gap-3"><SignalIcon icon={Zap} tone="cyan" className="size-10 rounded-xl" /><div><p className="text-sm font-semibold">Fast responses</p><p className="text-xs text-muted-foreground">Built for daily work</p></div></div></IntelligenceCard>
                <IntelligenceCard tone="violet" className="p-4"><div className="flex items-center gap-3"><SignalIcon icon={ShieldCheck} tone="violet" className="size-10 rounded-xl" /><div><p className="text-sm font-semibold">Private session</p><p className="text-xs text-muted-foreground">Protected account context</p></div></div></IntelligenceCard>
              </div>

              <div className="mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-background/28 p-2 shadow-[0_34px_110px_-60px_rgba(34,211,238,.5)] backdrop-blur-xl sm:p-3">
                <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3">
                  <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/8 text-cyan"><Sparkles className="size-4" /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan">Live AI workspace</p><p className="text-[11px] text-muted-foreground">Conversation, context and actions in one surface</p></div></div>
                  <div className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex"><span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />Operational</div>
                </div>
                <AssistantChat />
              </div>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start" aria-label="Assistant intelligence rail">
              <IntelligenceCard tone="emerald" className="p-4 sm:p-5">
                <div className="flex items-center gap-3"><SignalIcon icon={Cpu} tone="emerald" className="size-10 rounded-xl" /><div><p className="ve-eyebrow mb-0">Core telemetry</p><p className="text-sm font-semibold text-foreground">Assistant systems</p></div></div>
                <div className="mt-4 space-y-2">
                  <LiveStatus label="Reasoning" detail="Ready" tone="emerald" />
                  <LiveStatus label="Workspace context" detail="Connected" tone="cyan" />
                  <LiveStatus label="Security" detail="Protected" tone="violet" />
                </div>
              </IntelligenceCard>

              <IntelligenceCard tone="violet" className="p-4 sm:p-5">
                <div className="flex items-center gap-3"><SignalIcon icon={Activity} tone="violet" className="size-10 rounded-xl" /><div><p className="ve-eyebrow mb-0">Quick workflow</p><p className="text-sm font-semibold text-foreground">Launch workspace</p></div></div>
                <div className="mt-4 space-y-2">
                  {quickActions.map(({ href, label, icon: Icon, tone }) => (
                    <Link key={href} href={href} className="group flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-background/30 px-3 py-2 text-sm font-medium text-foreground/85 transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-background/50">
                      <SignalIcon icon={Icon} tone={tone} className="size-8 rounded-lg" />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                    </Link>
                  ))}
                </div>
              </IntelligenceCard>

              <IntelligenceCard tone="cyan" className="p-4 sm:p-5">
                <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan">HEGEVA pulse</p><span className="rounded-full border border-primary/20 bg-primary/8 px-2 py-1 text-[10px] font-bold text-primary">LIVE</span></div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/8 bg-background/30 p-2.5 text-center"><p className="text-lg font-semibold text-primary">AI</p><p className="text-[9px] uppercase tracking-[.13em] text-muted-foreground">Core</p></div>
                  <div className="rounded-xl border border-white/8 bg-background/30 p-2.5 text-center"><p className="text-lg font-semibold text-cyan">CTX</p><p className="text-[9px] uppercase tracking-[.13em] text-muted-foreground">Context</p></div>
                  <div className="rounded-xl border border-white/8 bg-background/30 p-2.5 text-center"><p className="text-lg font-semibold text-violet">SEC</p><p className="text-[9px] uppercase tracking-[.13em] text-muted-foreground">Secure</p></div>
                </div>
              </IntelligenceCard>
            </aside>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
