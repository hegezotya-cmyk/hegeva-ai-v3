import { AppShell } from "@/components/app-shell"
import { AICore, SkeletonSurface } from "@/components/visual-engine"

export default function Loading() {
  return <AppShell><main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="mb-8 flex items-center gap-4"><AICore state="thinking" /><div><p className="ve-eyebrow">HEGEVA intelligence</p><p className="font-display text-xl font-semibold">Preparing your workspace</p></div></div><div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><SkeletonSurface lines={5}/><SkeletonSurface lines={7}/></div></main></AppShell>
}
