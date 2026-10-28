export type OverviewDocument = { id:string; type:string; status?:string; number?:string; sourceId?:string; sourceQuoteId?:string; notes?:string }
export type OverviewTask = { id:string; title?:string; due?:string; done?:boolean; sourceId?:string }
export type OverviewMessage = { id:string; sourceId?:string; followUpAt?:string; workflowStatus?:string; approvalState?:string; deliveryStatus?:string }
export type PostQuoteOverview = { tasks:OverviewTask[]; invoices:OverviewDocument[]; legacyInvoices:OverviewDocument[]; followups:OverviewMessage[]; nextFollowup:OverviewMessage|null }

const nonempty = (value:unknown):value is string => typeof value === "string" && value.trim().length > 0
const compare = (a:string,b:string) => a < b ? -1 : a > b ? 1 : 0
const rows = <T extends {id:string}>(values:T[]):T[] => Array.isArray(values) ? values.filter(x=>x && typeof x === "object" && nonempty(x.id)) : []

export function isOverviewDay(value:unknown):value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year,month,day] = value.split("-").map(Number)
  if (year < 1) return false
  const date = new Date(0)
  date.setUTCFullYear(year,month-1,day)
  return date.getUTCFullYear() === year && date.getUTCMonth() === month-1 && date.getUTCDate() === day
}

function byDate<T extends {id:string}>(items:T[], getDate:(item:T)=>unknown):T[] {
  return items.sort((a,b)=> {
    const left = getDate(a), right = getDate(b)
    return compare(isOverviewDay(left) ? left : "~", isOverviewDay(right) ? right : "~") || compare(a.id,b.id)
  })
}

function isPendingFollowup(message:OverviewMessage):boolean {
  const pendingWorkflow = ["draft","approved","ready-to-execute"]
  const pendingApproval = ["awaiting-approval","approved","ready-to-execute"]
  if (message.deliveryStatus !== undefined && message.deliveryStatus !== "not-sent") return false
  if (message.approvalState !== undefined && !pendingApproval.includes(message.approvalState)) return false
  return message.workflowStatus === undefined
    ? message.approvalState !== undefined && pendingApproval.includes(message.approvalState)
    : pendingWorkflow.includes(message.workflowStatus)
}

export function selectPostQuoteOverview({quoteId,documents,tasks,messages,today}:{quoteId:string;documents:OverviewDocument[];tasks:OverviewTask[];messages:OverviewMessage[];today:string}):PostQuoteOverview|null {
  const docs = rows(documents)
  const matches = docs.filter(doc=>doc.id === quoteId && doc.type === "quote")
  if (matches.length !== 1) return null
  const quote = matches[0]
  if (quote.status !== "accepted" && quote.status !== "invoiced") return null
  const run = typeof quote.sourceId === "string" ? /^one-click:([A-Za-z0-9_-]+):quote$/.exec(quote.sourceId)?.[1] : undefined
  const linkedTasks = rows(tasks).filter(task=>task.sourceId === quote.id || (run !== undefined && task.sourceId === `one-click:${run}:task`))
  const followups = byDate(rows(messages).filter(message=>message.sourceId === quote.id),item=>item.followUpAt)
  const invoices:OverviewDocument[] = [], legacyInvoices:OverviewDocument[] = []
  const legacyNumber = nonempty(quote.number) && !/[\r\n]/.test(quote.number) && docs.filter(doc=>doc.type === "quote" && doc.number === quote.number).length === 1
  for (const invoice of docs.filter(doc=>doc.type === "invoice")) {
    if (invoice.sourceQuoteId !== undefined) {
      if (invoice.sourceQuoteId === quote.id) invoices.push(invoice)
      continue
    }
    if (run !== undefined && invoice.sourceId === quote.sourceId) {
      invoices.push(invoice)
      continue
    }
    if (invoice.sourceId !== undefined && invoice.sourceId !== "") continue
    if (legacyNumber && typeof invoice.notes === "string" && invoice.notes.split(/\r?\n/)[0] === `Created from quote ${quote.number}`) legacyInvoices.push(invoice)
  }
  return {
    tasks:byDate(linkedTasks,item=>item.due),
    invoices:invoices.sort((a,b)=>compare(a.id,b.id)),
    legacyInvoices:legacyInvoices.sort((a,b)=>compare(a.id,b.id)),
    followups,
    // ISO calendar-day ordering selects the earliest overdue/due record, otherwise the nearest future record.
    nextFollowup:isOverviewDay(today) ? followups.find(message=>isPendingFollowup(message) && isOverviewDay(message.followUpAt)) || null : null,
  }
}
