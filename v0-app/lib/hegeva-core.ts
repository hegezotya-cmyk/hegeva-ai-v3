export type HegevaCorePriorityKind = "complete-followups"|"review-followups"|"overdue-invoices"|"customer-followups"|"stale-quotes"|"overdue-tasks"|"today-tasks"|"draft-invoices"|"clear"|"start"
export type HegevaCoreSignals = {approvedFollowUps:number;followUpsAwaitingApproval:number;overdueInvoices:number;customerFollowUpsDue?:number;staleQuotes?:number;overdueTasks:number;tasksToday:number;draftInvoices?:number;hasRecords:boolean}
export type HegevaCorePriority = {kind:HegevaCorePriorityKind;count:number;href:string;severity:"attention"|"ready"}

const safeCount=(value:number|undefined)=>Number.isFinite(value)?Math.max(0,Math.floor(value!)):0

export function rankHegevaCorePriorities(signals:HegevaCoreSignals):HegevaCorePriority[]{
 const candidates:HegevaCorePriority[]=[
  {kind:"complete-followups",count:safeCount(signals.approvedFollowUps),href:"/business/messages",severity:"attention"},
  {kind:"review-followups",count:safeCount(signals.followUpsAwaitingApproval),href:"/business/messages",severity:"attention"},
  {kind:"overdue-invoices",count:safeCount(signals.overdueInvoices),href:"/business/intelligence#customer-follow-up",severity:"attention"},
  {kind:"customer-followups",count:safeCount(signals.customerFollowUpsDue),href:"/business/customers",severity:"attention"},
  {kind:"stale-quotes",count:safeCount(signals.staleQuotes),href:"/business/intelligence#customer-follow-up",severity:"attention"},
  {kind:"overdue-tasks",count:safeCount(signals.overdueTasks),href:"/business/planner",severity:"attention"},
  {kind:"today-tasks",count:safeCount(signals.tasksToday),href:"/business/planner",severity:"attention"},
  {kind:"draft-invoices",count:safeCount(signals.draftInvoices),href:"/business/invoices",severity:"ready"},
 ]
 const ranked=candidates.filter(item=>item.count>0)
 return ranked.length?ranked:[signals.hasRecords?{kind:"clear",count:0,href:"/business",severity:"ready"}:{kind:"start",count:0,href:"/business/customers",severity:"ready"}]
}

export function selectHegevaCorePriority(signals:HegevaCoreSignals):HegevaCorePriority{
 return rankHegevaCorePriorities(signals)[0]
}
