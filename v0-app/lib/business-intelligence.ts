export type IntelligenceTask={id:string;title:string;due?:string;priority:"low"|"medium"|"high";done:boolean}
export type IntelligenceInvoice={id:string;type:"invoice"|"quote";status?:"draft"|"sent"|"paid";number:string;issueDate:string;dueDate:string;currency:string;vatRate:number;businessName:string;businessDetails:string;clientName:string;clientDetails:string;items:{id:string;description:string;quantity:number;unitPrice:number}[];notes:string;createdAt:string;updatedAt:string}

export const invoiceTotal=(doc:IntelligenceInvoice)=>doc.items.reduce((sum,item)=>sum+(Number(item.quantity)||0)*(Number(item.unitPrice)||0),0)*(1+(Number(doc.vatRate)||0)/100)

export function topActions(tasks:IntelligenceTask[],invoices:IntelligenceInvoice[],today:string){
 const overdueTasks=tasks.filter(x=>!x.done&&x.due&&x.due<today)
 const overdueInvoices=invoices.filter(x=>x.type==="invoice"&&x.status!=="paid"&&x.dueDate<today)
 const dueToday=tasks.filter(x=>!x.done&&x.due===today)
 return [overdueInvoices.length&&`${overdueInvoices.length} overdue invoice${overdueInvoices.length===1?"":"s"} need follow-up`,overdueTasks.length&&`${overdueTasks.length} overdue task${overdueTasks.length===1?"":"s"} need attention`,dueToday.length&&`${dueToday.length} task${dueToday.length===1?"":"s"} due today`,!overdueInvoices.length&&!overdueTasks.length&&!dueToday.length&&"Review this week's priorities"].filter(Boolean).slice(0,3) as string[]
}

export function createAdVariants(product:string,audience:string,benefit:string){
 const p=product.trim().slice(0,120),a=audience.trim().slice(0,120),b=benefit.trim().slice(0,180)
 if(!p||!a||!b)return []
 return [
  {channel:"Facebook",headline:`Make progress with ${p}`,body:`Built for ${a}. ${b}. Discover a clearer way to move forward.`,cta:"Learn more"},
  {channel:"Instagram",headline:`Meet ${p}`,body:`${b}. Created for ${a}.`,cta:"See how it works"},
  {channel:"Google",headline:`${p} for ${a}`,body:`${b}. Explore the offer and choose the right next step.`,cta:"Get started"},
 ]
}

export function extractTaskCandidates(text:string){
 const date=/\b(20\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01]))\b/
 const action=/\b(must|need to|should|deadline|due|follow up|send|review|complete|kell|határidő|teendő|küld|ellenőriz|befejez)/i
 return text.split(/\r?\n|(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=8&&(date.test(x)||action.test(x))).slice(0,8).map((title,index)=>({id:`candidate-${index}`,title:title.slice(0,180),due:(title.match(date)?.[1]||"").replace(/[/.]/g,"-")||undefined}))
}

export function watchtowerSignals(tasks:IntelligenceTask[],invoices:IntelligenceInvoice[],today:string){
 const signals:{severity:"info"|"warning"|"critical";title:string;evidence:string}[]=[]
 const overdueInvoices=invoices.filter(x=>x.type==="invoice"&&x.status!=="paid"&&x.dueDate<today)
 const overdueTasks=tasks.filter(x=>!x.done&&x.due&&x.due<today)
 const staleQuotes=invoices.filter(x=>x.type==="quote"&&x.status!=="paid"&&x.dueDate<today)
 if(overdueInvoices.length)signals.push({severity:"critical",title:"Overdue invoices",evidence:`${overdueInvoices.length} unpaid invoice(s), ${overdueInvoices.reduce((sum,x)=>sum+invoiceTotal(x),0).toFixed(2)} total before currency separation`})
 if(overdueTasks.length)signals.push({severity:"warning",title:"Overdue work",evidence:`${overdueTasks.length} task(s) passed their due date`})
 if(staleQuotes.length)signals.push({severity:"warning",title:"Quotes need follow-up",evidence:`${staleQuotes.length} quote(s) passed their follow-up date`})
 if(!signals.length)signals.push({severity:"info",title:"No urgent workspace signal",evidence:"No overdue task, invoice or quote was found"})
 return signals
}

export function convertQuoteToInvoice(quote:IntelligenceInvoice,existing:IntelligenceInvoice[]):IntelligenceInvoice{
 const year=new Date().getUTCFullYear(),count=existing.filter(x=>x.type==="invoice"&&x.number.startsWith(`INV-${year}-`)).length+1,now=new Date().toISOString()
 return {...quote,id:crypto.randomUUID(),type:"invoice",status:"draft",number:`INV-${year}-${String(count).padStart(3,"0")}`,issueDate:now.slice(0,10),dueDate:new Date(Date.now()+14*86400000).toISOString().slice(0,10),notes:`Created from quote ${quote.number}${quote.notes?`\n${quote.notes}`:""}`,createdAt:now,updatedAt:now}
}
