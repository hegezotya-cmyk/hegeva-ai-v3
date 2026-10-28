"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { useWorkspaceData, type WorkspaceSyncState } from "@/lib/use-workspace-data"
import { useI18n } from "@/lib/i18n/provider"
import { postquoteOverviewCopy } from "@/lib/i18n/postquote-overview-copy"
import { localCalendarDay } from "@/lib/customer-reengagement"
import { isOverviewDay, selectPostQuoteOverview, type OverviewDocument, type OverviewMessage, type OverviewTask } from "@/lib/postquote-overview"

export function PostquoteOverview({quoteId,documents,documentSyncState,identity,onClose}:{quoteId:string;documents:OverviewDocument[];documentSyncState:WorkspaceSyncState;identity:string|null;onClose:()=>void}) {
  const {locale} = useI18n()
  const c = postquoteOverviewCopy[locale]
  const taskData = useWorkspaceData<OverviewTask>("planner")
  const messageData = useWorkspaceData<OverviewMessage>("messages")
  const [today,setToday] = useState(()=>localCalendarDay(new Date()))
  const titleId = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(()=>{
    heading.current?.focus()
    const refresh = ()=>setToday(localCalendarDay(new Date()))
    const timer = window.setInterval(refresh,30000)
    window.addEventListener("focus",refresh)
    return ()=>{window.clearInterval(timer);window.removeEventListener("focus",refresh)}
  },[])
  if (taskData.workspaceIdentity !== identity || messageData.workspaceIdentity !== identity) return null
  const result = selectPostQuoteOverview({quoteId,documents,tasks:taskData.items,messages:messageData.items,today})
  if (!result) return null
  const quote = documents.find(doc=>doc.id === quoteId)
  const statusNote = (state:WorkspaceSyncState) => state === "checking" || state === "saving" ? c.loading : state === "error" ? c.error : state === "local" ? c.local : ""
  const ready = (state:WorkspaceSyncState) => state !== "checking" && state !== "saving"
  const empty = (state:WorkspaceSyncState) => state === "cloud" ? c.empty : c.localEmpty
  const date = (value:unknown) => isOverviewDay(value) ? value : c.unknown
  const text = (value:unknown,fallback:string) => typeof value === "string" && value.trim() ? value : fallback
  const sectionClass = "min-w-0 rounded-2xl border border-border p-4"
  const invoiceStatus = (status?:string) => status === "paid" ? c.paid : status === "draft" ? c.draft : status === "sent" ? c.sent : c.unknown
  const messageStatus = (status?:string) => status === "draft" ? c.draft : status === "approved" ? c.approved : status === "completed" ? c.completed : c.unknown
  return <section aria-labelledby={titleId} className="glass-panel mt-6 min-w-0 rounded-3xl border border-primary/25 p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h2 id={titleId} tabIndex={-1} ref={heading} className="text-xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary">{c.title}</h2><p className="mt-1 break-words text-sm text-primary">{text(quote?.number,c.unknown)}</p></div>
      <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border px-3 text-sm">{c.close}</button>
    </div>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{c.readonly}</p>
    <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
      <section aria-label={c.tasks} className={sectionClass}><h3 className="font-semibold">{c.tasks}</h3><p role="status" className="mt-2 text-xs text-muted-foreground">{statusNote(taskData.syncState)}</p>
        {ready(taskData.syncState) && <>{result.tasks.length ? <ul className="mt-3 space-y-3">{result.tasks.map(task=><li key={task.id} className="break-words text-sm"><p>{text(task.title,c.tasks)}</p><p className="mt-1 text-xs text-muted-foreground">{task.done === true ? c.doneTask : task.done === false ? c.openTask : c.unknown} · {date(task.due)}</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{empty(taskData.syncState)}</p>}</>}
        <Link href="/business/planner" className="mt-3 inline-flex min-h-11 items-center text-sm text-primary">{c.openPlanner}</Link>
      </section>
      <section aria-label={c.invoices} className={sectionClass}><h3 className="font-semibold">{c.invoices}</h3><p role="status" className="mt-2 text-xs text-muted-foreground">{statusNote(documentSyncState)}</p>
        {ready(documentSyncState) && (result.invoices.length ? <ul className="mt-3 space-y-3">{result.invoices.map(invoice=><li key={invoice.id} className="break-words text-sm"><p>{text(invoice.number,c.invoices)}</p><p className="text-xs text-muted-foreground">{invoiceStatus(invoice.status)}</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{empty(documentSyncState)}</p>)}
        <Link href="/business/invoices" className="mt-3 inline-flex min-h-11 items-center text-sm text-primary">{c.openInvoices}</Link>
      </section>
      <section aria-label={c.followups} className={sectionClass}><h3 className="font-semibold">{c.followups}</h3><p role="status" className="mt-2 text-xs text-muted-foreground">{statusNote(messageData.syncState)}</p>
        {ready(messageData.syncState) && <><p className="mt-3 text-sm">{c.next}: {date(result.nextFollowup?.followUpAt)}</p>{result.followups.length ? <ul className="mt-3 space-y-2">{result.followups.map(message=><li key={message.id} className="text-sm"><span>{messageStatus(message.workflowStatus)}</span><span className="text-muted-foreground"> · {date(message.followUpAt)}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{empty(messageData.syncState)}</p>}</>}
        <Link href="/business/messages" className="mt-3 inline-flex min-h-11 items-center text-sm text-primary">{c.openMessages}</Link>
      </section>
      {ready(documentSyncState) && result.legacyInvoices.length > 0 && <section aria-label={c.legacy} className={`${sectionClass} border-amber-400/30`}><h3 className="font-semibold">{c.legacy}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{c.legacyNote}</p><ul className="mt-3 space-y-2">{result.legacyInvoices.map(invoice=><li key={invoice.id} className="break-words text-sm">{text(invoice.number,c.invoices)}</li>)}</ul></section>}
    </div>
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{c.deliveryNote}</p>
  </section>
}
