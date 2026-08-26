"use client"

import { FormEvent, useState } from "react"
import { Cloud, CloudOff, Copy, Mail, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { useI18n } from "@/lib/i18n/provider"
import { getBusinessModulesCopy } from "@/lib/i18n/business-modules-copy"

type Draft = { id: string; type: string; tone: string; recipient?: string; subject?: string; body: string; createdAt: string }

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
  const editCopy = { en:{edit:"Edit draft",update:"Update draft",cancel:"Cancel"},hu:{edit:"Vázlat szerkesztése",update:"Vázlat frissítése",cancel:"Mégse"},de:{edit:"Entwurf bearbeiten",update:"Entwurf aktualisieren",cancel:"Abbrechen"},fr:{edit:"Modifier le brouillon",update:"Mettre à jour",cancel:"Annuler"},es:{edit:"Editar borrador",update:"Actualizar borrador",cancel:"Cancelar"} }[locale]

  function resetForm() { setRecipient(""); setSubject(""); setBody(""); setEditingId(null) }
  function editDraft(draft: Draft) { setEditingId(draft.id); setType(draft.type); setTone(draft.tone); setRecipient(draft.recipient || ""); setSubject(draft.subject || ""); setBody(draft.body) }
  function saveDraft(e: FormEvent) {
    e.preventDefault(); const clean = body.trim(); if (!clean) return
    setDrafts((current) => {
      const existing = editingId ? current.find((draft) => draft.id === editingId) : undefined
      const next: Draft = { id: existing?.id || crypto.randomUUID(), type, tone, recipient: recipient.trim() || undefined, subject: subject.trim() || undefined, body: clean, createdAt: existing?.createdAt || new Date().toISOString() }
      return existing ? current.map((draft) => draft.id === existing.id ? next : draft) : [next, ...current]
    }); resetForm()
  }

  const fieldClass = "w-full rounded-2xl border border-white/10 bg-background/35 px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-cyan/45 focus:bg-background/55 focus:ring-2 focus:ring-cyan/10"

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-cyan/8 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-64 w-64 rounded-full bg-violet/8 blur-3xl" />

      <div className="glass-panel relative mb-6 flex items-start gap-3 overflow-hidden rounded-3xl border-white/10 p-4 shadow-[0_20px_70px_-55px_rgba(34,211,238,.7)]">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-cyan/20 bg-cyan/10 text-cyan">
          {cloudEnabled && syncState !== "error" ? <Cloud className="size-4" /> : <CloudOff className="size-4" />}
        </span>
        <div><p className="text-sm font-semibold text-foreground">{syncState === "saving" ? c.saving : syncState === "cloud" ? c.synced : cloudEnabled ? c.checking : c.browser}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{syncError ? c.errorBody : cloudEnabled ? c.cloudBody : c.guestBody}</p></div>
      </div>

      <div className="relative grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={saveDraft} className="glass-panel h-fit overflow-hidden rounded-3xl border-white/10 p-5 shadow-[0_26px_80px_-60px_rgba(139,92,246,.8)]">
          <div className="mb-5 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl border border-violet/25 bg-violet/10 text-violet"><Sparkles className="size-5" /></span><div><p className="text-sm font-semibold text-foreground">{editingId ? editCopy.edit : c.newDraft}</p><p className="mt-0.5 text-xs text-muted-foreground">HEGEVA Message Studio</p></div></div>
          <div className="space-y-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className={fieldClass}>{c.types.map((option, index) => <option key={option} value={["Customer reply", "Follow-up", "Payment reminder", "Sales message", "Support response", "Business email"][index]}>{option}</option>)}</select>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className={fieldClass}>{c.tones.map((option, index) => <option key={option} value={["Professional", "Friendly", "Short", "Formal"][index]}>{option}</option>)}</select>
            <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={c.recipient} className={fieldClass} />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={c.subject} className={fieldClass} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={c.body} rows={8} className={`${fieldClass} resize-y`} />
            <div className="flex gap-2"><button type="submit" className="flex-1 rounded-2xl border border-primary/25 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_34px_-18px_rgba(16,185,129,.9)] transition hover:-translate-y-0.5 hover:bg-primary/90">{editingId ? editCopy.update : c.save}</button>{editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-background/35 px-3 py-2.5 text-sm"><X className="size-4" /> {editCopy.cancel}</button>}</div>
          </div>
          <p className="mt-4 border-t border-white/8 pt-4 text-xs leading-relaxed text-muted-foreground">{c.honesty}</p>
        </form>

        <section>
          {drafts.length === 0 ? (
            <div className="glass-panel relative overflow-hidden rounded-3xl border-white/10 p-10 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan/20 bg-cyan/10 text-cyan"><Mail className="size-6" /></div><p className="mt-5 font-semibold text-foreground">{c.empty}</p><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{c.emptyBody}</p></div>
          ) : (
            <div className="space-y-4">{drafts.map((draft) => (
              <article key={draft.id} className="glass-panel group relative overflow-hidden rounded-3xl border-white/10 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-cyan/25 hover:shadow-[0_22px_70px_-55px_rgba(34,211,238,.8)]">
                <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-cyan/7 blur-3xl" />
                <div className="relative flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[.12em] text-cyan/80"><span>{draft.type}</span><span className="text-muted-foreground">·</span><span className="text-violet/80">{draft.tone}</span></div>{draft.subject && <h2 className="mt-2 font-semibold text-foreground">{draft.subject}</h2>}{draft.recipient && <p className="mt-1 text-xs text-muted-foreground">{c.to}: {draft.recipient}</p>}</div><div className="flex gap-2"><button type="button" onClick={() => navigator.clipboard?.writeText(draft.body)} className="rounded-xl border border-white/10 bg-background/35 p-2 text-muted-foreground transition hover:border-cyan/30 hover:text-cyan" aria-label={c.copy}><Copy className="size-4" /></button><button type="button" onClick={() => editDraft(draft)} className="rounded-xl border border-white/10 bg-background/35 p-2 text-muted-foreground transition hover:border-primary/30 hover:text-primary" aria-label={editCopy.edit}><Pencil className="size-4" /></button><button type="button" onClick={() => { setDrafts((all) => all.filter((x) => x.id !== draft.id)); if (editingId === draft.id) resetForm() }} className="rounded-xl border border-white/10 bg-background/35 p-2 text-muted-foreground transition hover:border-destructive/35 hover:text-destructive" aria-label={c.delete}><Trash2 className="size-4" /></button></div></div>
                <p className="relative mt-4 whitespace-pre-wrap rounded-2xl border border-white/8 bg-background/25 p-4 text-sm leading-relaxed text-foreground/80">{draft.body}</p><p className="relative mt-4 text-[11px] text-muted-foreground">{c.saved} {new Date(draft.createdAt).toLocaleString(locale)}</p>
              </article>
            ))}</div>
          )}
        </section>
      </div>
    </div>
  )
}
