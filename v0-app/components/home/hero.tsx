"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MessageSquareText } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const heroArtworkSource = "/hegeva-homepage-clean-master-aaa-v2.png"
const heroArtworkUrl = heroArtworkSource.replace(/\.png$/, ".webp")

const liveHeroCopy = {
  en: { motto:"RUN THE BUSINESS. NOT THE BUSYWORK.", title:["See what matters.","Take the next step.","Grow with control."], subtitle:"Keep customers, quotes, invoices, follow-ups and today’s priorities in one clear business view.", primary:"Start free", secondary:"See your business in one view", signal:"Built for real business work", signalDetail:"CUSTOMERS · CASHFLOW · PRIORITIES" },
  hu: { motto:"VEZESD A VÁLLALKOZÁST. NE AZ ADMINISZTRÁCIÓT.", title:["Lásd, mi számít.","Tedd meg a következő lépést.","Növekedj kézben tartva."] , subtitle:"Ügyfelek, ajánlatok, számlák, utánkövetések és a mai prioritások egy tiszta üzleti képben.", primary:"Kezdd ingyen", secondary:"Nézd meg egyben az üzleted", signal:"Valódi üzleti munkára készült", signalDetail:"ÜGYFELEK · PÉNZÜGYEK · PRIORITÁSOK" },
  de: { motto:"FÜHREN SIE IHR UNTERNEHMEN. NICHT DEN PAPIERKRAM.", title:["Sehen Sie, was zählt.","Gehen Sie den nächsten Schritt.","Wachsen Sie mit Kontrolle."] , subtitle:"Kunden, Angebote, Rechnungen, Nachfassaktionen und heutige Prioritäten in einer klaren Geschäftsansicht.", primary:"Kostenlos starten", secondary:"Ihr Unternehmen auf einen Blick", signal:"Für echte Geschäftsarbeit entwickelt", signalDetail:"KUNDEN · LIQUIDITÄT · PRIORITÄTEN" },
  fr: { motto:"PILOTEZ L’ENTREPRISE. PAS L’ADMINISTRATIF.", title:["Voyez l’essentiel.","Passez à l’action.","Grandissez en gardant le contrôle."] , subtitle:"Clients, devis, factures, suivis et priorités du jour réunis dans une vue claire de votre entreprise.", primary:"Commencer gratuitement", secondary:"Voir votre entreprise en un regard", signal:"Conçu pour le travail concret", signalDetail:"CLIENTS · TRÉSORERIE · PRIORITÉS" },
  es: { motto:"DIRIGE EL NEGOCIO. NO EL PAPELEO.", title:["Ve lo importante.","Da el siguiente paso.","Crece con control."] , subtitle:"Clientes, presupuestos, facturas, seguimientos y prioridades de hoy en una visión clara de tu negocio.", primary:"Empieza gratis", secondary:"Ve tu negocio de un vistazo", signal:"Creado para el trabajo real", signalDetail:"CLIENTES · TESORERÍA · PRIORIDADES" },
} as const

export function Hero() {
  const { locale } = useI18n()
  const copy = liveHeroCopy[locale]
  const conversion = {
    en: { title: ["Less admin.", "More business."], description: "One workspace for small-business owners: customers, quotes, invoices and planning. HEGEVA Core helps you see what needs attention next.", cta: "Try HEGEVA AI" },
    hu: { title: ["Kevesebb admin.", "Több üzlet."], description: "Egy munkatér kisvállalkozóknak: ügyfelek, ajánlatok, számlák és tervezés. A HEGEVA Core segít átlátni, mi igényel figyelmet.", cta: "Próbáld ki a HEGEVA AI-t" },
    de: { title: ["Weniger Verwaltung.", "Mehr Geschäft."], description: "Ein Workspace für kleine Unternehmen: Kunden, Angebote, Rechnungen und Planung. HEGEVA Core zeigt, was als Nächstes Aufmerksamkeit braucht.", cta: "HEGEVA AI ausprobieren" },
    fr: { title: ["Moins d’administratif.", "Plus d’activité."], description: "Un espace pour les petites entreprises : clients, devis, factures et planification. HEGEVA Core vous aide à voir les prochaines priorités.", cta: "Essayer HEGEVA AI" },
    es: { title: ["Menos papeleo.", "Más negocio."], description: "Un espacio para pequeñas empresas: clientes, presupuestos, facturas y planificación. HEGEVA Core te ayuda a ver qué necesita atención.", cta: "Prueba HEGEVA AI" },
  }[locale]

  return (
    <section className="cinematic-hero relative isolate overflow-hidden">
      <div className="hero-artwork-layer" aria-hidden>
        <Image src={heroArtworkUrl} alt="" fill priority sizes="100vw" className="hero-environment" />
      </div>
      <div className="hero-spectrum" aria-hidden />
      <div className="hero-energy-trail trail-one" aria-hidden />
      <div className="hero-energy-trail trail-two" aria-hidden />
      <div className="hero-particles" aria-hidden>{Array.from({length:14},(_,index)=><i key={index}/>)}</div>
      <div className="hero-layout mx-auto grid min-h-[800px] max-w-[94rem] items-center px-4 pb-40 pt-16 sm:px-6 lg:grid-cols-[minmax(30rem,.82fr)_minmax(34rem,1.18fr)] lg:px-10 lg:pb-44 lg:pt-20">
        <div className="hero-copy hero-live-copy relative z-10 max-w-3xl py-4">
          <p className="hero-motto">{copy.motto}</p>

          <h1 className="hero-title mt-6 font-display text-5xl font-semibold leading-[.92] tracking-[-0.065em] text-balance sm:text-6xl lg:text-[5.5rem]">
            <span className="block text-foreground">{conversion.title[0]}</span>
            <span className="block hero-title-energy">{conversion.title[1]}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
            {conversion.description}
          </p>

          <div className="hero-actions mt-8 flex flex-wrap items-center gap-3">
            <Link href="/login?mode=register" data-acquisition-event="primary_cta_click" className={cn(buttonVariants({ size: "lg" }), "hegeva-primary group h-12 gap-2 px-6 text-sm")}>
              {conversion.cta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="#operating-picture"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 gap-2 px-5 text-sm")}
            >
              <MessageSquareText className="size-4 text-primary" aria-hidden />
              {copy.secondary}
            </Link>
          </div>

          <div className="hero-truth-line"><i/><span>{copy.signal}</span><b>{copy.signalDetail}</b></div>
        </div>
      </div>
    </section>
  )
}
