"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { BarChart3, Blocks, Bot, CalendarDays, Command, FileText, Home, MessageSquareText, Settings, Sparkles, Users, ShieldCheck } from "lucide-react"
import { HegevaLogo } from "@/components/hegeva-logo"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { cn } from "@/lib/utils"
import { AICore } from "@/components/visual-engine"
import { useCoreDecision } from "@/lib/use-core-decision"

const copy={
 en:{primary:"Your tools",operations:"Run your business",home:"Home",command:"Command Center",assistant:"Assistant",studio:"App Studio",business:"Business Hub",customers:"Customers",documents:"Documents",planner:"Planner",reports:"Reports",messages:"Messages",financialGuard:"Financial Guard",pricing:"Pricing & Plans",account:"Account",ready:"HEGEVA is ready",coreReady:"HEGEVA Core ready",coreChecking:"Preparing your business view",coreUnavailable:"HEGEVA Core is unavailable",workspace:"Your business workspace"},
 hu:{primary:"Eszközeid",operations:"Vállalkozásod működtetése",home:"Kezdőlap",command:"Vezérlőközpont",assistant:"Asszisztens",studio:"App Stúdió",business:"Üzleti központ",customers:"Ügyfelek",documents:"Dokumentumok",planner:"Tervező",reports:"Jelentések",messages:"Üzenetek",financialGuard:"Pénzügyi védelem",pricing:"Árak és csomagok",account:"Fiók",ready:"A HEGEVA készen áll",coreReady:"A HEGEVA Core készen áll",coreChecking:"Üzleti nézeted előkészítése",coreUnavailable:"A HEGEVA Core nem érhető el",workspace:"A te üzleti munkaterületed"},
 de:{primary:"Ihre Werkzeuge",operations:"Ihr Unternehmen führen",home:"Start",command:"Kommandozentrale",assistant:"Assistent",studio:"App Studio",business:"Business Hub",customers:"Kunden",documents:"Dokumente",planner:"Planer",reports:"Berichte",messages:"Nachrichten",financialGuard:"Finanzschutz",pricing:"Preise & Pläne",account:"Konto",ready:"HEGEVA ist bereit",coreReady:"HEGEVA Core ist bereit",coreChecking:"Ihre Business-Ansicht wird vorbereitet",coreUnavailable:"HEGEVA Core ist nicht verfügbar",workspace:"Ihr Business-Workspace"},
 fr:{primary:"Vos outils",operations:"Pilotez votre entreprise",home:"Accueil",command:"Centre de commande",assistant:"Assistant",studio:"App Studio",business:"Espace Business",customers:"Clients",documents:"Documents",planner:"Planning",reports:"Rapports",messages:"Messages",financialGuard:"Garde financière",pricing:"Prix et forfaits",account:"Compte",ready:"HEGEVA est prêt",coreReady:"HEGEVA Core est prêt",coreChecking:"Préparation de votre vue d’entreprise",coreUnavailable:"HEGEVA Core est indisponible",workspace:"Votre espace de travail"},
 es:{primary:"Tus herramientas",operations:"Gestiona tu negocio",home:"Inicio",command:"Centro de mando",assistant:"Asistente",studio:"App Studio",business:"Centro Business",customers:"Clientes",documents:"Documentos",planner:"Planificador",reports:"Informes",messages:"Mensajes",financialGuard:"Protección financiera",pricing:"Precios y planes",account:"Cuenta",ready:"HEGEVA está listo",coreReady:"HEGEVA Core está listo",coreChecking:"Preparando la vista de tu negocio",coreUnavailable:"HEGEVA Core no está disponible",workspace:"Tu espacio de trabajo"},
} as const

const coreUnauthenticatedCopy={
  en:"Sign in to activate HEGEVA Core",
  hu:"Jelentkezz be a HEGEVA Core aktiválásához",
  de:"Melden Sie sich an, um HEGEVA Core zu aktivieren",
  fr:"Connectez-vous pour activer HEGEVA Core",
  es:"Inicia sesión para activar HEGEVA Core",
} as const
export function DesktopCommandRail(){
 const pathname=usePathname();const {locale}=useI18n();const c=copy[locale];const {data:session}=authClient.useSession();const {status}=useCoreDecision()
 const [mounted,setMounted]=useState(false)
 useEffect(()=>setMounted(true),[])
 // Keep the first client render identical to SSR even if the shared request has resolved.
 const coreStatus=mounted?status:"loading"
 const coreLabel=coreStatus==="ready"?c.coreReady:coreStatus==="loading"?c.coreChecking:coreStatus==="unauthenticated"?coreUnauthenticatedCopy[locale]:c.coreUnavailable
 const coreState=coreStatus==="ready"?"ready":coreStatus==="loading"?"checking":"warning"
 const groups=[
  {label:c.primary,items:[[Home,c.home,"/"],[Command,c.command,"/command-center"],[Bot,c.assistant,"/assistant"],[Blocks,c.studio,"/app-studio"]] as const},
  {label:c.operations,items:[[BarChart3,c.business,"/business"],[Users,c.customers,"/business/customers"],[FileText,c.documents,"/business/documents"],[CalendarDays,c.planner,"/business/planner"],[BarChart3,c.reports,"/business/reports"],[MessageSquareText,c.messages,"/business/messages"],[ShieldCheck,c.financialGuard,"/business/financial-guard"],[Sparkles,c.pricing,"/pricing"]] as const},
 ]
 return <aside className="desktop-command-rail"><div className="command-rail-brand"><HegevaLogo/><span>{c.workspace}</span></div><div className="command-rail-core"><AICore state={coreState} label="HEGEVA Core"/><div><strong>{coreLabel}</strong><small>{coreStatus==="ready"?c.ready:c.workspace}</small></div></div><nav aria-label="HEGEVA command navigation">{groups.map(group=><section key={group.label}><p>{group.label}</p>{group.items.map(([Icon,label,href])=>{const active=href==="/"?pathname===href:pathname===href||pathname.startsWith(`${href}/`);return <Link prefetch={false} key={href} href={href} aria-current={active?"page":undefined} className={cn(active&&"is-active")}><span><Icon aria-hidden/></span><b>{label}</b><i/></Link>})}</section>)}</nav><footer><div><span className="rail-live"/><p><b>{c.ready}</b><small>{c.workspace}</small></p></div><Link prefetch={false} href={session?.user?"/account":"/login"} aria-label={c.account}><Settings aria-hidden/></Link></footer></aside>
}
