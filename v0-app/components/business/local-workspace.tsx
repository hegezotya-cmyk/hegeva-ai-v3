"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"

type Kind = "customers" | "documents" | "expenses"
type RecordItem = { id: string; title: string; meta?: string; amount?: number; notes?: string; createdAt: string }

const config: Record<Kind, { title: string; singular: string; subtitle: string; placeholder: string }> = {
  customers: {
    title: "Customers & CRM",
    singular: "customer",
    subtitle: "Save real customer records in this browser. No demo customers are invented.",
    placeholder: "Customer or company name",
  },
  documents: {
    title: "Documents",
    singular: "document",
    subtitle: "Create and save lightweight document records locally while the cloud document backend is prepared.",
    placeholder: "Document title",
  },
  expenses: {
    title: "Expenses",
    singular: "expense",
    subtitle: "Track real expense entries saved in this browser. Totals are calculated only from your entries.",
    placeholder: "Supplier or expense name",
  },
}

function storageKey(kind: Kind) {
  return `hegeva:v0:${kind}`
}

export function LocalWorkspace({ kind }: { kind: Kind }) {
  const cfg = config[kind]
  const [items, setItems] = useState<RecordItem[]>([])
  const [title, setTitle] = useState("")
  const [meta, setMeta] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(kind))
      if (raw) setItems(JSON.parse(raw))
    } catch {
      setItems([])
    }
  }, [kind])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(kind), JSON.stringify(items))
    } catch {}
  }, [items, kind])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => `${item.title} ${item.meta ?? ""} ${item.notes ?? ""}`.toLowerCase().includes(q))
  }, [items, query])

  const total = useMemo(() => items.reduce((sum, item) => sum + (item.amount || 0), 0), [items])

  function addItem(e: FormEvent) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) return
    setItems((current) => [
      {
        id: crypto.randomUUID(),
        title: clean,
        meta: meta.trim() || undefined,
        amount: kind === "expenses" && amount ? Number(amount) : undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    setTitle("")
    setMeta("")
    setAmount("")
    setNotes("")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">HEGEVA Business Workspace</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{cfg.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{cfg.subtitle}</p>
        </div>
        <StatusBadge status="working" />
      </div>

      {kind === "expenses" && (
        <div className="glass-panel mt-8 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Saved expense total</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">£{total.toFixed(2)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Calculated only from entries saved below.</p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={addItem} className="glass-panel h-fit rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Plus className="size-4 text-primary" /> Add {cfg.singular}</div>
          <div className="mt-5 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={cfg.placeholder} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
            <input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder={kind === "customers" ? "Email / phone / status" : kind === "documents" ? "Type / customer / reference" : "Category / date / reference"} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
            {kind === "expenses" && <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (£)" className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={4} className="w-full resize-none rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          </div>
          <Button type="submit" className="mt-4 w-full">Save {cfg.singular}</Button>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">This version stores data in this browser only. Cloud sync will be connected later and will not be claimed as active until verified.</p>
        </form>

        <section>
          <div className="glass-panel flex items-center gap-2 rounded-xl px-3 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${cfg.title.toLowerCase()}`} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          </div>

          <div className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center">
                <p className="font-medium text-foreground">No saved {kind} yet</p>
                <p className="mt-2 text-sm text-muted-foreground">Add your first real record. HEGEVA will not create fake examples and count them as business data.</p>
              </div>
            ) : filtered.map((item) => (
              <article key={item.id} className="glass-panel flex items-start justify-between gap-4 rounded-2xl p-5">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">{item.title}</h2>
                  {item.meta && <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p>}
                  {typeof item.amount === "number" && <p className="mt-2 text-lg font-semibold text-primary">£{item.amount.toFixed(2)}</p>}
                  {item.notes && <p className="mt-2 text-sm leading-relaxed text-foreground/75">{item.notes}</p>}
                  <p className="mt-3 text-[11px] text-muted-foreground">Saved {new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <button type="button" onClick={() => setItems((current) => current.filter((x) => x.id !== item.id))} className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive" aria-label={`Delete ${item.title}`}><Trash2 className="size-4" /></button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
