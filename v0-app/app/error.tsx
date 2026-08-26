"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"
import { useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { IntelligenceCard, SignalIcon } from "@/components/visual-engine"

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return <AppShell><main className="mx-auto flex min-h-[65vh] max-w-3xl items-center px-4 py-12 sm:px-6"><IntelligenceCard tone="gold" className="w-full p-6 sm:p-9"><SignalIcon icon={AlertTriangle} tone="gold" /><p className="ve-eyebrow mt-6">HEGEVA system notice</p><h1 className="font-display text-3xl font-semibold tracking-[-0.04em]">This workspace could not finish loading</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">Your saved data has not been changed. Retry the current view, or return through the main navigation.</p><button type="button" onClick={reset} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"><RotateCcw className="size-4" aria-hidden />Retry</button></IntelligenceCard></main></AppShell>
}
