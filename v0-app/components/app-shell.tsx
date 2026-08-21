import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hegeva-atmosphere relative flex min-h-dvh flex-col">
      {/* Subtle technical grid overlay */}
      <div className="pointer-events-none absolute inset-0 hegeva-grid opacity-60" aria-hidden />
      <div className="relative flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </div>
  )
}
