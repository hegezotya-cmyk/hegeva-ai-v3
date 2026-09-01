"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MessageSquareText } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const liveHeroCopy = {
  en: { motto:"YOUR BUSINESS. ONE INTELLIGENT SYSTEM.", title:["Imagine it.","Build it.","Run it."], subtitle:"A trusted AI partner for creating, operating and growing your business.", primary:"Start your journey", secondary:"See how it works", signal:"Connected systems" },
  hu: { motto:"A TE ÜZLETED. EGY INTELLIGENS RENDSZER.", title:["Képzeld el.","Építsd fel.","Futtasd."] , subtitle:"Megbízható AI-partner vállalkozásod létrehozásához, működtetéséhez és növeléséhez.", primary:"Kezdd el az utad", secondary:"Nézd meg, hogyan működik", signal:"Kapcsolt rendszerek" },
  de: { motto:"DEIN UNTERNEHMEN. EIN INTELLIGENTES SYSTEM.", title:["Stell es dir vor.","Baue es.","Führe es."] , subtitle:"Ein verlässlicher KI-Partner für den Aufbau, Betrieb und das Wachstum deines Unternehmens.", primary:"Starte deine Reise", secondary:"So funktioniert es", signal:"Verbundene Systeme" },
  fr: { motto:"VOTRE ENTREPRISE. UN SYSTÈME INTELLIGENT.", title:["Imaginez.","Construisez.","Lancez."] , subtitle:"Un partenaire IA fiable pour créer, piloter et développer votre entreprise.", primary:"Commencer votre parcours", secondary:"Voir comment ça marche", signal:"Systèmes connectés" },
  es: { motto:"TU NEGOCIO. UN SISTEMA INTELIGENTE.", title:["Imagina.","Constrúyelo.","Ponlo en marcha."] , subtitle:"Un socio de IA de confianza para crear, operar y hacer crecer tu negocio.", primary:"Comienza tu camino", secondary:"Descubre cómo funciona", signal:"Sistemas conectados" },
} as const

export function Hero() {
  const { t, locale } = useI18n()
  const copy = liveHeroCopy[locale]

  return (
    <section className="cinematic-hero relative isolate overflow-hidden">
      <div className="hero-artwork-layer" aria-hidden>
        <Image src="/hegeva-homepage-clean-master-aaa-v2.png" alt="" fill priority sizes="100vw" className="hero-environment" />
      </div>
      <div className="hero-spectrum" aria-hidden />
      <div className="hero-energy-trail trail-one" aria-hidden />
      <div className="hero-energy-trail trail-two" aria-hidden />
      <div className="hero-particles" aria-hidden>{Array.from({length:14},(_,index)=><i key={index}/>)}</div>
      <div className="hero-layout mx-auto grid min-h-[800px] max-w-[94rem] items-center px-4 pb-40 pt-16 sm:px-6 lg:grid-cols-[minmax(30rem,.82fr)_minmax(34rem,1.18fr)] lg:px-10 lg:pb-44 lg:pt-20">
        <div className="hero-copy hero-live-copy relative z-10 max-w-3xl py-4">
          <p className="hero-motto">{copy.motto}</p>

          <h1 className="hero-title mt-6 font-display text-5xl font-semibold leading-[.92] tracking-[-0.065em] text-balance sm:text-6xl lg:text-[5.5rem]">
            <span className="block text-foreground">{copy.title[0]}</span>
            <span className="block hero-title-energy">{copy.title[1]}</span>
            <span className="block text-foreground">{copy.title[2]}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
            {copy.subtitle}
          </p>

          <div className="hero-actions mt-8 flex flex-wrap items-center gap-3">
            <Link href="/command-center" className={cn(buttonVariants({ size: "lg" }), "hegeva-primary group h-12 gap-2 px-6 text-sm")}>
              {copy.primary}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/assistant"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 gap-2 px-5 text-sm")}
            >
              <MessageSquareText className="size-4 text-primary" aria-hidden />
              {copy.secondary}
            </Link>
          </div>

          <div className="hero-truth-line"><i/><span>{copy.signal}</span><b>ASSIST · OPERATE · BUILD</b></div>
        </div>
      </div>
    </section>
  )
}
