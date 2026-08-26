"use client"

import { FormEvent, useState } from "react"
import { Cloud, CloudOff, Copy, Pencil, Plus, Trash2, X } from "lucide-react"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { useI18n } from "@/lib/i18n/provider"
import { getBusinessModulesCopy } from "@/lib/i18n/business-modules-copy"

type Draft = {
  id: string
  type: string
  tone: string
  recipient?: string
  subject?: string
  body: string
  createdAt: string
}

export function MessageStudio() {
  const { locale } = useI18n()
  const c = getBusinessModulesCopy(locale).messages
  const { items: drafts, setItems: setDrafts, syncState, syncError, cloudEnabled } = useWorkspaceData<Draft>("messages")
  const [type, setType] = useState("Customer reply")
  const [tone, setTone] = useState("Professional")
  const [recipient, setRecipient] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const editCopy = {
    en:{edit:"Edit draft",update:"Update draft",cancel:"Cancel"},hu:{edit:"Vázlat szerkesztése",update:"Vázlat frissítése",cancel:"Mégse"},de:{edit:"Entwurf bearbeiten",update:"Entwurf aktualisieren",cancel:"Abbrechen"},fr:{edit:"Modifier le brouillon",update:"Mettre à jour",cancel:"Annuler"},es:{edit:"Editar borrador",update:"Actualizar borrador",cancel:"Cancelar"},
  }[locale]

  function resetForm() {
    setRecipient("")
    setSubject("")
    setBody("")
    setEditingId(null)
  }

  function editDraft(draft: Draft) {
    setEditingId(draft.id)
    setType(draft.type)
    setTone(draft.tone)
    setRecipient(draft.recipient || "")
    setSubject(draft.subject || "")
    setBody(draft.body)
  }

  function saveDraft(e: FormEvent) {
    e.preventDefault()
    const clean = body.trim()
    if (!clean) return
    setDrafts((current) => {
      const existing = editingId ? current.find((draft) => draft.id === editingId) : undefined
      const next: Draft = {
        id: existing?.id || crypto.randomUUID(),
        type,
        tone,
        recipient: recipient.trim() || undefined,
        subject: subject.trim() || undefined,
        body: clean,
        createdAt: existing?.createdAt || new Date().toISOString(),
      }
      return existing ? current.map((draft) => draft.id === existing.id ? next : draft) : [next, ...current]
    })
    resetForm()
  }

  return (
    <div>
      <div className="glass-panel mb-6 flex items-start gap-3 rounded-2xl p-4">
        {cloudEnabled && syncState !== "error" ? <Cloud className="mt-0.5 size-4 text-primary" /> : <CloudOff className="mt-0.5 size-4 text-muted-foreground" />}
        <div>
          <p className="text-sm font-medium text-foreground">{syncState === "saving" ? c.saving : syncState === "cloud" ? c.synced : cloudEnabled ? c.checking : c.browser}</p>
          <p className="mt-1 text-xs text-muted-foreground">{syncError ? c.errorBody : cloudEnabled ? c.cloudBody : c.guestBody}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={saveDraft} className="glass-panel h-fit rounded-2xl p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">{editingId ? <Pencil className="size-4 text-primary" /> : <Plus className="size-4 text-primary" />} {editingId ? editCopy.edit : c.newDraft}</div>
        <div className="mt-5 space-y-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
            {c.types.map((option, index) => <option key={option} value={["Customer reply", "Follow-up", "Payment reminder", "Sales message", "Support response", "Business email"][index]}>{option}</option>)}
          </select>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
            {c.tones.map((option, index) => <option key={option} value={["Professional", "Friendly", "Short", "Formal"][index]}>{option}</option>)}
          </select>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={c.recipient} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={c.subject} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={c.body} rows={8} className="w-full resize-y rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <div className="flex gap-2"><button type="submit" className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{editingId ? editCopy.update : c.save}</button>{editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2.5 text-sm"><X className="size-4" /> {editCopy.cancel}</button>}</div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{c.honesty}</p>
      </form>

      <section>
        {drafts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <p className="font-medium text-foreground">{c.empty}</p>
            <p className="mt-2 text-sm text-muted-foreground">{c.emptyBody}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <article key={draft.id} className="glass-panel rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{draft.type}</span><span>·</span><span>{draft.tone}</span></div>
                    {draft.subject && <h2 className="mt-2 font-semibold text-foreground">{draft.subject}</h2>}
                    {draft.recipient && <p className="mt-1 text-xs text-muted-foreground">{c.to}: {draft.recipient}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => navigator.clipboard?.writeText(draft.body)} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" aria-label={c.copy}><Copy className="size-4" /></button>
                    <button type="button" onClick={() => editDraft(draft)} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary" aria-label={editCopy.edit}><Pencil className="size-4" /></button>
                    <button type="button" onClick={() => { setDrafts((all) => all.filter((x) => x.id !== draft.id)); if (editingId === draft.id) resetForm() }} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive" aria-label={c.delete}><Trash2 className="size-4" /></button>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{draft.body}</p>
                <p className="mt-4 text-[11px] text-muted-foreground">{c.saved} {new Date(draft.createdAt).toLocaleString(locale)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  )
}
