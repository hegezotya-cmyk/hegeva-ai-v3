"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MessageSquareText } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const honestHero = {
  en: { motto:"AI POWERED · HUMAN DRIVEN · RESULTS FOCUSED",subtitle: "One connected operating environment for intelligent assistance, business work and application engineering — built around the HEGEVA systems available today.",status:"CORE READY",signal:"Connected systems" },
  hu: { motto:"AI-VEZÉRELT · EMBERKÖZPONTÚ · EREDMÉNYFÓKUSZÚ",subtitle: "Egy összekapcsolt működési környezet intelligens segítséghez, üzleti munkához és alkalmazásfejlesztéshez — a ma elérhető HEGEVA rendszerek köré építve.",status:"A MAG KÉSZ",signal:"Kapcsolt rendszerek" },
  de: { motto:"KI-GESTÜTZT · MENSCHLICH GEFÜHRT · ERGEBNISORIENTIERT",subtitle: "Eine verbundene Betriebsumgebung für intelligente Assistenz, Business-Arbeit und App-Entwicklung — rund um die heute verfügbaren HEGEVA-Systeme.",status:"CORE BEREIT",signal:"Verbundene Systeme" },
  fr: { motto:"PROPULSÉ PAR L’IA · GUIDÉ PAR L’HUMAIN · ORIENTÉ RÉSULTATS",subtitle: "Un environnement opérationnel connecté pour l’assistance intelligente, le travail métier et l’ingénierie d’applications — fondé sur les systèmes HEGEVA disponibles aujourd’hui.",status:"CORE PRÊT",signal:"Systèmes connectés" },
  es: { motto:"IMPULSADO POR IA · GUIADO POR PERSONAS · ENFOCADO EN RESULTADOS",subtitle: "Un entorno operativo conectado para asistencia inteligente, trabajo empresarial e ingeniería de aplicaciones — construido sobre los sistemas HEGEVA disponibles hoy.",status:"NÚCLEO LISTO",signal:"Sistemas conectados" },
} as const

export function Hero() {
  const { t, locale } = useI18n()
  const copy = honestHero[locale]

  return (
    <section className="cinematic-hero relative isolate overflow-hidden">
      <div className="hero-artwork-layer" aria-hidden>
        <Image src="/hegeva-hero-owner-final.png" alt="" fill priority sizes="(min-width: 901px) 62vw, (min-width: 640px) 58vw, 100vw" className="hero-environment" />
      </div>
      <div className="hero-spectrum" aria-hidden />
      <div className="hero-energy-trail trail-one" aria-hidden />
      <div className="hero-energy-trail trail-two" aria-hidden />
      <div className="hero-particles" aria-hidden>{Array.from({length:14},(_,index)=><i key={index}/>)}</div>
      <div className="hero-layout mx-auto grid min-h-[800px] max-w-[94rem] items-center px-4 pb-40 pt-16 sm:px-6 lg:grid-cols-[minmax(30rem,.82fr)_minmax(34rem,1.18fr)] lg:px-10 lg:pb-44 lg:pt-20">
        <div className="hero-copy relative z-10 max-w-3xl py-4">
          <p className="hero-motto">{copy.motto}</p>

          <h1 className="hero-title mt-6 font-display text-5xl font-semibold leading-[.92] tracking-[-0.065em] text-balance sm:text-6xl lg:text-[5.5rem]">
            <span className="block text-foreground">{t.hero.titleLine1}</span>
            <span className="block hero-title-energy">{t.hero.titleLine2}</span>
            <span className="block text-foreground">{t.hero.titleLine3}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
            {copy.subtitle}
          </p>

          <div className="hero-actions mt-8 flex flex-wrap items-center gap-3">
            <Link href="/command-center" className={cn(buttonVariants({ size: "lg" }), "hegeva-primary group h-12 gap-2 px-6 text-sm")}>
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

          <div className="hero-truth-line"><i/><span>{copy.signal}</span><b>ASSIST · OPERATE · BUILD</b></div>
        </div>
        <div className="hero-robot-zone" aria-label="HEGEVA intelligence visual"><div className="hero-hand-core"><span/><span/><i>H</i></div><div className="hero-scan"><span>HEGEVA / CORE 01</span><b>{copy.status}</b></div></div>
      </div>
    </section>
  )
}
