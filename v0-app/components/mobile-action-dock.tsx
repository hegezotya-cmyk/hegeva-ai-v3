"use client"

import Link from "next/link"
import { BarChart3, Blocks, Bot, Command, Home } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/provider"

const labels={en:{items:["Home","Command","Assistant","Studio","Business"],aria:"HEGEVA quick navigation"},hu:{items:["Kezdőlap","Központ","Asszisztens","Stúdió","Üzlet"],aria:"HEGEVA gyorsnavigáció"},de:{items:["Start","Zentrale","Assistent","Studio","Business"],aria:"HEGEVA-Schnellnavigation"},fr:{items:["Accueil","Centre","Assistant","Studio","Business"],aria:"Navigation rapide HEGEVA"},es:{items:["Inicio","Centro","Asistente","Estudio","Negocio"],aria:"Navegación rápida de HEGEVA"}} as const
export function MobileActionDock(){
 const pathname=usePathname()
 const {locale}=useI18n()
 const items=[{href:"/",label:labels[locale].items[0],icon:Home},{href:"/command-center",label:labels[locale].items[1],icon:Command},{href:"/assistant",label:labels[locale].items[2],icon:Bot},{href:"/app-studio",label:labels[locale].items[3],icon:Blocks},{href:"/business",label:labels[locale].items[4],icon:BarChart3}]
 return <nav aria-label={labels[locale].aria} className="mobile-action-dock">{items.map(({href,label,icon:Icon})=>{const active=href==="/"?pathname===href:pathname.startsWith(href);return <Link key={href} href={href} aria-current={active?"page":undefined} className={cn(active&&"is-active")}><Icon aria-hidden/><span>{label}</span></Link>})}</nav>
}
