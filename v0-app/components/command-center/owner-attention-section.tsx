import Link from "next/link"
import { ArrowUpRight, Check } from "lucide-react"

const copy={
 en:{eyebrow:"OWNER ATTENTION",title:"What needs your attention today?",sub:"Real Core evidence only. HEGEVA prepares the next step; you stay in control.",prepared:"Prepared for review",empty:"Nothing new needs owner attention from the current records.",review:"Review"},
 hu:{eyebrow:"TULAJDONOSI FIGYELEM",title:"Mit kell ma elintézned?",sub:"Csak valódi Core-bizonyíték. A HEGEVA előkészíti a következő lépést; az irányítás nálad marad.",prepared:"Áttekintésre előkészítve",empty:"A jelenlegi adatok alapján nincs új, tulajdonosi figyelmet igénylő tétel.",review:"Áttekintés"},
 de:{eyebrow:"INHABER-AUFMERKSAMKEIT",title:"Was braucht heute Ihre Aufmerksamkeit?",sub:"Nur echte Core-Nachweise. HEGEVA bereitet den nächsten Schritt vor; Sie behalten die Kontrolle.",prepared:"Zur Prüfung vorbereitet",empty:"Aus den aktuellen Daten ergibt sich nichts Neues für die Inhaberprüfung.",review:"Prüfen"},
 fr:{eyebrow:"ATTENTION DU PROPRIÉTAIRE",title:"Que faut-il traiter aujourd’hui ?",sub:"Uniquement des preuves Core réelles. HEGEVA prépare l’étape suivante ; vous gardez le contrôle.",prepared:"Préparé pour examen",empty:"Aucun nouvel élément ne nécessite l’attention du propriétaire.",review:"Examiner"},
 es:{eyebrow:"ATENCIÓN DEL PROPIETARIO",title:"¿Qué necesita tu atención hoy?",sub:"Solo evidencia real de Core. HEGEVA prepara el siguiente paso; tú mantienes el control.",prepared:"Preparado para revisión",empty:"Nada nuevo requiere atención del propietario con los datos actuales.",review:"Revisar"},
} as const
type Locale=keyof typeof copy
type AttentionItem={id:string;targetHref:string;stage:string;sourceIds:string[];nextStage?:string}
export function OwnerAttentionSection({locale,items}:{locale:Locale;items:AttentionItem[]}){
 const c=copy[locale]
 return <div className="border-t border-border px-4 py-6 sm:px-6"><p className="ve-eyebrow">{c.eyebrow}</p><h3 className="mt-1 font-display text-2xl font-semibold">{c.title}</h3><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{c.sub}</p>{items.length?<div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map(item=><Link key={item.id} href={item.targetHref} className="rounded-2xl border border-amber-300/25 bg-amber-300/[.04] p-4 transition-colors hover:border-primary/35"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{item.stage.replace(/-/g," ")}</strong><span className="rounded-full border border-amber-300/30 px-2 py-1 text-[.6rem] font-bold uppercase tracking-[.1em] text-amber-200">{c.prepared}</span></div><p className="mt-2 text-xs text-muted-foreground">{item.sourceIds.length} evidence record{item.sourceIds.length===1?"":"s"} · {item.nextStage||item.stage}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">{c.review}<ArrowUpRight className="size-3.5"/></span></Link>)}</div>:<div className="mt-4 rounded-2xl border border-border bg-background/45 p-4 text-sm text-muted-foreground"><Check className="mr-2 inline size-4 text-primary"/>{c.empty}</div>}</div>
}
