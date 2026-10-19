export const BUSINESS_RULES_VERSION = 1

export type BusinessRuleKind =
  | "overdue-invoice"
  | "stale-quote"
  | "lead-follow-up"
  | "dormant-customer"
  | "overdue-task"

export type BusinessRuleSignal = {
  id: string
  kind: BusinessRuleKind
  sourceIds: string[]
  count: number
  priority: "high" | "medium"
  role: "Sales" | "Finance" | "Support"
  targetHref: string
  reason: string
  requiresApproval: true
}

type Customer = { id:string; customerStatus?:"lead"|"active"|"paused"; followUp?:string; updatedAt?:string; createdAt?:string }
type Invoice = { id:string; type:"invoice"|"quote"; status?:string; dueDate?:string }
type Task = { id:string; done:boolean; due?:string }

const day = (value?:string) => value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0,10) : null
const unique = (values:string[]) => [...new Set(values.filter(Boolean))]

export function evaluateBusinessRules(input:{today:string;customers:Customer[];invoices:Invoice[];tasks:Task[]}):BusinessRuleSignal[]{
  const {today,customers,invoices,tasks}=input
  if(!day(today)) return []
  const signals:BusinessRuleSignal[]=[]

  const overdueInvoices=invoices.filter(x=>x.type==="invoice"&&x.status!=="paid"&&day(x.dueDate)&&x.dueDate!<today)
  if(overdueInvoices.length) signals.push({id:"rule:overdue-invoice",kind:"overdue-invoice",sourceIds:unique(overdueInvoices.map(x=>x.id)),count:overdueInvoices.length,priority:"high",role:"Finance",targetHref:"/business/intelligence#customer-follow-up",reason:"Invoice is overdue. Prepare a payment follow-up for owner review.",requiresApproval:true})

  const staleQuotes=invoices.filter(x=>x.type==="quote"&&x.status!=="paid"&&day(x.dueDate)&&x.dueDate!<today)
  if(staleQuotes.length) signals.push({id:"rule:stale-quote",kind:"stale-quote",sourceIds:unique(staleQuotes.map(x=>x.id)),count:staleQuotes.length,priority:"high",role:"Sales",targetHref:"/business/intelligence#customer-follow-up",reason:"Quote is past its follow-up date. Prepare a sales follow-up for owner review.",requiresApproval:true})

  const leads=customers.filter(x=>x.customerStatus==="lead"&&day(x.followUp)&&x.followUp!<=today)
  if(leads.length) signals.push({id:"rule:lead-follow-up",kind:"lead-follow-up",sourceIds:unique(leads.map(x=>x.id)),count:leads.length,priority:"high",role:"Sales",targetHref:"/business/customers",reason:"Lead follow-up is due. Prepare the next step for owner review.",requiresApproval:true})

  const cutoff=new Date(today+"T00:00:00Z"); cutoff.setUTCDate(cutoff.getUTCDate()-90); const dormantBefore=cutoff.toISOString().slice(0,10)
  const dormant=customers.filter(x=>x.customerStatus==="active"&&day(x.updatedAt||x.createdAt)&&((x.updatedAt||x.createdAt)!.slice(0,10)<dormantBefore))
  if(dormant.length) signals.push({id:"rule:dormant-customer",kind:"dormant-customer",sourceIds:unique(dormant.map(x=>x.id)),count:dormant.length,priority:"medium",role:"Sales",targetHref:"/business/customers",reason:"Active customer has had no recorded activity for 90 days. Prepare a re-engagement review.",requiresApproval:true})

  const overdueTasks=tasks.filter(x=>!x.done&&day(x.due)&&x.due!<today)
  if(overdueTasks.length) signals.push({id:"rule:overdue-task",kind:"overdue-task",sourceIds:unique(overdueTasks.map(x=>x.id)),count:overdueTasks.length,priority:"medium",role:"Support",targetHref:"/business/planner",reason:"Open task is overdue. Prepare it for owner triage.",requiresApproval:true})

  return signals
}
