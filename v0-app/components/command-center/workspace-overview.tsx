"use client"

import Link from "next/link"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { COMMAND_OVERVIEW_COPY } from "@/lib/i18n/command-overview-copy"

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
 return <section className="mt-8"><div><h2 className="text-xl font-semibold text-foreground">{c.overview}</h2><p className="mt-1 text-sm text-muted-foreground">{c.overviewDesc}</p></div>
  <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">{metrics.map((metric)=><Link key={metric.label} href={metric.href} className="glass-panel glass-panel-hover rounded-2xl p-4"><p className="text-xs text-muted-foreground">{metric.label}</p><p className="mt-2 text-2xl font-semibold text-foreground">{metric.value}</p></Link>)}</div>
  <div className={`mt-4 flex items-center gap-3 rounded-2xl border p-4 ${attention?"border-gold/35 bg-gold/8":"border-primary/25 bg-primary/8"}`}>{attention?<AlertTriangle className="size-5 shrink-0 text-gold"/>:<CheckCircle2 className="size-5 shrink-0 text-primary"/>}<div><p className="text-sm font-semibold">{c.attention}</p><p className="mt-0.5 text-xs text-muted-foreground">{attention?`${overdueInvoices} ${c.overdueInvoices} · ${overdueTasks} ${c.overdueTasks}`:c.noAttention}</p></div></div>
 </section>
}
