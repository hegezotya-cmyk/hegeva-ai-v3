"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { Cloud, CloudOff, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { useSession } from "@/lib/auth-client"

type Kind = "customers" | "documents" | "expenses"
type RecordItem = { id: string; title: string; meta?: string; amount?: number; notes?: string; createdAt: string }
type SyncState = "checking" | "cloud" | "local" | "saving" | "error"

const config: Record<Kind, { title: string; singular: string; subtitle: string; placeholder: string }> = {
  customers: {
    title: "Customers & CRM",
    singular: "customer",
    subtitle: "Manage real customer records. Signed-in accounts sync through the HEGEVA cloud workspace.",
    placeholder: "Customer or company name",
  },
  documents: {
    title: "Documents",
    singular: "document",
    subtitle: "Keep lightweight document records with authenticated cloud sync and a local browser fallback.",
    placeholder: "Document title",
  },
  expenses: {
    title: "Expenses",
    singular: "expense",
    subtitle: "Track real expense entries. Totals are calculated only from records you add.",
    placeholder: "Supplier or expense name",
  },
}

function storageKey(kind: Kind) {
  return `hegeva:v0:${kind}`
}

function safeLocalRead(kind: Kind): RecordItem[] {
  try {
    const raw = localStorage.getItem(storageKey(kind))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function safeLocalWrite(kind: Kind, items: RecordItem[]) {
  try {
    localStorage.setItem(storageKey(kind), JSON.stringify(items))
  } catch {}
}

export function LocalWorkspace({ kind }: { kind: Kind }) {
  const cfg = config[kind]
  const { data: session, isPending } = useSession()
  const [items, setItems] = useState<RecordItem[]>([])
  const [title, setTitle] = useState("")
  const [meta, setMeta] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [query, setQuery] = useState("")
  const [syncState, setSyncState] = useState<SyncState>("checking")
  const [syncError, setSyncError] = useState("")
  const readyToSave = useRef(false)

  useEffect(() => {
    let cancelled = false
    readyToSave.current = false
    setSyncError("")

    async function loadWorkspace() {
      if (isPending) {
        setSyncState("checking")
        return
      }

      if (!session?.user) {
        const local = safeLocalRead(kind)
        if (!cancelled) {
          setItems(local)
          setSyncState("local")
          readyToSave.current = true
        }
        return
      }

      setSyncState("checking")

      try {
        const response = await fetch(`/api/workspace/${encodeURIComponent(kind)}`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        })

        if (!response.ok) {
          throw new Error(response.status === 401 ? "Authentication required for cloud sync." : "Cloud workspace could not be loaded.")
        }

        const payload = await response.json()
        const cloudItems = Array.isArray(payload?.data) ? payload.data : []

        if (!cancelled) {
          setItems(cloudItems)
          safeLocalWrite(kind, cloudItems)
          setSyncState("cloud")
          readyToSave.current = true
        }
      } catch (error) {
        const local = safeLocalRead(kind)
        if (!cancelled) {
          setItems(local)
          setSyncState("error")
          setSyncError(error instanceof Error ? error.message : "Cloud sync is temporarily unavailable.")
          readyToSave.current = true
        }
      }
    }

    void loadWorkspace()
    return () => {
      cancelled = true
    }
  }, [kind, session?.user, isPending])

  useEffect(() => {
    if (!readyToSave.current) return

    safeLocalWrite(kind, items)

    if (!session?.user) {
      setSyncState("local")
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSyncState("saving")
      setSyncError("")

      try {
        const response = await fetch(`/api/workspace/${encodeURIComponent(kind)}`, {
          method: "PUT",
          credentials: "include",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ data: items }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error || "Cloud workspace could not be saved.")
        }

        setSyncState("cloud")
      } catch (error) {
        if (controller.signal.aborted) return
        setSyncState("error")
        setSyncError(error instanceof Error ? error.message : "Cloud sync is temporarily unavailable.")
      }
    }, 500)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [items, kind, session?.user])

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

  const syncLabel =
    syncState === "cloud"
      ? "Cloud synced"
      : syncState === "saving"
        ? "Saving to cloud…"
        : syncState === "checking"
          ? "Checking cloud…"
          : syncState === "error"
            ? "Local fallback"
            : "Saved in this browser"

  const syncDescription =
    syncState === "cloud"
      ? "Authenticated D1 workspace sync is active for this section. A local browser copy is also kept as a fallback."
      : syncState === "saving"
        ? "Your latest changes are being saved to the authenticated HEGEVA workspace."
        : syncState === "error"
          ? `${syncError || "Cloud sync is unavailable."} Your browser copy remains available.`
          : session?.user
            ? "HEGEVA is checking your authenticated cloud workspace."
            : "Sign in to enable HEGEVA cloud workspace sync. Until then, records stay in this browser only."

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

      <div className="glass-panel mt-6 flex items-start gap-3 rounded-2xl p-4">
        {syncState === "cloud" || syncState === "saving" || syncState === "checking" ? (
          <Cloud className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        ) : (
          <CloudOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">{syncLabel}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{syncDescription}</p>
        </div>
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
