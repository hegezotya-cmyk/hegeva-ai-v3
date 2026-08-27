import { AppShell } from "@/components/app-shell"
import { AICore, SkeletonSurface } from "@/components/visual-engine"

export default function Loading() {
  return (
    <AppShell>
      <main
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">HEGEVA is preparing your workspace.</span>
        <div className="mb-7 flex items-center gap-4 sm:mb-8">
          <AICore state="thinking" />
          <div>
            <p className="ve-eyebrow">HEGEVA intelligence</p>
            <p className="font-display text-lg font-semibold sm:text-xl">Preparing your workspace</p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Loading your latest tools and workspace state.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <SkeletonSurface lines={5} />
          <SkeletonSurface lines={7} />
        </div>
      </main>
    </AppShell>
  )
}
