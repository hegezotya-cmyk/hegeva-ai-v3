"use client"

import Link from "next/link"
import { ArrowUpRight, Blocks, Bot, Command, Hammer, Layers3 } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { SectionHeading } from "@/components/visual-engine"

const copy={
 en:{eyebrow:"HEGEVA systems",title:"Enter the operating environment.",sub:"Five illuminated paths into the systems that help you think, direct and build.",command:["Command Center","Direct current work, missions and legitimate system activity."],x20:["X20 Builder","Generate and verify working applications through the proven X20 workflow."],x30:["X30 Alpha","Explore structured specifications, safe components and deterministic rendering."],open:"Enter system"},
 hu:{eyebrow:"HEGEVA rendszerek",title:"Lépj be a működési környezetbe.",sub:"Öt megvilágított út a gondolkodást, irányítást és építést segítő rendszerekhez.",command:["Parancsközpont","Irányítsd az aktuális munkát, küldetéseket és valós rendszeraktivitást."],x20:["X20 Építő","Működő alkalmazások létrehozása és ellenőrzése a bevált X20 folyamattal."],x30:["X30 Alpha","Strukturált specifikációk, biztonságos komponensek és determinisztikus renderelés."],open:"Rendszer megnyitása"},
 de:{eyebrow:"HEGEVA-Systeme",title:"Betreten Sie die Betriebsumgebung.",sub:"Fünf Zugänge zu den Systemen für Denken, Steuern und Entwickeln.",command:["Command Center","Aktuelle Arbeit, Missionen und echte Systemaktivität steuern."],x20:["X20 Builder","Funktionierende Apps mit dem bewährten X20-Ablauf generieren und prüfen."],x30:["X30 Alpha","Strukturierte Spezifikationen, sichere Komponenten und deterministisches Rendering erkunden."],open:"System öffnen"},
 fr:{eyebrow:"Systèmes HEGEVA",title:"Entrez dans l’environnement opérationnel.",sub:"Cinq accès lumineux aux systèmes qui vous aident à réfléchir, diriger et créer.",command:["Centre de commande","Pilotez le travail, les missions et l’activité réelle du système."],x20:["Builder X20","Générez et vérifiez des applications avec le processus X20 éprouvé."],x30:["X30 Alpha","Explorez les spécifications structurées, composants sûrs et rendu déterministe."],open:"Entrer dans le système"},
 es:{eyebrow:"Sistemas HEGEVA",title:"Entra en el entorno operativo.",sub:"Cinco accesos iluminados a los sistemas para pensar, dirigir y construir.",command:["Centro de mando","Dirige el trabajo, las misiones y la actividad real del sistema."],x20:["Constructor X20","Genera y verifica aplicaciones mediante el flujo X20 probado."],x30:["X30 Alpha","Explora especificaciones estructuradas, componentes seguros y renderizado determinista."],open:"Entrar al sistema"},
} as const
type PortalKind="assistant"|"command"|"studio"|"x20"|"x30"
const visuals:Record<PortalKind,React.ReactNode>={
 assistant:<div className="portal-orb"><span/><span/><Bot aria-hidden/></div>,command:<div className="portal-radar"><span/><span/><Command aria-hidden/></div>,studio:<div className="portal-geometry"><i/><i/><i/><Blocks aria-hidden/></div>,x20:<div className="portal-forge"><i/><i/><Hammer aria-hidden/></div>,x30:<div className="portal-stack"><i/><i/><i/><Layers3 aria-hidden/></div>,
}
export function Capabilities(){
 const {t,locale}=useI18n();const c=copy[locale]
 const portals:{kind:PortalKind;title:string;desc:string;href:string;icon:typeof Bot;meta:string}[]=[
  {kind:"assistant",title:t.capabilities.assistant.title,desc:t.capabilities.assistant.desc,href:"/assistant",icon:Bot,meta:"HUMAN LAYER"},{kind:"command",title:c.command[0],desc:c.command[1],href:"/command-center",icon:Command,meta:"MISSION CONTROL"},{kind:"studio",title:t.nav.appStudio,desc:t.studio.buildDesc,href:"/app-studio",icon:Blocks,meta:"CREATE + VERIFY"},{kind:"x20",title:c.x20[0],desc:c.x20[1],href:"/app-studio/build-my-app-x20",icon:Hammer,meta:"PROVEN BUILDER"},{kind:"x30",title:c.x30[0],desc:c.x30[1],href:"/app-studio/x30-alpha",icon:Layers3,meta:"DEVELOPMENT PREVIEW"},
 ]
 return <section className="home-systems relative z-10 mx-auto max-w-[94rem] px-4 pb-24 sm:px-6 lg:px-10"><SectionHeading eyebrow={c.eyebrow} title={c.title} description={c.sub}/><div className="system-portals mt-10">{portals.map(({kind,title,desc,href,icon:Icon,meta},index)=><Link prefetch={false} key={kind} href={href} className={`system-portal portal-${kind}`}><header><span>{String(index+1).padStart(2,"0")} / 05</span><b>{meta}</b></header><div className="portal-visual" aria-hidden>{visuals[kind]}</div><footer><span><Icon aria-hidden/><small>{c.open}</small></span><h3>{title}</h3><p>{desc}</p><ArrowUpRight aria-hidden/></footer></Link>)}</div></section>
}
