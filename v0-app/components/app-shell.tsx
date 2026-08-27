import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hegeva-atmosphere relative min-h-dvh overflow-hidden">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-xl border border-primary/30 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-xl focus:not-sr-only lg:left-[302px]"
      >
        Skip to main content
      </a>

      <div className="pointer-events-none absolute inset-0 hegeva-grid opacity-70" aria-hidden />

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-primary/14 blur-[105px]" />
        <div className="absolute right-[-7rem] top-[11rem] h-[25rem] w-[25rem] rounded-full bg-cyan/14 blur-[115px]" />
        <div className="absolute left-[38%] top-[36%] h-72 w-72 rounded-full bg-violet/11 blur-[120px]" />
        <div className="absolute bottom-[-7rem] right-[14%] h-96 w-96 rounded-full bg-gold/10 blur-[125px]" />
        <div className="absolute left-[2%] top-[55%] h-64 w-64 rounded-full bg-cyan/7 blur-[110px]" />

        <div className="absolute left-[7%] top-[16%] h-px w-[28%] bg-gradient-to-r from-transparent via-cyan/35 to-transparent shadow-[0_0_18px_rgba(34,211,238,.3)]" />
        <div className="absolute right-[4%] top-[31%] h-px w-[24%] bg-gradient-to-r from-transparent via-primary/40 to-transparent shadow-[0_0_18px_rgba(16,185,129,.3)]" />
        <div className="absolute bottom-[20%] left-[22%] h-px w-[30%] bg-gradient-to-r from-transparent via-violet/30 to-transparent" />
        <div className="absolute left-[12%] top-[24%] size-1.5 rounded-full bg-cyan shadow-[0_0_18px_rgba(34,211,238,.75)]" />
        <div className="absolute right-[18%] top-[41%] size-1 rounded-full bg-primary shadow-[0_0_16px_rgba(16,185,129,.75)]" />
        <div className="absolute bottom-[26%] left-[48%] size-1.5 rounded-full bg-violet shadow-[0_0_18px_rgba(139,92,246,.7)]" />
        <div className="absolute bottom-[14%] right-[11%] size-1 rounded-full bg-gold shadow-[0_0_16px_rgba(250,204,21,.65)]" />

        <div className="absolute left-1/2 top-28 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full border border-white/[0.035] shadow-[0_0_80px_rgba(34,211,238,.05)] lg:left-[calc(50%+143px)]" />
        <div className="absolute left-1/2 top-44 h-[27rem] w-[27rem] -translate-x-1/2 rounded-full border border-cyan/[0.06] lg:left-[calc(50%+143px)]" />
        <div className="absolute right-[6%] top-[18%] hidden h-72 w-72 rotate-12 rounded-[32%] border border-violet/[0.06] shadow-[inset_0_0_70px_rgba(139,92,246,.025)] lg:block" />
        <div className="absolute bottom-[9%] left-[4%] hidden h-56 w-56 -rotate-12 rounded-full border border-gold/[0.055] lg:left-[22%] lg:block" />

        <svg className="absolute inset-0 hidden h-full w-full opacity-45 lg:block" viewBox="0 0 1440 1000" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hegevaFlowA" x1="0" x2="1"><stop offset="0" stopColor="rgb(34 211 238)" stopOpacity="0"/><stop offset=".5" stopColor="rgb(34 211 238)" stopOpacity=".22"/><stop offset="1" stopColor="rgb(16 185 129)" stopOpacity="0"/></linearGradient>
            <linearGradient id="hegevaFlowB" x1="0" x2="1"><stop offset="0" stopColor="rgb(139 92 246)" stopOpacity="0"/><stop offset=".5" stopColor="rgb(139 92 246)" stopOpacity=".18"/><stop offset="1" stopColor="rgb(250 204 21)" stopOpacity="0"/></linearGradient>
          </defs>
          <path d="M-80 430 C 210 300, 350 590, 650 420 S 1100 250, 1520 390" fill="none" stroke="url(#hegevaFlowA)" strokeWidth="1" />
          <path d="M-120 720 C 220 560, 420 820, 760 660 S 1160 520, 1540 700" fill="none" stroke="url(#hegevaFlowB)" strokeWidth="1" />
          <path d="M190 -50 C 330 220, 160 410, 390 650 S 700 860, 650 1080" fill="none" stroke="url(#hegevaFlowA)" strokeWidth=".7" opacity=".55" />
        </svg>
      </div>

      <SiteHeader />
      <div className="relative z-[1] flex min-h-dvh flex-col lg:ml-[286px]">
        <div id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</div>
        <SiteFooter />
      </div>
    </div>
  )
}
