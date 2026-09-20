export const LEAD_TO_MONEY_VERSION = 1 as const
export type LeadToMoneyStage="lead"|"qualified"|"customer"|"quote"|"follow-up"|"invoice"|"payment"|"repeat-business"
export type LeadToMoneyRecord={id:string;stage:LeadToMoneyStage;sourceIds:string[];status:"observed"|"needs-attention"|"complete";reason:string;nextStage?:LeadToMoneyStage;targetHref:string}
type Customer={id:string;customerStatus?:"lead"|"active"|"paused";followUp?:string}
type Document={id:string;type:"quote"|"invoice";status?:string;customerId?:string;sourceId?:string}
type Message={id:string;sourceId?:string;workflowStatus?:"draft"|"approved"|"completed"}
const ids=(v:string[])=>[...new Set(v.filter(Boolean))]
export function projectLeadToMoney(input:{today:string;customers:Customer[];documents:Document[];messages:Message[]}):LeadToMoneyRecord[]{
 const {today,customers=[],documents=[],messages=[]}=input;if(!/^\d{4}-\d{2}-\d{2}/.test(today))return[];const out:LeadToMoneyRecord[]=[]
 for(const customer of customers){const docs=documents.filter(d=>d.customerId===customer.id||d.sourceId===customer.id),quotes=docs.filter(d=>d.type==="quote"),invoices=docs.filter(d=>d.type==="invoice"),related=ids([customer.id,...docs.map(d=>d.id)]),msgs=messages.filter(m=>m.sourceId&&related.includes(m.sourceId)),paid=invoices.some(i=>i.status==="paid"),openInvoice=invoices.some(i=>i.status!=="paid"),quote=quotes.length>0,followup=msgs.some(m=>["draft","approved","completed"].includes(m.workflowStatus||""))||Boolean(customer.followUp)
  if(customer.customerStatus==="lead"){out.push({id:`ltm:${customer.id}:lead`,stage:"lead",sourceIds:[customer.id],status:"observed",reason:"Lead exists in workspace.",nextStage:"qualified",targetHref:"/business/customers"});if(!quote)out.push({id:`ltm:${customer.id}:qualification`,stage:"qualified",sourceIds:[customer.id],status:"needs-attention",reason:"Lead has no linked quote yet; review qualification before preparing an offer.",nextStage:"quote",targetHref:"/business/customers"})}
  if(customer.customerStatus==="active")out.push({id:`ltm:${customer.id}:customer`,stage:"customer",sourceIds:[customer.id],status:"complete",reason:"Customer is active.",nextStage:quote?"follow-up":"quote",targetHref:"/business/customers"})
  if(quote)out.push({id:`ltm:${customer.id}:quote`,stage:"quote",sourceIds:ids([customer.id,...quotes.map(x=>x.id)]),status:"complete",reason:"Linked quote exists.",nextStage:"follow-up",targetHref:"/business/invoices"})
  if(quote&&!followup&&!openInvoice&&!paid)out.push({id:`ltm:${customer.id}:follow-up`,stage:"follow-up",sourceIds:ids([customer.id,...quotes.map(x=>x.id)]),status:"needs-attention",reason:"Quote exists without recorded follow-up or invoice.",nextStage:"invoice",targetHref:"/business/messages"})
  if(openInvoice)out.push({id:`ltm:${customer.id}:invoice`,stage:"invoice",sourceIds:ids([customer.id,...invoices.filter(x=>x.status!=="paid").map(x=>x.id)]),status:"needs-attention",reason:"Invoice exists and payment is not recorded as paid.",nextStage:"payment",targetHref:"/business/invoices"})
  if(paid)out.push({id:`ltm:${customer.id}:payment`,stage:"payment",sourceIds:ids([customer.id,...invoices.filter(x=>x.status==="paid").map(x=>x.id)]),status:"complete",reason:"Paid invoice is recorded.",nextStage:"repeat-business",targetHref:"/business/invoices"})
  if(paid&&customer.customerStatus==="active")out.push({id:`ltm:${customer.id}:repeat`,stage:"repeat-business",sourceIds:related,status:"observed",reason:"Active customer has completed paid work; repeat-business review is supported.",targetHref:"/business/customers"})
 }return out
}
