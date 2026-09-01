"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Blocks, Bot, CalendarDays, Command, FileText, Home, MessageSquareText, Settings, Sparkles, Users, ShieldCheck } from "lucide-react"
import { HegevaLogo } from "@/components/hegeva-logo"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { cn } from "@/lib/utils"
import { AICore } from "@/components/visual-engine"

const copy={
 en:{primary:"Core systems",operations:"Operations",home:"Home",command:"Command Center",assistant:"Assistant",studio:"App Studio",business:"Business Hub",customers:"Customers",documents:"Documents",planner:"Planner",reports:"Reports",messages:"Messages",financialGuard:"Financial Guard",pricing:"Pricing & Plans",account:"Account",ready:"HEGEVA ready",coreReady:"CORE READY",workspace:"Authenticated workspace"},
 hu:{primary:"Alaprendszerek",operations:"Műveletek",home:"Kezdőlap",command:"Vezérlőközpont",assistant:"Asszisztens",studio:"App Stúdió",business:"Üzleti központ",customers:"Ügyfelek",documents:"Dokumentumok",planner:"Tervező",reports:"Jelentések",messages:"Üzenetek",financialGuard:"Pénzügyi védelem",pricing:"Árak és csomagok",account:"Fiók",ready:"HEGEVA készen áll",coreReady:"A MAG KÉSZ",workspace:"Hitelesített munkaterület"},
 de:{primary:"Kernsysteme",operations:"Betrieb",home:"Start",command:"Kommandozentrale",assistant:"Assistent",studio:"App Studio",business:"Business Hub",customers:"Kunden",documents:"Dokumente",planner:"Planer",reports:"Berichte",messages:"Nachrichten",financialGuard:"Finanzschutz",pricing:"Preise & Pläne",account:"Konto",ready:"HEGEVA bereit",coreReady:"KERN BEREIT",workspace:"Authentifizierter Arbeitsbereich"},
 fr:{primary:"Systèmes principaux",operations:"Opérations",home:"Accueil",command:"Centre de commande",assistant:"Assistant",studio:"App Studio",business:"Espace Business",customers:"Clients",documents:"Documents",planner:"Planning",reports:"Rapports",messages:"Messages",financialGuard:"Garde financière",pricing:"Prix et forfaits",account:"Compte",ready:"HEGEVA prêt",coreReady:"CŒUR PRÊT",workspace:"Espace authentifié"},
 es:{primary:"Sistemas centrales",operations:"Operaciones",home:"Inicio",command:"Centro de mando",assistant:"Asistente",studio:"App Studio",business:"Centro Business",customers:"Clientes",documents:"Documentos",planner:"Planificador",reports:"Informes",messages:"Mensajes",financialGuard:"Protección financiera",pricing:"Precios y planes",account:"Cuenta",ready:"HEGEVA listo",coreReady:"NÚCLEO LISTO",workspace:"Espacio autenticado"},
} as const

export function DesktopCommandRail(){
 const pathname=usePathname();const {locale}=useI18n();const c=copy[locale];const {data:session}=authClient.useSession()
 const groups=[
  {label:c.primary,items:[[Home,c.home,"/"],[Command,c.command,"/command-center"],[Bot,c.assistant,"/assistant"],[Blocks,c.studio,"/app-studio"]] as const},
  {label:c.operations,items:[[BarChart3,c.business,"/business"],[Users,c.customers,"/business/customers"],[FileText,c.documents,"/business/documents"],[CalendarDays,c.planner,"/business/planner"],[BarChart3,c.reports,"/business/reports"],[MessageSquareText,c.messages,"/business/messages"],[ShieldCheck,c.financialGuard,"/business/financial-guard"],[Sparkles,c.pricing,"/pricing"]] as const},
 ]
 return <aside className="desktop-command-rail"><div className="command-rail-brand"><HegevaLogo/><span>OPERATING ENVIRONMENT</span></div><div className="command-rail-core"><AICore state="ready" label="HEGEVA Core"/><div><strong>{c.coreReady}</strong><small>{c.ready}</small></div></div><nav aria-label="HEGEVA command navigation">{groups.map(group=><section key={group.label}><p>{group.label}</p>{group.items.map(([Icon,label,href])=>{const active=href==="/"?pathname===href:pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} aria-current={active?"page":undefined} className={cn(active&&"is-active")}><span><Icon aria-hidden/></span><b>{label}</b><i/></Link>})}</section>)}</nav><footer><div><span className="rail-live"/><p><b>{c.ready}</b><small>{c.workspace}</small></p></div><Link href={session?.user?"/account":"/login"} aria-label={c.account}><Settings aria-hidden/></Link></footer></aside>
}
