"use client"

import { AppShell } from "@/components/app-shell"
import { AICore, SkeletonSurface } from "@/components/visual-engine"
import { useI18n } from "@/lib/i18n/provider"

const copy = {
  en: {
    sr: "HEGEVA is preparing your workspace.",
    eyebrow: "HEGEVA intelligence",
    title: "Preparing your workspace",
    body: "Loading your latest tools and workspace state.",
  },
  hu: {
    sr: "A HEGEVA előkészíti a munkaterületedet.",
    eyebrow: "HEGEVA intelligencia",
    title: "A munkaterület előkészítése",
    body: "A legfrissebb eszközök és a munkaterület állapotának betöltése.",
  },
  de: {
    sr: "HEGEVA bereitet Ihren Arbeitsbereich vor.",
    eyebrow: "HEGEVA Intelligenz",
    title: "Arbeitsbereich wird vorbereitet",
    body: "Ihre neuesten Werkzeuge und der aktuelle Arbeitsbereich werden geladen.",
  },
  fr: {
    sr: "HEGEVA prépare votre espace de travail.",
    eyebrow: "Intelligence HEGEVA",
    title: "Préparation de votre espace",
    body: "Chargement de vos outils récents et de l’état de votre espace de travail.",
  },
  es: {
    sr: "HEGEVA está preparando tu espacio de trabajo.",
    eyebrow: "Inteligencia HEGEVA",
    title: "Preparando tu espacio de trabajo",
    body: "Cargando tus herramientas más recientes y el estado de tu espacio de trabajo.",
  },
} as const

export default function Loading() {
  const { locale } = useI18n()
  const text = copy[locale]

  return (
    <AppShell>
      <main
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">{text.sr}</span>
        <div className="mb-7 flex items-center gap-4 sm:mb-8">
          <AICore state="thinking" />
          <div>
            <p className="ve-eyebrow">{text.eyebrow}</p>
            <p className="font-display text-lg font-semibold sm:text-xl">{text.title}</p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{text.body}</p>
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
