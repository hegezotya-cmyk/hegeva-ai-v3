"use client"

import Link from "next/link"
import { Blocks, Bot, Command, Home } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/provider"

const labels={en:["Home","Command","Partner","Studio"],hu:["Kezdőlap","Központ","Partner","Stúdió"],de:["Start","Zentrale","Partner","Studio"],fr:["Accueil","Centre","Partenaire","Studio"],es:["Inicio","Centro","Partner","Estudio"]} as const
export function MobileActionDock(){
 const pathname=usePathname()
 const {locale}=useI18n()
 const items=[{href:"/",label:labels[locale][0],icon:Home},{href:"/command-center",label:labels[locale][1],icon:Command},{href:"/assistant",label:labels[locale][2],icon:Bot},{href:"/app-studio",label:labels[locale][3],icon:Blocks}]
 return <nav aria-label="HEGEVA quick navigation" className="mobile-action-dock">{items.map(({href,label,icon:Icon})=>{const active=href==="/"?pathname===href:pathname.startsWith(href);return <Link key={href} href={href} aria-current={active?"page":undefined} className={cn(active&&"is-active")}><Icon aria-hidden/><span>{label}</span></Link>})}</nav>
}
