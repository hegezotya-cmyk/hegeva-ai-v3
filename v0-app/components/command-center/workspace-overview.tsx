"use client"

import Link from "next/link"
import { AlertTriangle, CalendarClock, CheckCircle2, FileSpreadsheet, FileText, Receipt, Users, WalletCards } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { COMMAND_OVERVIEW_COPY } from "@/lib/i18n/command-overview-copy"
import { IntelligenceCard, SectionHeading, SignalIcon } from "@/components/visual-engine"

type RecordItem={id:string;amount?:number}
type Task={id:string;due?:string;done:boolean}
type Invoice={id:string;type:"invoice"|"quote";status?:"draft"|"sent"|"paid";dueDate?:string}

const tones=["emerald","cyan","gold","violet","cyan","emerald"] as const
const icons=[Users,FileText,Receipt,CalendarClock,FileSpreadsheet,WalletCards]

export function WorkspaceOverview(){
 const {locale}=useI18n();const c=COMMAND_OVERVIEW_COPY[locale]
 const {items:customers}=useWorkspaceData<RecordItem>("customers")
 const {items:documents}=useWorkspaceData<RecordItem>("documents")
 const {items:expenses}=useWorkspaceData<RecordItem>("expenses")
 const {items:tasks}=useWorkspaceData<Task>("planner")
 const {items:invoices}=useWorkspaceData<Invoice>("invoice_documents")
 const today=new Date().toISOString().slice(0,10)
 const openTasks=tasks.filter((item)=>!item.done).length
 const overdueTasks=tasks.filter((item)=>!item.done&&Boolean(item.due)&&item.due!<today).length
 const overdueInvoices=invoices.filter((item)=>item.type==="invoice"&&item.status!=="paid"&&Boolean(item.dueDate)&&item.dueDate!<today).length
 const paid=invoices.filter((item)=>item.type==="invoice"&&item.status==="paid").length
 const expenseTotal=expenses.reduce((sum,item)=>sum+(Number(item.amount)||0),0)
 const metrics=[
  {label:c.customers,value:customers.length,href:"/business/customers"},
  {label:c.documents,value:documents.length,href:"/business/documents"},
  {label:c.expenses,value:`£${expenseTotal.toFixed(2)}`,href:"/business/expenses"},
  {label:c.openTasks,value:openTasks,href:"/business/planner"},
  {label:c.invoices,value:invoices.length,href:"/business/invoices"},
  {label:c.paid,value:paid,href:"/business/invoices"},
 ]
 const attention=overdueTasks+overdueInvoices
 return (
  <section className="mt-9">
   <SectionHeading eyebrow="Live workspace" title={c.overview} description={c.overviewDesc}/>
   <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
    {metrics.map((metric,index)=>{const Icon=icons[index];return(
     <Link key={metric.label} href={metric.href} className="group rounded-3xl focus-visible:outline-none">
      <IntelligenceCard tone={tones[index]} interactive className="relative h-full min-h-32 overflow-hidden p-4 sm:min-h-36 sm:p-5">
       <div className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-current/5 blur-2xl" aria-hidden />
       <div className="flex items-start justify-between gap-3">
        <SignalIcon icon={Icon} tone={tones[index]} className="size-9 rounded-xl sm:size-10" />
        <span className="mt-1 size-1.5 rounded-full bg-current opacity-45 shadow-[0_0_12px_currentColor]" aria-hidden />
       </div>
       <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground sm:text-[11px]">{metric.label}</p>
       <p className="mt-1 break-words font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{metric.value}</p>
       <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-current/20 to-transparent opacity-70 transition-opacity group-hover:opacity-100" aria-hidden />
      </IntelligenceCard>
     </Link>
    )})}
   </div>
   <IntelligenceCard tone={attention?"gold":"emerald"} className="relative mt-4 overflow-hidden p-4 sm:p-5">
    <div className="pointer-events-none absolute right-0 top-0 size-32 rounded-full bg-current/5 blur-3xl" aria-hidden />
    <div className="relative flex items-start gap-3 sm:items-center">
     <SignalIcon icon={attention?AlertTriangle:CheckCircle2} tone={attention?"gold":"emerald"} className="size-10 shrink-0 rounded-xl" />
     <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">{c.attention}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{attention?`${overdueInvoices} ${c.overdueInvoices} · ${overdueTasks} ${c.overdueTasks}`:c.noAttention}</p>
     </div>
    </div>
   </IntelligenceCard>
  </section>
 )
}
