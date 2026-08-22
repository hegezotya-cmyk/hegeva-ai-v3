"use client"

import { useCallback, useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n/provider"
import { LEADS_COPY } from "@/lib/i18n/leads-copy"

type Lead = { id:string; name:string; email:string; company:string|null; message:string; locale:string; status:"new"|"read"|"closed"; createdAt:string }

export default function ContactLeadsPage() {
  const { locale } = useI18n()
  const c = LEADS_COPY[locale]
  const [leads, setLeads] = useState<Lead[]>([])
  const [state, setState] = useState<"loading"|"ready"|"denied"|"error">("loading")
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState("loading")
    try {
      const response = await fetch("/api/admin/contact-leads", { credentials:"include", cache:"no-store" })
      if (response.status === 403) { setState("denied"); return }
      const data = await response.json().catch(() => null)
      if (!response.ok || !Array.isArray(data?.leads)) throw new Error("leads")
      setLeads(data.leads)
      setState("ready")
    } catch { setState("error") }
  }, [])

  useEffect(() => { void load() }, [load])

  async function update(id:string, status:Lead["status"]) {
    setUpdating(id)
    try {
      const response = await fetch("/api/admin/contact-leads", {
        method:"PATCH", credentials:"include", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id,status}),
      })
      if (!response.ok) throw new Error("update")
      setLeads((current) => current.map((lead) => lead.id === id ? {...lead,status} : lead))
    } catch { setState("error") }
    finally { setUpdating(null) }
  }

  const statusLabel = (status:Lead["status"]) => status === "new" ? c.new : status === "read" ? c.read : c.closed

  return <AppShell>
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}/>
        <button type="button" onClick={() => void load()} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary">{c.refresh}</button>
      </div>
      {state === "loading" && <div className="glass-panel mt-8 rounded-3xl p-8 text-sm text-muted-foreground">{c.checking}</div>}
      {state === "denied" && <div className="glass-panel mt-8 rounded-3xl p-8"><h2 className="text-xl font-semibold">{c.deniedTitle}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{c.deniedBody}</p></div>}
      {state === "error" && <div role="alert" className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{c.error}</div>}
      {state === "ready" && leads.length === 0 && <div className="glass-panel mt-8 rounded-3xl p-8 text-sm text-muted-foreground">{c.empty}</div>}
      {state === "ready" && leads.length > 0 && <div className="mt-8 space-y-4">
        {leads.map((lead) => <article key={lead.id} className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-semibold">{lead.name}</h2><a href={`mailto:${lead.email}`} className="mt-1 block break-all text-sm text-primary hover:underline">{lead.email}</a>{lead.company && <p className="mt-1 text-sm text-muted-foreground">{c.company}: {lead.company}</p>}</div>
            <span className={lead.status === "new" ? "rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary" : "rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground"}>{statusLabel(lead.status)}</span>
          </div>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-foreground">{lead.message}</p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">{c.received}: {new Date(lead.createdAt).toLocaleString(locale)}</p>
            <div className="flex flex-wrap gap-2">
              {lead.status === "new" && <button disabled={updating === lead.id} onClick={() => void update(lead.id,"read")} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50">{c.markRead}</button>}
              {lead.status !== "closed" ? <button disabled={updating === lead.id} onClick={() => void update(lead.id,"closed")} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50">{c.close}</button> : <button disabled={updating === lead.id} onClick={() => void update(lead.id,"read")} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50">{c.reopen}</button>}
            </div>
          </div>
        </article>)}
      </div>}
    </main>
  </AppShell>
}
