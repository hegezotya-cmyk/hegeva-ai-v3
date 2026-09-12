"use client"

import Link from "next/link"
import { ArrowUpRight, CalendarCheck2, FileSignature, Megaphone, MessageSquareText, Receipt, SearchCheck, UsersRound } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"

const copy={
 en:{eyebrow:"Start with the outcome",title:"What would you like HEGEVA to help you achieve?",sub:"Choose a business result. HEGEVA opens the right working flow — no module knowledge required.",items:["Win more customers","Create a quote","Create an invoice","Write a customer message","Find where I am losing money","Plan what I need to do today","Create an advertisement"]},
 hu:{eyebrow:"Kezdd az eredménnyel",title:"Miben segítsen neked a HEGEVA?",sub:"Válassz üzleti eredményt. A HEGEVA megnyitja a megfelelő munkafolyamatot — nem kell ismerned a modulokat.",items:["Szerezz több ügyfelet","Készíts ajánlatot","Készíts számlát","Írj ügyfélüzenetet","Mutasd meg, hol vesztek pénzt","Mondd meg, mit kell ma elintéznem","Készíts reklámot"]},
 de:{eyebrow:"Mit dem Ergebnis beginnen",title:"Wobei soll HEGEVA Ihnen helfen?",sub:"Wählen Sie ein Geschäftsergebnis. HEGEVA öffnet den passenden Arbeitsablauf — ohne Modulkenntnisse.",items:["Mehr Kunden gewinnen","Angebot erstellen","Rechnung erstellen","Kundennachricht schreiben","Geldverluste finden","Heutige Aufgaben planen","Werbung erstellen"]},
 fr:{eyebrow:"Commencez par le résultat",title:"Quel résultat voulez-vous obtenir avec HEGEVA ?",sub:"Choisissez un objectif métier. HEGEVA ouvre le bon flux de travail — sans connaître les modules.",items:["Gagner plus de clients","Créer un devis","Créer une facture","Rédiger un message client","Identifier les pertes d’argent","Planifier les tâches du jour","Créer une publicité"]},
 es:{eyebrow:"Empieza por el resultado",title:"¿Qué quieres conseguir con HEGEVA?",sub:"Elige un resultado empresarial. HEGEVA abre el flujo adecuado — sin necesidad de conocer los módulos.",items:["Conseguir más clientes","Crear un presupuesto","Crear una factura","Escribir un mensaje al cliente","Detectar dónde pierdo dinero","Planificar lo que debo hacer hoy","Crear un anuncio"]},
} as const

const destinations=[
 {href:"/business/intelligence",icon:UsersRound},
 {href:"/business/invoices",icon:FileSignature},
 {href:"/business/invoices",icon:Receipt},
 {href:"/business/messages",icon:MessageSquareText},
 {href:"/business/financial-guard",icon:SearchCheck},
 {href:"/business/intelligence",icon:CalendarCheck2},
 {href:"/app-studio/advertising",icon:Megaphone},
] as const

export function OutcomeLauncher({compact=false}:{compact?:boolean}){
 const{locale}=useI18n();const c=copy[locale]
 return <section className={compact?"border-t border-border bg-primary/[0.025] px-4 py-7 sm:px-6":"relative z-10 mx-auto max-w-[94rem] px-4 py-16 sm:px-6 lg:px-10"} aria-labelledby={compact?"command-outcome-title":"home-outcome-title"}><div className={compact?"":"rounded-[2rem] border border-primary/20 bg-background/70 p-6 shadow-2xl shadow-primary/5 backdrop-blur sm:p-9"}><p className="section-kicker">{c.eyebrow}</p><h2 id={compact?"command-outcome-title":"home-outcome-title"} className="mt-2 max-w-4xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">{c.title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{c.sub}</p><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{destinations.map(({href,icon:Icon},index)=><Link prefetch={false} key={`${href}-${index}`} href={href} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-border bg-card/65 p-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden/></span><span>{c.items[index]}</span><ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" aria-hidden/></Link>)}</div></div></section>
}
