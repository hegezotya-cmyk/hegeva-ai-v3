import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hegeva-atmosphere relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hegeva-grid opacity-70" aria-hidden />

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-primary/12 blur-[105px]" />
        <div className="absolute right-[-7rem] top-[11rem] h-[25rem] w-[25rem] rounded-full bg-cyan/12 blur-[115px]" />
        <div className="absolute left-[38%] top-[36%] h-72 w-72 rounded-full bg-violet/9 blur-[120px]" />
        <div className="absolute bottom-[-7rem] right-[14%] h-96 w-96 rounded-full bg-gold/9 blur-[125px]" />

        <div className="absolute left-[7%] top-[16%] h-px w-[28%] bg-gradient-to-r from-transparent via-cyan/30 to-transparent shadow-[0_0_18px_rgba(34,211,238,.3)]" />
        <div className="absolute right-[4%] top-[31%] h-px w-[24%] bg-gradient-to-r from-transparent via-primary/35 to-transparent shadow-[0_0_18px_rgba(16,185,129,.3)]" />
        <div className="absolute bottom-[20%] left-[22%] h-px w-[30%] bg-gradient-to-r from-transparent via-violet/25 to-transparent" />

        <div className="absolute left-[12%] top-[24%] size-1.5 rounded-full bg-cyan shadow-[0_0_18px_rgba(34,211,238,.75)]" />
        <div className="absolute right-[18%] top-[41%] size-1 rounded-full bg-primary shadow-[0_0_16px_rgba(16,185,129,.75)]" />
        <div className="absolute bottom-[26%] left-[48%] size-1.5 rounded-full bg-violet shadow-[0_0_18px_rgba(139,92,246,.7)]" />
        <div className="absolute bottom-[14%] right-[11%] size-1 rounded-full bg-gold shadow-[0_0_16px_rgba(250,204,21,.65)]" />

        <div className="absolute left-1/2 top-28 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full border border-white/[0.035] shadow-[0_0_80px_rgba(34,211,238,.05)]" />
        <div className="absolute left-1/2 top-44 h-[27rem] w-[27rem] -translate-x-1/2 rounded-full border border-cyan/[0.055]" />
      </div>

      <div className="relative z-[1] flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </div>
  )
}
