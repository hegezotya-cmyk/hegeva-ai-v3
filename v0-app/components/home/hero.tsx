"use client"

import Link from "next/link"
import { ArrowRight, MessageSquareText, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Hero() {
  const { t } = useI18n()
  const pills = [t.hero.pillBuild, t.hero.pillManage, t.hero.pillAutomate, t.hero.pillGrow]

  return (
    <section
      className="relative isolate min-h-[650px] overflow-hidden bg-cover bg-[70%_20%] sm:bg-[65%_20%] lg:bg-[center_18%]"
      style={{ backgroundImage: "url('/hegeva-hero-background.webp')" }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,10,8,.98)_0%,rgba(2,10,8,.92)_34%,rgba(2,10,8,.5)_57%,rgba(2,10,8,.08)_78%)] max-lg:bg-[linear-gradient(90deg,rgba(2,10,8,.97)_0%,rgba(2,10,8,.88)_45%,rgba(2,10,8,.28)_100%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" aria-hidden />
      <div className="mx-auto flex min-h-[650px] max-w-7xl items-center px-4 py-14 sm:px-6 lg:py-20 lg:px-8">
        {/* Copy */}
        <div className="relative z-10 max-w-xl rounded-3xl bg-background/10 py-4 backdrop-blur-[1px]">
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

      </div>

      {/* Hairline transition into dashboard */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </section>
  )
}
