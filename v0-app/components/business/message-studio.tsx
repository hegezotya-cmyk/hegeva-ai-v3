"use client"

import { FormEvent, useEffect, useState } from "react"
import { Copy, Plus, Trash2 } from "lucide-react"

type Draft = {
  id: string
  type: string
  tone: string
  recipient?: string
  subject?: string
  body: string
  createdAt: string
}

const KEY = "hegeva:v0:messages"

export function MessageStudio() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [type, setType] = useState("Customer reply")
  const [tone, setTone] = useState("Professional")
  const [recipient, setRecipient] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setDrafts(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(drafts))
  }, [drafts])

  function saveDraft(e: FormEvent) {
    e.preventDefault()
    const clean = body.trim()
    if (!clean) return
    setDrafts((current) => [
      {
        id: crypto.randomUUID(),
        type,
        tone,
        recipient: recipient.trim() || undefined,
        subject: subject.trim() || undefined,
        body: clean,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    setRecipient("")
    setSubject("")
    setBody("")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={saveDraft} className="glass-panel h-fit rounded-2xl p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Plus className="size-4 text-primary" /> New draft</div>
        <div className="mt-5 space-y-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
            <option>Customer reply</option>
            <option>Follow-up</option>
            <option>Payment reminder</option>
            <option>Sales message</option>
            <option>Support response</option>
            <option>Business email</option>
          </select>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
            <option>Professional</option>
            <option>Friendly</option>
            <option>Short</option>
            <option>Formal</option>
          </select>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient (optional)" className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write or paste your draft message" rows={8} className="w-full resize-y rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <button type="submit" className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save draft</button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Saving a draft does not send it. No email or message integration is claimed as active in this version.</p>
      </form>

      <section>
        {drafts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <p className="font-medium text-foreground">No saved drafts yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Create a real draft when you need one. HEGEVA will not fabricate sent messages or customer activity.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <article key={draft.id} className="glass-panel rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{draft.type}</span><span>·</span><span>{draft.tone}</span></div>
                    {draft.subject && <h2 className="mt-2 font-semibold text-foreground">{draft.subject}</h2>}
                    {draft.recipient && <p className="mt-1 text-xs text-muted-foreground">To: {draft.recipient}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => navigator.clipboard?.writeText(draft.body)} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Copy draft"><Copy className="size-4" /></button>
                    <button type="button" onClick={() => setDrafts((all) => all.filter((x) => x.id !== draft.id))} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive" aria-label="Delete draft"><Trash2 className="size-4" /></button>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{draft.body}</p>
                <p className="mt-4 text-[11px] text-muted-foreground">Saved {new Date(draft.createdAt).toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
