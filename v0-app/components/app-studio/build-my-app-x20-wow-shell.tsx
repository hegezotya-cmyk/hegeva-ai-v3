"use client"

import { Braces, CheckCircle2, Layers3, MonitorSmartphone, ShieldCheck, Sparkles, WandSparkles } from "lucide-react"
import { BuildMyAppX20Stable } from "@/components/app-studio/build-my-app-x20-stable"

export function BuildMyAppX20WowShell() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(16,213,141,.15),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(212,175,55,.10),transparent_28%)]" />
      <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-primary/20 bg-background/65 shadow-[0_30px_100px_rgba(0,0,0,.18)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10"><WandSparkles className="size-4 text-primary" aria-hidden /></div>
              <div><p className="text-sm font-semibold text-foreground">HEGEVA X20 Studio</p><p className="text-[11px] text-muted-foreground">Verified browser app workspace</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary"><CheckCircle2 className="size-3.5" /> Stable runtime</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2.5 py-1 text-muted-foreground"><ShieldCheck className="size-3.5" /> Safe improvements</span>
            </div>
          </div>
          <div className="grid gap-px border-b border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Sparkles,"Premium generation","Strong first build"],
              [MonitorSmartphone,"Responsive preview","Desktop + mobile ready"],
              [Braces,"Verified HTML","Portable index.html"],
              [Layers3,"Same-project tuning","Improve without replacing"],
            ].map(([Icon,title,text]) => {
              const C = Icon as typeof Sparkles
              return <div key={String(title)} className="bg-background/80 px-4 py-3.5"><div className="flex items-center gap-2"><C className="size-4 text-primary" aria-hidden /><span className="text-xs font-semibold text-foreground">{String(title)}</span></div><p className="mt-1 pl-6 text-[11px] text-muted-foreground">{String(text)}</p></div>
            })}
          </div>
        </div>
      </div>
      <div className="[&>div]:pt-6"><BuildMyAppX20Stable /></div>
    </div>
  )
}
