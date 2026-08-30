"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Braces, CheckCircle2, FlaskConical, Layers3, Palette, ShieldCheck } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { SafeX30Renderer } from "@/components/x30/safe-renderer"
import { pawflowX30Fixture } from "@/lib/x30/fixtures"
import { deriveWorkspaceVisualDirection } from "@/lib/x30/domain-visual-intelligence"
import { evaluateVisualQuality } from "@/lib/visual-quality"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { useSession } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { useState } from "react"

type Row = { id?: string; name?: string; title?: string; due?: string; done?: boolean }

const copy = {
 en:{cloud:"Authenticated workspace",local:"Local workspace · not cloud-synced",empty:"No workspace data available",demo:"Show PawFlow demo preview",hideDemo:"Hide demo preview",demoLabel:"User-selected demo preview"},
 hu:{cloud:"Hitelesített munkaterület",local:"Helyi munkaterület · nincs felhőszinkron",empty:"Nincs elérhető munkaterületi adat",demo:"PawFlow bemutató megjelenítése",hideDemo:"Bemutató elrejtése",demoLabel:"Felhasználó által kiválasztott bemutató"},
 de:{cloud:"Authentifizierter Workspace",local:"Lokaler Workspace · nicht cloud-synchronisiert",empty:"Keine Workspace-Daten verfügbar",demo:"PawFlow-Demo anzeigen",hideDemo:"Demo ausblenden",demoLabel:"Vom Benutzer ausgewählte Demo"},
 fr:{cloud:"Espace authentifié",local:"Espace local · non synchronisé dans le cloud",empty:"Aucune donnée d’espace disponible",demo:"Afficher la démo PawFlow",hideDemo:"Masquer la démo",demoLabel:"Démo sélectionnée par l’utilisateur"},
 es:{cloud:"Espacio autenticado",local:"Espacio local · no sincronizado en la nube",empty:"No hay datos del espacio disponibles",demo:"Mostrar demo de PawFlow",hideDemo:"Ocultar demo",demoLabel:"Demo seleccionada por el usuario"},
} as const

function workspaceSpec(customers: Row[], documents: Row[], expenses: Row[], invoices: Row[], planner: Row[]) {
 const open = planner.filter((item) => !item.done)
 const direction = deriveWorkspaceVisualDirection({ customerCount:customers.length, documentCount:documents.length, expenseCount:expenses.length, invoiceCount:invoices.length, plannerCount:planner.length })
 return { version:"0.1" as const, id:"workspace-overview", name:"HEGEVA Workspace", direction, nodes:[
  {id:"welcome",type:"hero" as const,props:{eyebrow:"Live workspace",title:"Your current work at a glance.",description:"A read-only summary from the records saved in this workspace."}},
  {id:"customers",type:"metric" as const,props:{label:"Customers",value:String(customers.length),detail:"Saved workspace records"}},
  {id:"documents",type:"metric" as const,props:{label:"Documents",value:String(documents.length),detail:"Saved workspace records"}},
  {id:"expenses",type:"metric" as const,props:{label:"Expenses",value:String(expenses.length),detail:"Saved workspace records"}},
  {id:"invoices",type:"metric" as const,props:{label:"Invoices & quotes",value:String(invoices.length),detail:"Saved workspace records"}},
  {id:"planner",type:"schedule" as const,props:{title:"Open planner work",items:open.slice(0,8).map((item,index)=>({id:item.id||`task-${index}`,time:item.due||"—",pet:item.title||"Untitled task",breed:"",service:"",price:""}))}},
 ]}
}

export default function X30AlphaPage(){
 const {locale}=useI18n(); const c=copy[locale]; const {data:session,isPending}=useSession(); const [showDemo,setShowDemo]=useState(false)
 const {items:customers,cloudEnabled:customerCloud}=useWorkspaceData<Row>("customers")
 const {items:documents}=useWorkspaceData<Row>("documents")
 const {items:expenses}=useWorkspaceData<Row>("expenses")
 const {items:invoices}=useWorkspaceData<Row>("invoice_documents")
 const {items:planner}=useWorkspaceData<Row>("planner")
 const cloud=Boolean(session?.user) && customerCloud
 const hasData=customers.length+documents.length+expenses.length+invoices.length+planner.length>0
 const spec=workspaceSpec(customers,documents,expenses,invoices,planner)
 const qualityFindings=evaluateVisualQuality({cardCount:2,repeatedLayouts:1,maxRadiusCount:4,hasHierarchy:true,hasMobileRules:true,hasFocusStyles:true,semanticAccentCount:2,hasFocalPoint:true,hasPrimaryAction:true,typographyLevels:4,overflowRisk:false})
 return <AppShell><main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
  <section className="x30-crown"><div><Link href="/app-studio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4"/>App Studio</Link><p>HEGEVA / NEXT GENERATION RUNTIME</p><h1>X30 <span>Alpha</span></h1><b>STRUCTURED. SAFE. DOMAIN-AWARE.</b><small>A deterministic proof that HEGEVA can turn a structured app specification into a distinctive interface without executing generated code.</small></div><div className="x30-core-object" aria-hidden><i/><i/><i/><Layers3/></div></section>
  <section className="x30-pipeline" aria-label="X30 rendering architecture">{[[Braces,"Structured spec","Version 0.1"],[Palette,"Domain direction","Layout + visual rhythm"],[Layers3,"Component registry","Allowlisted components"],[ShieldCheck,"Safe renderer","No generated code"],[CheckCircle2,"Visual result",`${qualityFindings.length} quality findings`]].map(([Icon,title,detail],index)=><div key={String(title)}><span>{String(index+1).padStart(2,"0")}</span><Icon aria-hidden/><b>{String(title)}</b><small>{String(detail)}</small>{index<4&&<ArrowRight aria-hidden/>}</div>)}</section>
  <section className="mt-8"><div className="mb-3 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-gold">{cloud ? c.cloud : c.local}</p><h2 className="mt-1 text-lg font-semibold">{showDemo ? "Pet grooming · warm booking-led direction" : "Workspace-aware structured preview"}</h2></div><div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full border border-violet/25 bg-violet/10 px-3 py-1.5 text-xs text-violet sm:inline-flex"><FlaskConical className="size-3.5"/>{showDemo ? c.demoLabel : "Read-only preview"}</span><button type="button" onClick={()=>setShowDemo((value)=>!value)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold">{showDemo ? c.hideDemo : c.demo}</button></div></div>{!isPending && !showDemo && !hasData ? <div role="status" className="rounded-2xl border border-border bg-background/40 p-6 text-sm text-muted-foreground">{c.empty}</div> : <SafeX30Renderer spec={showDemo ? pawflowX30Fixture : spec}/>}</section>
 </main></AppShell>
}
