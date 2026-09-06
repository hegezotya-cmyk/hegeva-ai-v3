export type AutopilotCustomer={id:string;title?:string;customerStatus?:"lead"|"active"|"paused";followUp?:string}
export type AutopilotTask={id:string;title?:string;due?:string;done?:boolean;priority?:"low"|"medium"|"high";sourceId?:string}
export type AutopilotInvoice={id:string;type?:"invoice"|"quote";status?:"draft"|"sent"|"paid";number?:string;clientName?:string;dueDate?:string;currency?:string;vatRate?:number;items?:{quantity?:number;unitPrice?:number}[]}
export type AutopilotSignalKind="overdue-invoice"|"neglected-lead"|"stale-quote"|"overdue-task"|"invoice-draft"|"clear"
export type AutopilotSignal={id:string;kind:AutopilotSignalKind;severity:"critical"|"attention"|"ready";count:number;amount?:number;currency?:string;sourceIds:string[];href:string}
export type AutopilotActionStatus="prepared"|"approved"|"completed"|"cancelled"
export type AutopilotAction={id:string;signalId:string;kind:AutopilotSignalKind;status:AutopilotActionStatus;title:string;sourceIds:string[];createdAt:string;approvedAt?:string;completedAt?:string}
export type AutopilotAuditEvent={id:string;actionId:string;event:"prepared"|"approved"|"completed"|"cancelled";occurredAt:string;summary:string}
export type AutopilotPolicy={id:"workspace-policy";mode:"suggest"|"prepare"|"ask-execute";dailyLimit:number;allowedKinds:AutopilotSignalKind[];ownerApprovalRequired:true;updatedAt:string}
export type IntegrationLoadInput={provider:"google"|"microsoft";available:boolean;unreadInbox:number|null;upcomingSevenDays:number|null;upcomingCapped:boolean}
export type IntegrationLoadSignal={id:string;provider:"google"|"microsoft";kind:"inbox-load"|"calendar-load";severity:"critical"|"attention";count:number;capped:boolean;href:string}
export const DEFAULT_AUTOPILOT_POLICY:AutopilotPolicy={id:"workspace-policy",mode:"suggest",dailyLimit:3,allowedKinds:["overdue-invoice","neglected-lead","stale-quote","overdue-task","invoice-draft"],ownerApprovalRequired:true,updatedAt:""}
export function canPrepareAutopilot(signal:AutopilotSignal,actions:AutopilotAction[],policy:AutopilotPolicy,today:string){if(signal.kind==="clear"||!policy.allowedKinds.includes(signal.kind))return false;const used=actions.filter(x=>x.createdAt.slice(0,10)===today).length;return used<Math.min(10,Math.max(1,policy.dailyLimit))&&!actions.some(x=>x.signalId===signal.id&&(x.status==="prepared"||x.status==="approved"))}

const total=(doc:AutopilotInvoice)=>(doc.items||[]).reduce((sum,item)=>sum+(Number(item.quantity)||0)*(Number(item.unitPrice)||0),0)*(1+(Number(doc.vatRate)||0)/100)

export function analyseAutopilotWorkspace(input:{customers:AutopilotCustomer[];tasks:AutopilotTask[];invoices:AutopilotInvoice[];today:string}):AutopilotSignal[]{
 const {customers,tasks,invoices,today}=input
 const overdueInvoices=invoices.filter(item=>item.type==="invoice"&&item.status!=="paid"&&Boolean(item.dueDate)&&item.dueDate!<today)
 const neglectedLeads=customers.filter(item=>item.customerStatus==="lead"&&Boolean(item.followUp)&&item.followUp!<=today)
 const staleQuotes=invoices.filter(item=>item.type==="quote"&&item.status!=="paid"&&Boolean(item.dueDate)&&item.dueDate!<today)
 const overdueTasks=tasks.filter(item=>!item.done&&Boolean(item.due)&&item.due!<today)
 const invoiceDrafts=invoices.filter(item=>item.type==="invoice"&&item.status==="draft")
 const groups:AutopilotSignal[]=[
  {id:"overdue-invoice",kind:"overdue-invoice",severity:"critical",count:overdueInvoices.length,amount:overdueInvoices.filter(item=>(item.currency||"GBP")==="GBP").reduce((sum,item)=>sum+total(item),0),currency:"GBP",sourceIds:overdueInvoices.map(item=>item.id),href:"/business/intelligence#customer-follow-up"},
  {id:"neglected-lead",kind:"neglected-lead",severity:"attention",count:neglectedLeads.length,sourceIds:neglectedLeads.map(item=>item.id),href:"/business/customers"},
  {id:"stale-quote",kind:"stale-quote",severity:"attention",count:staleQuotes.length,amount:staleQuotes.filter(item=>(item.currency||"GBP")==="GBP").reduce((sum,item)=>sum+total(item),0),currency:"GBP",sourceIds:staleQuotes.map(item=>item.id),href:"/business/intelligence#customer-follow-up"},
  {id:"overdue-task",kind:"overdue-task",severity:"attention",count:overdueTasks.length,sourceIds:overdueTasks.map(item=>item.id),href:"/business/planner"},
  {id:"invoice-draft",kind:"invoice-draft",severity:"ready",count:invoiceDrafts.length,sourceIds:invoiceDrafts.map(item=>item.id),href:"/business/invoices"},
 ]
 const active=groups.filter(signal=>signal.count>0)
 return active.length?active:[{id:"clear",kind:"clear",severity:"ready",count:0,sourceIds:[],href:"/business"}]
}

export function transitionAutopilotAction(action:AutopilotAction,next:"approve"|"complete"|"cancel",now:string):AutopilotAction{
 if(next==="approve"&&action.status==="prepared")return{...action,status:"approved",approvedAt:now}
 if(next==="complete"&&action.status==="approved")return{...action,status:"completed",completedAt:now}
 if(next==="cancel"&&(action.status==="prepared"||action.status==="approved"))return{...action,status:"cancelled"}
 return action
}

export function taskForAutopilotAction(action:AutopilotAction,today:string):AutopilotTask{
 return{id:`autopilot-task-${action.id}`,sourceId:`autopilot:${action.id}`,title:action.title,due:today,priority:"high",done:false}
}

export function analyseIntegrationLoad(items:IntegrationLoadInput[]):IntegrationLoadSignal[]{
 const signals:IntegrationLoadSignal[]=[]
 for(const item of items){
  if(!item.available)continue
  const unread=Math.max(0,Number(item.unreadInbox)||0),upcoming=Math.max(0,Number(item.upcomingSevenDays)||0)
  if(unread>=50)signals.push({id:`${item.provider}-inbox-load`,provider:item.provider,kind:"inbox-load",severity:unread>=100?"critical":"attention",count:unread,capped:false,href:"/business/integrations"})
  if(upcoming>=8)signals.push({id:`${item.provider}-calendar-load`,provider:item.provider,kind:"calendar-load",severity:"attention",count:upcoming,capped:item.upcomingCapped,href:"/business/planner"})
 }
 return signals.sort((a,b)=>a.severity===b.severity?b.count-a.count:a.severity==="critical"?-1:1)
}

export function taskForIntegrationLoad(signal:IntegrationLoadSignal,title:string,today:string):AutopilotTask{
 return{id:`integration-task-${signal.id}-${today}`,sourceId:`integration-signal:${signal.id}:${today}`,title,due:today,priority:signal.severity==="critical"?"high":"medium",done:false}
}
