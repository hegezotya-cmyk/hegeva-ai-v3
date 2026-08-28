"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Blocks, Bot, CalendarDays, Command, FileText, Home, MessageSquareText, Settings, Users } from "lucide-react"
import { HegevaLogo } from "@/components/hegeva-logo"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { cn } from "@/lib/utils"

const copy={
 en:{primary:"Core systems",operations:"Operations",home:"Home",command:"Command Center",assistant:"Assistant",studio:"App Studio",business:"Business Hub",customers:"Customers",documents:"Documents",planner:"Planner",reports:"Reports",messages:"Messages",account:"Account",ready:"HEGEVA ready"},
 hu:{primary:"Alaprendszerek",operations:"Műveletek",home:"Kezdőlap",command:"Vezérlőközpont",assistant:"Asszisztens",studio:"App Stúdió",business:"Üzleti központ",customers:"Ügyfelek",documents:"Dokumentumok",planner:"Tervező",reports:"Jelentések",messages:"Üzenetek",account:"Fiók",ready:"HEGEVA készen áll"},
 de:{primary:"Kernsysteme",operations:"Betrieb",home:"Start",command:"Kommandozentrale",assistant:"Assistent",studio:"App Studio",business:"Business Hub",customers:"Kunden",documents:"Dokumente",planner:"Planer",reports:"Berichte",messages:"Nachrichten",account:"Konto",ready:"HEGEVA bereit"},
 fr:{primary:"Systèmes principaux",operations:"Opérations",home:"Accueil",command:"Centre de commande",assistant:"Assistant",studio:"App Studio",business:"Espace Business",customers:"Clients",documents:"Documents",planner:"Planning",reports:"Rapports",messages:"Messages",account:"Compte",ready:"HEGEVA prêt"},
 es:{primary:"Sistemas centrales",operations:"Operaciones",home:"Inicio",command:"Centro de mando",assistant:"Asistente",studio:"App Studio",business:"Centro Business",customers:"Clientes",documents:"Documentos",planner:"Planificador",reports:"Informes",messages:"Mensajes",account:"Cuenta",ready:"HEGEVA listo"},
} as const

export function DesktopCommandRail(){
 const pathname=usePathname();const {locale}=useI18n();const c=copy[locale];const {data:session}=authClient.useSession()
 const groups=[
  {label:c.primary,items:[[Home,c.home,"/"],[Command,c.command,"/command-center"],[Bot,c.assistant,"/assistant"],[Blocks,c.studio,"/app-studio"]] as const},
  {label:c.operations,items:[[BarChart3,c.business,"/business"],[Users,c.customers,"/business/customers"],[FileText,c.documents,"/business/documents"],[CalendarDays,c.planner,"/business/planner"],[BarChart3,c.reports,"/business/reports"],[MessageSquareText,c.messages,"/business/messages"]] as const},
 ]
 return <aside className="desktop-command-rail"><div className="command-rail-brand"><HegevaLogo/><span>OPERATING ENVIRONMENT</span></div><nav aria-label="HEGEVA command navigation">{groups.map(group=><section key={group.label}><p>{group.label}</p>{group.items.map(([Icon,label,href])=>{const active=href==="/"?pathname===href:pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} aria-current={active?"page":undefined} className={cn(active&&"is-active")}><span><Icon aria-hidden/></span><b>{label}</b><i/></Link>})}</section>)}</nav><footer><div><span className="rail-live"/><p><b>{c.ready}</b><small>{session?.user?.email||"Local-first workspace"}</small></p></div><Link href={session?.user?"/account":"/login"} aria-label={c.account}><Settings aria-hidden/></Link></footer></aside>
}
