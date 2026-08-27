"use client"

import { useEffect, useState } from "react"
import { RefreshCw, RotateCcw } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { AICore, SkeletonSurface } from "@/components/visual-engine"
import { useI18n } from "@/lib/i18n/provider"

const copy = {
  en: { sr: "HEGEVA is preparing your workspace.", eyebrow: "HEGEVA intelligence", title: "Preparing your workspace", body: "Loading your latest tools and workspace state.", slow: "This is taking longer than expected. HEGEVA can recover the current view safely.", retry: "Retry view", reload: "Reload app" },
  hu: { sr: "A HEGEVA előkészíti a munkaterületedet.", eyebrow: "HEGEVA intelligencia", title: "A munkaterület előkészítése", body: "A legfrissebb eszközök és a munkaterület állapotának betöltése.", slow: "Ez a vártnál tovább tart. A HEGEVA biztonságosan újra tudja tölteni ezt a nézetet.", retry: "Nézet újrapróbálása", reload: "App újratöltése" },
  de: { sr: "HEGEVA bereitet Ihren Arbeitsbereich vor.", eyebrow: "HEGEVA Intelligenz", title: "Arbeitsbereich wird vorbereitet", body: "Ihre neuesten Werkzeuge und der aktuelle Arbeitsbereich werden geladen.", slow: "Das dauert länger als erwartet. HEGEVA kann diese Ansicht sicher wiederherstellen.", retry: "Ansicht erneut laden", reload: "App neu laden" },
  fr: { sr: "HEGEVA prépare votre espace de travail.", eyebrow: "Intelligence HEGEVA", title: "Préparation de votre espace", body: "Chargement de vos outils récents et de l’état de votre espace de travail.", slow: "Cela prend plus de temps que prévu. HEGEVA peut récupérer cette vue en toute sécurité.", retry: "Réessayer la vue", reload: "Recharger l’app" },
  es: { sr: "HEGEVA está preparando tu espacio de trabajo.", eyebrow: "Inteligencia HEGEVA", title: "Preparando tu espacio de trabajo", body: "Cargando tus herramientas más recientes y el estado de tu espacio de trabajo.", slow: "Esto está tardando más de lo esperado. HEGEVA puede recuperar esta vista de forma segura.", retry: "Reintentar vista", reload: "Recargar app" },
} as const

const RECOVERY_PREFIX = "hegeva:route-recovery:"

export default function Loading() {
  const { locale } = useI18n()
  const text = copy[locale]
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const pathname = window.location.pathname
    const key = `${RECOVERY_PREFIX}${pathname}`

    const slowTimer = window.setTimeout(() => setSlow(true), 4500)
    const recoveryTimer = window.setTimeout(() => {
      try {
        if (sessionStorage.getItem(key) !== "1") {
          sessionStorage.setItem(key, "1")
          window.location.reload()
        }
      } catch {
        setSlow(true)
      }
    }, 7500)

    return () => {
      window.clearTimeout(slowTimer)
      window.clearTimeout(recoveryTimer)
      try { sessionStorage.removeItem(key) } catch {}
    }
  }, [])

  function retryView() {
    try { sessionStorage.removeItem(`${RECOVERY_PREFIX}${window.location.pathname}`) } catch {}
    window.location.assign(window.location.href)
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8" role="status" aria-live="polite" aria-busy={!slow}>
        <span className="sr-only">{text.sr}</span>
        <div className="mb-7 flex items-center gap-4 sm:mb-8">
          <AICore state={slow ? "ready" : "thinking"} />
          <div>
            <p className="ve-eyebrow">{text.eyebrow}</p>
            <p className="font-display text-lg font-semibold sm:text-xl">{text.title}</p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{slow ? text.slow : text.body}</p>
          </div>
        </div>

        {slow ? (
          <div className="glass-panel max-w-xl rounded-3xl p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={retryView} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-foreground transition hover:bg-primary/15">
                <RefreshCw className="size-4 text-primary" aria-hidden />{text.retry}
              </button>
              <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-background/40 px-4 text-sm font-semibold text-foreground transition hover:border-cyan/25 hover:bg-background/60">
                <RotateCcw className="size-4 text-cyan" aria-hidden />{text.reload}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <SkeletonSurface lines={5} />
            <SkeletonSurface lines={7} />
          </div>
        )}
      </main>
    </AppShell>
  )
}
