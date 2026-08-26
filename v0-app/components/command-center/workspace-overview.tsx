"use client"

import Link from "next/link"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { COMMAND_OVERVIEW_COPY } from "@/lib/i18n/command-overview-copy"
import { IntelligenceCard, MetricCard, SectionHeading } from "@/components/visual-engine"

type RecordItem={id:string;amount?:number}
type Task={id:string;due?:string;done:boolean}
type Invoice={id:string;type:"invoice"|"quote";status?:"draft"|"sent"|"paid";dueDate?:string}

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
  {label:c.customers,value:customers.length,href:"/business/customers"},{label:c.documents,value:documents.length,href:"/business/documents"},
  {label:c.expenses,value:`£${expenseTotal.toFixed(2)}`,href:"/business/expenses"},{label:c.openTasks,value:openTasks,href:"/business/planner"},
  {label:c.invoices,value:invoices.length,href:"/business/invoices"},{label:c.paid,value:paid,href:"/business/invoices"},
 ]
 const attention=overdueTasks+overdueInvoices
 return <section className="mt-9"><SectionHeading eyebrow="Live workspace" title={c.overview} description={c.overviewDesc}/>
  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{metrics.map((metric,index)=><Link key={metric.label} href={metric.href} className="rounded-3xl focus-visible:outline-none"><MetricCard label={metric.label} value={metric.value} tone={index===2?"cyan":index===4?"violet":"neutral"} className="h-full transition-transform hover:-translate-y-0.5"/></Link>)}</div>
  <IntelligenceCard tone={attention?"gold":"emerald"} className="mt-4 flex items-center gap-3 p-4">{attention?<AlertTriangle className="size-5 shrink-0 text-gold"/>:<CheckCircle2 className="size-5 shrink-0 text-primary"/>}<div><p className="text-sm font-semibold">{c.attention}</p><p className="mt-0.5 text-xs text-muted-foreground">{attention?`${overdueInvoices} ${c.overdueInvoices} · ${overdueTasks} ${c.overdueTasks}`:c.noAttention}</p></div></IntelligenceCard>
 </section>
}
