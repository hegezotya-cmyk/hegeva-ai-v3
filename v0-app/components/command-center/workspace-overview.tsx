"use client"

import Link from "next/link"
import { AlertTriangle, CalendarClock, CheckCircle2, FileSpreadsheet, FileText, Receipt, Users, WalletCards } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { authClient } from "@/lib/auth-client"
import { COMMAND_OVERVIEW_COPY } from "@/lib/i18n/command-overview-copy"
import { createOperatingCenterSnapshot } from "@/lib/operating-center/runtime"
import { AICore, IntelligenceCard, MetricCard, SectionHeading, SignalIcon } from "@/components/visual-engine"

type RecordItem={id:string;amount?:number}
type Task={id:string;due?:string;done:boolean}
type Invoice={id:string;type:"invoice"|"quote";status?:"draft"|"sent"|"paid";dueDate?:string}

const tones=["emerald","cyan","gold","violet","cyan","emerald"] as const
const icons=[Users,FileText,Receipt,CalendarClock,FileSpreadsheet,WalletCards]

const operatingCopy={
 en:{title:"Workspace readiness",desc:"A deterministic view of saved records and current work. Nothing here runs automatically.",current:"Current stage",complete:"Completed stages",stages:{understand:"Understand",plan:"Plan",execute:"Execute",check:"Check",result:"Result"}},
 hu:{title:"Munkaterület-készenlét",desc:"A mentett adatok és az aktuális munka determinisztikus nézete. Semmi sem fut automatikusan.",current:"Aktuális szakasz",complete:"Befejezett szakaszok",stages:{understand:"Megértés",plan:"Tervezés",execute:"Végrehajtás",check:"Ellenőrzés",result:"Eredmény"}},
 de:{title:"Workspace-Bereitschaft",desc:"Eine deterministische Ansicht gespeicherter Daten und aktueller Arbeit. Es werden keine Aktionen automatisch ausgeführt.",current:"Aktuelle Phase",complete:"Abgeschlossene Phasen",stages:{understand:"Verstehen",plan:"Planen",execute:"Ausführen",check:"Prüfen",result:"Ergebnis"}},
 fr:{title:"Préparation de l’espace",desc:"Une vue déterministe des données enregistrées et du travail actuel. Aucune action n’est exécutée automatiquement.",current:"Étape actuelle",complete:"Étapes terminées",stages:{understand:"Comprendre",plan:"Planifier",execute:"Exécuter",check:"Vérifier",result:"Résultat"}},
 es:{title:"Preparación del espacio",desc:"Una vista determinista de los datos guardados y del trabajo actual. No ejecuta acciones automáticamente.",current:"Etapa actual",complete:"Etapas completadas",stages:{understand:"Comprender",plan:"Planificar",execute:"Ejecutar",check:"Verificar",result:"Resultado"}},
} as const

export function WorkspaceOverview(){
 const {locale}=useI18n();const c=COMMAND_OVERVIEW_COPY[locale]
 const oc=operatingCopy[locale]
 const {data:session}=authClient.useSession()
 const {items:customers,syncState}=useWorkspaceData<RecordItem>("customers")
 const {items:documents}=useWorkspaceData<RecordItem>("documents")
 const {items:expenses}=useWorkspaceData<RecordItem>("expenses")
 const {items:tasks}=useWorkspaceData<Task>("planner")
 const {items:invoices}=useWorkspaceData<Invoice>("invoice_documents")
 const today=new Date().toISOString().slice(0,10)
 const snapshot=createOperatingCenterSnapshot({ownerUserId:session?.user?.id??"guest",workspaceId:session?.user?.id?`user:${session.user.id}`:"guest",today,syncState,customers,documents,expenses,tasks,invoices})
 const paid=invoices.filter((item)=>item.type==="invoice"&&item.status==="paid").length
 const expenseTotal=expenses.reduce((sum,item)=>sum+(Number(item.amount)||0),0)
 const metrics=[
  {label:c.customers,value:snapshot.inventory.customers,href:"/business/customers"},
  {label:c.documents,value:snapshot.inventory.documents,href:"/business/documents"},
  {label:c.expenses,value:`£${expenseTotal.toFixed(2)}`,href:"/business/expenses"},
  {label:c.openTasks,value:snapshot.openTaskCount,href:"/business/planner"},
  {label:c.invoices,value:snapshot.inventory.invoices,href:"/business/invoices"},
  {label:c.paid,value:paid,href:"/business/invoices"},
 ]
 const attention=snapshot.overdue.total
 return (
  <section className="mt-9">
   <SectionHeading eyebrow="Live workspace" title={c.overview} description={c.overviewDesc}/>
   <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
    {metrics.map((metric,index)=>{const Icon=icons[index];return(
     <Link key={metric.label} href={metric.href} className="group rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <MetricCard label={metric.label} value={metric.value} icon={Icon} tone={tones[index]} className="h-full min-h-32 transition-transform group-hover:-translate-y-0.5 sm:min-h-36" />
     </Link>
    )})}
   </div>
   <IntelligenceCard tone="cyan" className="relative mt-4 overflow-hidden p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="ve-eyebrow">{oc.title}</p><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{oc.desc}</p></div><AICore state={syncState==="checking"||syncState==="saving"?"thinking":"ready"}/></div>
    <ol className="mt-6 grid gap-2 sm:grid-cols-5">{snapshot.stages.map((stage,index)=><li key={stage.id} className="rounded-xl border border-white/10 bg-background/30 p-3"><span className="text-[10px] text-muted-foreground">{String(index+1).padStart(2,"0")}</span><strong className="mt-2 block text-xs">{oc.stages[stage.id]}</strong><span className={`mt-3 block h-1.5 rounded-full ${stage.status==="completed"?"bg-primary":stage.status==="active"?"bg-cyan":"bg-secondary"}`} aria-hidden /></li>)}</ol>
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"><span>{oc.current}: <strong className="text-foreground">{oc.stages[snapshot.currentStage]}</strong></span><span>{oc.complete}: <strong className="text-foreground">{snapshot.completedStages}/5</strong></span></div>
   </IntelligenceCard>
   <IntelligenceCard tone={attention?"gold":"emerald"} className="relative mt-4 overflow-hidden p-4 sm:p-5">
    <div className="pointer-events-none absolute right-0 top-0 size-32 rounded-full bg-current/5 blur-3xl" aria-hidden />
    <div className="relative flex items-start gap-3 sm:items-center">
     <SignalIcon icon={attention?AlertTriangle:CheckCircle2} tone={attention?"gold":"emerald"} className="size-10 shrink-0 rounded-xl" />
     <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">{c.attention}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{attention?`${snapshot.overdue.invoices} ${c.overdueInvoices} · ${snapshot.overdue.tasks} ${c.overdueTasks}`:c.noAttention}</p>
     </div>
    </div>
   </IntelligenceCard>
  </section>
 )
}
