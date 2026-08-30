"use client"

import Link from "next/link"
import { AlertTriangle, ArrowUpRight, Bot, Blocks, Check, Circle, Cloud, FileText, ListChecks, MessageSquareText, Receipt, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { AICore } from "@/components/visual-engine"
import { cn } from "@/lib/utils"
import { createWorkspaceMissionProjection } from "@/lib/foundation/brain-runtime"
import { createWorkspacePulseProjection } from "@/lib/foundation/roadmap-foundations"

type RecordItem={id:string;amount?:number}
type Task={id:string;due?:string;done:boolean;title?:string}
type Invoice={id:string;type:"invoice"|"quote";status?:"draft"|"sent"|"paid";dueDate?:string}

const copy={
 en:{eyebrow:"Operating picture",title:"Your work, in one line of sight",sub:"HEGEVA reads the real records in this workspace. Nothing below is simulated.",mission:"Workspace readiness mission",goal:"Turn scattered work into an operating workspace",understand:"Understand",plan:"Plan",work:"Execute",check:"Check",result:"Result",current:"Current work",empty:"No open tasks yet",openPlanner:"Open planner",inventory:"Workspace inventory",customers:"Customers",documents:"Documents",expenses:"Expenses",invoices:"Invoices",messages:"Messages",assistant:"Assistant",appStudio:"App Studio",available:"Available",attention:"Needs attention",clear:"No overdue tasks or invoices",sync:"Workspace data",cloud:"Authenticated cloud workspace",local:"Local workspace · not cloud-synced"},
 hu:{eyebrow:"Működési kép",title:"A munkád egyetlen áttekinthető térben",sub:"A HEGEVA a munkaterület valódi rekordjait olvassa. Az alábbi adatok nem szimuláltak.",mission:"Munkaterület-készenléti küldetés",goal:"A szétszórt munkából működő munkaterület",understand:"Megértés",plan:"Tervezés",work:"Végrehajtás",check:"Ellenőrzés",result:"Eredmény",current:"Aktuális munka",empty:"Még nincs nyitott feladat",openPlanner:"Tervező megnyitása",inventory:"Munkaterület-leltár",customers:"Ügyfelek",documents:"Dokumentumok",expenses:"Kiadások",invoices:"Számlák",messages:"Üzenetek",assistant:"Asszisztens",appStudio:"App Stúdió",available:"Elérhető",attention:"Figyelmet igényel",clear:"Nincs lejárt feladat vagy számla",sync:"Munkaterület-adatok",cloud:"Hitelesített felhő-munkaterület",local:"Helyi munkaterület · nincs felhőszinkron"},
 de:{eyebrow:"Betriebsbild",title:"Ihre Arbeit in einer klaren Sicht",sub:"HEGEVA liest echte Datensätze dieses Arbeitsbereichs. Nichts ist simuliert.",mission:"Workspace-Bereitschaftsmission",goal:"Verteilte Arbeit in einen operativen Workspace verwandeln",understand:"Verstehen",plan:"Planen",work:"Ausführen",check:"Prüfen",result:"Ergebnis",current:"Aktuelle Arbeit",empty:"Noch keine offenen Aufgaben",openPlanner:"Planer öffnen",inventory:"Workspace-Inventar",customers:"Kunden",documents:"Dokumente",expenses:"Ausgaben",invoices:"Rechnungen",messages:"Nachrichten",assistant:"Assistent",appStudio:"App Studio",available:"Verfügbar",attention:"Aufmerksamkeit nötig",clear:"Keine überfälligen Aufgaben oder Rechnungen",sync:"Workspace-Daten",cloud:"Authentifizierter Cloud-Workspace",local:"Lokaler Workspace · nicht cloud-synchronisiert"},
 fr:{eyebrow:"Vue opérationnelle",title:"Votre travail dans un seul champ de vision",sub:"HEGEVA lit les données réelles de cet espace. Rien n’est simulé.",mission:"Mission de préparation de l’espace",goal:"Transformer le travail dispersé en espace opérationnel",understand:"Comprendre",plan:"Planifier",work:"Exécuter",check:"Vérifier",result:"Résultat",current:"Travail actuel",empty:"Aucune tâche ouverte",openPlanner:"Ouvrir le planning",inventory:"Inventaire",customers:"Clients",documents:"Documents",expenses:"Dépenses",invoices:"Factures",messages:"Messages",assistant:"Assistant",appStudio:"App Studio",available:"Disponible",attention:"À surveiller",clear:"Aucune tâche ou facture en retard",sync:"Données de l’espace",cloud:"Espace cloud authentifié",local:"Espace local · non synchronisé dans le cloud"},
 es:{eyebrow:"Vista operativa",title:"Tu trabajo en un único campo de visión",sub:"HEGEVA lee los registros reales de este espacio. Nada está simulado.",mission:"Misión de preparación",goal:"Convertir trabajo disperso en un espacio operativo",understand:"Comprender",plan:"Planificar",work:"Ejecutar",check:"Verificar",result:"Resultado",current:"Trabajo actual",empty:"Aún no hay tareas abiertas",openPlanner:"Abrir planificador",inventory:"Inventario",customers:"Clientes",documents:"Documentos",expenses:"Gastos",invoices:"Facturas",messages:"Mensajes",assistant:"Asistente",appStudio:"App Studio",available:"Disponible",attention:"Requiere atención",clear:"Sin tareas ni facturas vencidas",sync:"Datos del espacio",cloud:"Espacio cloud autenticado",local:"Espacio local · no sincronizado en la nube"},
} as const
const missionUx={
 en:{prepared:"Planning context prepared",approval:"Awaiting owner approval",notStarted:"Execution not started"},
 hu:{prepared:"A tervezési kontextus elkészült",approval:"Tulajdonosi jóváhagyásra vár",notStarted:"A végrehajtás nem indult el"},
 de:{prepared:"Planungskontext vorbereitet",approval:"Warten auf Inhaberfreigabe",notStarted:"Ausführung nicht gestartet"},
 fr:{prepared:"Contexte de planification préparé",approval:"En attente de l’approbation du propriétaire",notStarted:"Exécution non démarrée"},
 es:{prepared:"Contexto de planificación preparado",approval:"Pendiente de aprobación del propietario",notStarted:"La ejecución no ha comenzado"},
} as const

export function OperatingCenter(){
 const {locale}=useI18n();const c=copy[locale]
 const ux=missionUx[locale]
 const {items:customers,syncState,cloudEnabled}=useWorkspaceData<RecordItem>("customers")
 const {items:documents}=useWorkspaceData<RecordItem>("documents")
 const {items:expenses}=useWorkspaceData<RecordItem>("expenses")
 const {items:tasks}=useWorkspaceData<Task>("planner")
 const {items:invoices}=useWorkspaceData<Invoice>("invoice_documents")
 const {items:messages}=useWorkspaceData<RecordItem>("messages")
 const today=new Date().toISOString().slice(0,10)
 const open=tasks.filter(item=>!item.done)
 const overdueTasks=open.filter(item=>item.due&&item.due<today).length
 const overdueInvoices=invoices.filter(item=>item.type==="invoice"&&item.status!=="paid"&&item.dueDate&&item.dueDate<today).length
 const hasRecords=customers.length+documents.length+expenses.length+invoices.length>0
 const missionProjection=createWorkspaceMissionProjection({scope:cloudEnabled?"authenticated-cloud":"local-browser",hasRecords,openTasks:open.length,overdueItems:overdueTasks+overdueInvoices})
 const pulse=createWorkspacePulseProjection({scope:cloudEnabled?"authenticated-cloud":"local-browser",hasRecords,openTasks:open.length,missionState:"awaiting-approval"})
 const stages=[{label:c.understand,done:hasRecords,active:!hasRecords},{label:c.plan,done:tasks.length>0,active:hasRecords&&tasks.length===0},{label:c.work,done:tasks.length>0&&open.length===0,active:open.length>0},{label:c.check,done:hasRecords&&overdueTasks+overdueInvoices===0,active:false},{label:c.result,done:hasRecords&&tasks.length>0&&open.length===0&&overdueTasks+overdueInvoices===0,active:false}]
 const completedStages=stages.filter(stage=>stage.done).length
 const currentStage=missionProjection.stage==="permission"?c.plan:stages.find(stage=>stage.active)?.label||stages.find(stage=>!stage.done)?.label||c.result
 const inventory=[[Users,c.customers,customers.length,"/business/customers"],[FileText,c.documents,documents.length,"/business/documents"],[Receipt,c.expenses,expenses.length,"/business/expenses"],[ListChecks,c.invoices,invoices.length,"/business/invoices"],[MessageSquareText,c.messages,messages.length,"/business/messages"]] as const
 return <section className="mt-8 overflow-hidden border-y border-border bg-background/35">
  <div className="control-room-head"><div><p className="ve-eyebrow">{c.eyebrow}</p><h2>{c.title}</h2><p>{c.sub}</p></div><div className="flex items-center gap-3"><AICore state={syncState==="saving"?"working":syncState==="error"?"warning":"ready"}/><div><strong className="block text-sm">{c.sync}</strong><span className="text-xs capitalize text-muted-foreground">{syncState}</span></div></div></div>
  <div className="control-room-grid">
   <article className="mission-surface"><header><div><p>{c.mission}</p><h3>{c.goal}</h3><small className="mt-2 block text-xs text-muted-foreground">{missionProjection.safeSummary}</small><small className="block text-xs text-muted-foreground">{ux.prepared} · {ux.approval} · {ux.notStarted}{missionProjection.needsUser ? ` · ${missionProjection.needsUser}` : ""}</small></div><span>01</span></header><div className="mission-body"><div className="mission-core-visual" style={{background:`conic-gradient(var(--gold) ${completedStages*72}deg,oklch(.82 .13 85/.07) 0)`}}><div><AICore state={completedStages===stages.length?"completed":open.length?"working":"ready"}/><small>{currentStage}</small><strong>{completedStages}/{stages.length}</strong></div></div><ol>{stages.map((stage,index)=><li key={stage.label} className={cn(stage.done&&"is-done",stage.active&&"is-active")}><span>{stage.done?<Check aria-hidden/>:stage.active?<span className="mission-current"/>:<Circle aria-hidden/>}</span><div><b>{stage.label}</b><small>{index+1} / {stages.length}</small></div></li>)}</ol></div></article>
   <article className="current-work"><header><div><p>{c.current}</p><span className="text-xs text-muted-foreground">{pulse.understood}</span></div><Link href="/business/planner">{c.openPlanner}<ArrowUpRight aria-hidden/></Link></header>{open.length?<div>{open.slice(0,4).map((task,index)=><div key={task.id}><span>{String(index+1).padStart(2,"0")}</span><p>{task.title||`${c.current} ${index+1}`}</p><time>{task.due||"—"}</time></div>)}</div>:<div className="current-empty"><Check className="size-5 text-primary"/><p>{c.empty}</p></div>}
    <footer className={cn(overdueTasks+overdueInvoices&&"has-alert")}><AlertTriangle aria-hidden/><span>{overdueTasks+overdueInvoices?`${overdueTasks+overdueInvoices} · ${c.attention}`:c.clear}</span></footer></article>
  </div>
  <div className="inventory-strip"><p>{c.inventory}</p>{inventory.map(([Icon,label,value,href])=><Link key={label} href={href}><Icon aria-hidden/><span>{label}</span><strong>{value}</strong></Link>)}<span className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground xl:flex"><Cloud className="size-3.5"/>{cloudEnabled ? c.cloud : c.local}</span></div>
  <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3 sm:px-6"><Link href="/assistant" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold"><Bot aria-hidden className="size-3.5"/>{c.assistant}<span className="text-muted-foreground">· {c.available}</span></Link><Link href="/app-studio/build-my-app-x20" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold"><Blocks aria-hidden className="size-3.5"/>{c.appStudio}<span className="text-muted-foreground">· {c.available}</span></Link></div>
 </section>
}
