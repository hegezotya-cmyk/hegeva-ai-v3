"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MessageSquareText, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Hero() {
  const { t } = useI18n()
  const pills = [t.hero.pillBuild, t.hero.pillManage, t.hero.pillAutomate, t.hero.pillGrow]

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:py-20 lg:px-8">
        {/* Copy */}
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" aria-hidden />
            {t.hero.badge}
          </span>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            <span className="block text-foreground">{t.hero.titleLine1}</span>
            <span className="block text-gradient-emerald">{t.hero.titleLine2}</span>
            <span className="block text-foreground">{t.hero.titleLine3}</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
            {t.hero.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/command-center" className={cn(buttonVariants({ size: "lg" }), "group h-11 gap-2 px-5 text-sm glow-emerald")}>
              {t.hero.ctaPrimary}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/assistant"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 gap-2 px-5 text-sm")}
            >
              <MessageSquareText className="size-4 text-primary" aria-hidden />
              {t.hero.ctaSecondary}
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            {pills.map((p) => (
              <li
                key={p}
                className="rounded-lg border border-border bg-card/40 px-3 py-1.5 text-xs font-medium tracking-wide text-foreground/80"
              >
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Approved male HEGEVA robot */}
        <div className="relative">
          {/* Atmospheric emerald + cyan illumination behind the character */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-2xl"
            style={{
              background:
                "radial-gradient(45% 45% at 55% 45%, oklch(0.74 0.165 158 / 0.45), transparent 70%), radial-gradient(40% 40% at 40% 70%, oklch(0.8 0.12 196 / 0.3), transparent 70%)",
            }}
            aria-hidden
          />
          <div className="relative mx-auto w-full max-w-md">
            <div className="glass-panel overflow-hidden rounded-3xl">
              <Image
                src="/hegeva-robot.png"
                alt="HEGEVA AI — the HEGEVA robot presenting the HEGEVA emblem"
                width={520}
                height={520}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hairline transition into dashboard */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </section>
  )
}
