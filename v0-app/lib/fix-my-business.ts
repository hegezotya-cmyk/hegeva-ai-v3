export type FixSignal={kind:"cash"|"leads"|"operations"|"foundation"|"clear";severity:"critical"|"attention"|"ready";count:number;amount?:number;sourceIds:string[];actionKey:string}
export type FixInput={today:string;customers:{id:string;customerStatus?:string;followUp?:string}[];tasks:{id:string;done?:boolean;due?:string}[];invoices:{id:string;type?:string;status?:string;dueDate?:string;currency?:string;vatRate?:number;items?:{quantity?:number;unitPrice?:number}[]}[]}
const total=(invoice:FixInput["invoices"][number])=>(invoice.items||[]).reduce((sum,line)=>sum+(Number(line.quantity)||0)*(Number(line.unitPrice)||0),0)*(1+(Number(invoice.vatRate)||0)/100)
export function diagnoseBusiness(input:FixInput):FixSignal[]{
 const overdueInvoices=input.invoices.filter(x=>x.type==="invoice"&&x.status!=="paid"&&Boolean(x.dueDate)&&x.dueDate!<input.today)
 const neglectedLeads=input.customers.filter(x=>x.customerStatus==="lead"&&Boolean(x.followUp)&&x.followUp!<input.today)
 const overdueTasks=input.tasks.filter(x=>!x.done&&Boolean(x.due)&&x.due!<input.today)
 const signals:FixSignal[]=[]
 if(overdueInvoices.length)signals.push({kind:"cash",severity:"critical",count:overdueInvoices.length,amount:overdueInvoices.filter(x=>(x.currency||"GBP")==="GBP").reduce((sum,x)=>sum+total(x),0),sourceIds:overdueInvoices.map(x=>x.id),actionKey:"recoverCash"})
 if(neglectedLeads.length)signals.push({kind:"leads",severity:"attention",count:neglectedLeads.length,sourceIds:neglectedLeads.map(x=>x.id),actionKey:"followLeads"})
 if(overdueTasks.length)signals.push({kind:"operations",severity:"attention",count:overdueTasks.length,sourceIds:overdueTasks.map(x=>x.id),actionKey:"clearTasks"})
 if(!input.customers.length&&!input.invoices.length&&!input.tasks.length)signals.push({kind:"foundation",severity:"ready",count:0,sourceIds:[],actionKey:"buildFoundation"})
 if(!signals.length)signals.push({kind:"clear",severity:"ready",count:0,sourceIds:[],actionKey:"reviewGrowth"})
 return signals.slice(0,3)
}
export function fixTaskId(runId:string,kind:FixSignal["kind"]){return `fix:${runId}:${kind}`}
