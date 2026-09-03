import { SiteFooter } from "@/components/site-footer"
import { MobileActionDock } from "@/components/mobile-action-dock"
import { DesktopCommandRail } from "@/components/desktop-command-rail"
import { SiteHeader } from "@/components/site-header"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hegeva-atmosphere relative flex min-h-dvh flex-col">
      <DesktopCommandRail />
      {/* Subtle technical grid overlay */}
      <div className="pointer-events-none absolute inset-0 hegeva-grid opacity-60" aria-hidden />
      <div className="relative z-[1] flex min-h-dvh flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 xl:pl-[15rem]">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <MobileActionDock />
      </div>
    </div>
  )
}
