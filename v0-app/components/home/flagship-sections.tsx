"use client"

import Link from "next/link"
import { ArrowUpRight, BarChart3, Blocks, Bot, CalendarDays, FileText, MessageSquareText, Receipt, ShieldCheck, Sparkles, Users, Wrench } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { cn } from "@/lib/utils"

const copy = {
  en: { picture:"HEGEVA OPERATING PICTURE", pictureDesc:"A clear view of the operating environment. Connect a workspace to reveal real signals.", empty:"Workspace signals appear here when connected.", modules:"Core modules", open:"Open module", coming:"Coming soon", workflow:"One connected way of working", workflowDesc:"Assist, operate, build and grow from one calm command surface.", pricing:"Pricing & Plans", pricingDesc:"Compare plans in honest Sandbox mode.", viewPlans:"View plans" },
  hu: { picture:"HEGEVA MŰKÖDÉSI KÉP", pictureDesc:"Átlátható kép a működési környezetről. Kapcsolj munkaterületet a valós jelekhez.", empty:"A munkaterület jelei kapcsolás után jelennek meg.", modules:"Alaprendszerek", open:"Modul megnyitása", coming:"Hamarosan", workflow:"Egy összekapcsolt munkamód", workflowDesc:"Segíts, működtess, építs és növekedj egy nyugodt vezérlőfelületről.", pricing:"Árak és csomagok", pricingDesc:"Hasonlítsd össze a csomagokat őszinte Sandbox módban.", viewPlans:"Csomagok megtekintése" },
  de: { picture:"HEGEVA BETRIEBSBILD", pictureDesc:"Ein klarer Blick auf die Betriebsumgebung. Verbinde einen Workspace für echte Signale.", empty:"Workspace-Signale erscheinen nach der Verbindung.", modules:"Kernmodule", open:"Modul öffnen", coming:"Demnächst", workflow:"Ein verbundener Arbeitsweg", workflowDesc:"Assistieren, steuern, bauen und wachsen – in einer ruhigen Leitstelle.", pricing:"Preise & Pläne", pricingDesc:"Pläne im ehrlichen Sandbox-Modus vergleichen.", viewPlans:"Pläne ansehen" },
  fr: { picture:"VUE OPÉRATIONNELLE HEGEVA", pictureDesc:"Une vue claire de l’environnement. Connectez un espace pour révéler les signaux réels.", empty:"Les signaux apparaissent après la connexion.", modules:"Modules essentiels", open:"Ouvrir le module", coming:"Bientôt", workflow:"Une façon de travailler connectée", workflowDesc:"Assister, piloter, créer et grandir depuis une surface calme.", pricing:"Prix et forfaits", pricingDesc:"Comparez les forfaits en mode Sandbox honnête.", viewPlans:"Voir les forfaits" },
  es: { picture:"PERSPECTIVA OPERATIVA HEGEVA", pictureDesc:"Una vista clara del entorno. Conecta un espacio para ver señales reales.", empty:"Las señales aparecen cuando conectes un espacio.", modules:"Módulos principales", open:"Abrir módulo", coming:"Próximamente", workflow:"Una forma conectada de trabajar", workflowDesc:"Asiste, opera, crea y crece desde una superficie serena.", pricing:"Precios y planes", pricingDesc:"Compara planes en modo Sandbox honesto.", viewPlans:"Ver planes" },
} as const

type Locale = keyof typeof copy
type Module = { title:string; desc:string; href?:string; icon:typeof Bot; tone:string; status:string }

export function FlagshipSections() {
  const { t, locale } = useI18n(); const c = copy[locale as Locale]
  const modules: Module[] = [
    { title:t.capabilities.assistant.title, desc:t.capabilities.assistant.desc, href:"/assistant", icon:Bot, tone:"emerald", status:t.capabilities.assistant.title },
    { title:t.nav.appStudio, desc:t.studio.buildDesc, href:"/app-studio", icon:Blocks, tone:"cyan", status:t.nav.appStudio },
    { title:t.nav.business, desc:c.empty, href:"/business", icon:BarChart3, tone:"violet", status:t.nav.business },
    { title:t.business.customers, desc:t.business.customersDesc, href:"/business/customers", icon:Users, tone:"cyan", status:t.business.customers },
    { title:t.business.documents, desc:t.business.documentsDesc, href:"/business/documents", icon:FileText, tone:"gold", status:t.business.documents },
    { title:t.business.planner, desc:t.business.plannerDesc, href:"/business/planner", icon:CalendarDays, tone:"violet", status:t.business.planner },
    { title:t.business.reports, desc:t.business.reportsDesc, href:"/business/reports", icon:Receipt, tone:"cyan", status:t.business.reports },
    { title:t.business.messages, desc:t.business.messagesDesc, href:"/business/messages", icon:MessageSquareText, tone:"emerald", status:t.business.messages },
    { title:c.pricing, desc:c.pricingDesc, href:"/pricing", icon:Sparkles, tone:"gold", status:c.viewPlans },
    { title:"Creative Studio", desc:c.coming, icon:Wrench, tone:"violet", status:c.coming },
  ]
  return <>
    <section className="home-operating-picture mx-auto max-w-[94rem] px-4 sm:px-6 lg:px-10" aria-labelledby="operating-picture-title">
      <div className="operating-picture-shell"><div className="operating-picture-visual" aria-hidden><span className="picture-orbit orbit-a"/><span className="picture-orbit orbit-b"/><span className="picture-core">H</span><span className="picture-node node-a"/><span className="picture-node node-b"/><span className="picture-node node-c"/></div><div className="operating-picture-copy"><p className="section-kicker">{c.picture}</p><h2 id="operating-picture-title">{t.dashboard.heading}</h2><p>{c.pictureDesc}</p><div className="operating-picture-status"><ShieldCheck aria-hidden/><span>{c.empty}</span></div></div></div>
    </section>
    <section className="home-module-showcase mx-auto max-w-[94rem] px-4 py-20 sm:px-6 lg:px-10" aria-labelledby="home-modules-title"><div className="showcase-heading"><div><p className="section-kicker">{c.modules}</p><h2 id="home-modules-title">{c.modules}</h2></div><Link prefetch={false} href="/pricing" className="showcase-pricing"><Sparkles aria-hidden/><span>{c.pricing}</span><ArrowUpRight aria-hidden/></Link></div><div className="showcase-grid">{modules.map(({title,desc,href,icon:Icon,tone,status})=>{const body=<><header><span className={cn("module-icon",`tone-${tone}`)}><Icon aria-hidden/></span><span className="module-status">{status}</span></header><div className="module-copy"><h3>{title}</h3><p>{desc}</p></div>{href&&<footer><span>{c.open}</span><ArrowUpRight aria-hidden/></footer>}</>;return href?<Link prefetch={false} href={href} className={cn("showcase-module",`module-${tone}`)} key={title}>{body}</Link>:<article className={cn("showcase-module","is-coming",`module-${tone}`)} key={title} aria-label={`${title}, ${c.coming}`}>{body}</article>})}</div></section>
    <section className="home-workflow mx-auto max-w-[94rem] px-4 pb-20 sm:px-6 lg:px-10" aria-labelledby="workflow-title"><div className="workflow-heading"><div><p className="section-kicker">HEGEVA CORE</p><h2 id="workflow-title">{c.workflow}</h2></div><p>{c.workflowDesc}</p></div><div className="workflow-band"><div><b>ASSIST</b><span>{t.capabilities.assistant.title}</span></div><i aria-hidden>→</i><div><b>OPERATE</b><span>{t.nav.commandCenter}</span></div><i aria-hidden>→</i><div><b>BUILD</b><span>{t.nav.appStudio}</span></div><i aria-hidden>→</i><div><b>GROW</b><span>{t.nav.business}</span></div></div></section>
  </>
}
