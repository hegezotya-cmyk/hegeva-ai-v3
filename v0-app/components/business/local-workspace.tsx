"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { Cloud, CloudOff, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { useSession } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"

type Kind = "customers" | "documents" | "expenses"
type RecordItem = { id: string; title: string; meta?: string; amount?: number; notes?: string; followUp?: string; customerStatus?: "lead" | "active" | "paused"; createdAt: string }
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
  const { locale, t } = useI18n()
  const ui = {
    en:{cloud:"Cloud synced",saving:"Saving to cloud…",checking:"Checking cloud…",fallback:"Local fallback",local:"Saved in this browser",add:"Add",save:"Save",search:"Search",notes:"Notes",amount:"Amount (£)",total:"Saved expense total",calculated:"Calculated only from entries saved below.",none:"No saved records yet",empty:"Add your first real record. HEGEVA never creates fake business data.",saved:"Saved",del:"Delete"},
    hu:{cloud:"Felhőbe szinkronizálva",saving:"Mentés a felhőbe…",checking:"Felhő ellenőrzése…",fallback:"Helyi biztonsági másolat",local:"Ebben a böngészőben mentve",add:"Hozzáadás",save:"Mentés",search:"Keresés",notes:"Jegyzetek",amount:"Összeg (£)",total:"Mentett kiadások összege",calculated:"Csak az alább mentett tételekből számítva.",none:"Még nincs mentett adat",empty:"Add hozzá az első valódi adatot. A HEGEVA nem készít hamis üzleti adatokat.",saved:"Mentve",del:"Törlés"},
    de:{cloud:"Cloud-synchronisiert",saving:"Wird gespeichert…",checking:"Cloud wird geprüft…",fallback:"Lokale Sicherung",local:"Im Browser gespeichert",add:"Hinzufügen",save:"Speichern",search:"Suchen",notes:"Notizen",amount:"Betrag (£)",total:"Gespeicherte Ausgaben",calculated:"Nur aus den unten gespeicherten Einträgen berechnet.",none:"Noch keine Einträge",empty:"Fügen Sie den ersten echten Eintrag hinzu. HEGEVA erstellt keine erfundenen Daten.",saved:"Gespeichert",del:"Löschen"},
    fr:{cloud:"Synchronisé dans le cloud",saving:"Enregistrement…",checking:"Vérification du cloud…",fallback:"Copie locale",local:"Enregistré dans ce navigateur",add:"Ajouter",save:"Enregistrer",search:"Rechercher",notes:"Notes",amount:"Montant (£)",total:"Total des dépenses enregistrées",calculated:"Calculé uniquement à partir des entrées ci-dessous.",none:"Aucune donnée enregistrée",empty:"Ajoutez votre première donnée réelle. HEGEVA ne crée aucune fausse donnée.",saved:"Enregistré",del:"Supprimer"},
    es:{cloud:"Sincronizado en la nube",saving:"Guardando…",checking:"Comprobando la nube…",fallback:"Copia local",local:"Guardado en este navegador",add:"Añadir",save:"Guardar",search:"Buscar",notes:"Notas",amount:"Importe (£)",total:"Total de gastos guardados",calculated:"Calculado solo con las entradas guardadas abajo.",none:"Aún no hay datos guardados",empty:"Añade tu primer dato real. HEGEVA no crea datos empresariales falsos.",saved:"Guardado",del:"Eliminar"}
  }[locale]
  const detail = {
    en:{eyebrow:"HEGEVA Business Workspace",customerMeta:"Email / phone / status",documentMeta:"Type / customer / reference",expenseMeta:"Category / date / reference",cloud:"Authenticated cloud sync is active. A local browser copy is kept as a fallback.",saving:"Your latest changes are being saved to your HEGEVA workspace.",error:"Cloud sync is unavailable. Your browser copy remains available.",checking:"HEGEVA is checking your authenticated cloud workspace.",guest:"Sign in to enable cloud sync. Until then, records stay in this browser only."},
    hu:{eyebrow:"HEGEVA üzleti munkaterület",customerMeta:"Email / telefon / állapot",documentMeta:"Típus / ügyfél / hivatkozás",expenseMeta:"Kategória / dátum / hivatkozás",cloud:"A hitelesített felhőszinkron aktív. Helyi böngészős biztonsági másolat is készül.",saving:"A legújabb változtatások mentése folyamatban van a HEGEVA munkaterületre.",error:"A felhőszinkron nem érhető el. A böngészős másolat továbbra is használható.",checking:"A HEGEVA ellenőrzi a hitelesített felhőalapú munkaterületet.",guest:"Jelentkezz be a felhőszinkronhoz. Addig az adatok csak ebben a böngészőben maradnak."},
    de:{eyebrow:"HEGEVA Business-Arbeitsbereich",customerMeta:"E-Mail / Telefon / Status",documentMeta:"Typ / Kunde / Referenz",expenseMeta:"Kategorie / Datum / Referenz",cloud:"Authentifizierte Cloud-Synchronisierung ist aktiv. Eine lokale Sicherung bleibt erhalten.",saving:"Die neuesten Änderungen werden gespeichert.",error:"Cloud-Synchronisierung nicht verfügbar. Die Browserkopie bleibt erhalten.",checking:"HEGEVA prüft den authentifizierten Cloud-Arbeitsbereich.",guest:"Melden Sie sich für Cloud-Synchronisierung an. Bis dahin bleiben Daten nur im Browser."},
    fr:{eyebrow:"Espace professionnel HEGEVA",customerMeta:"E-mail / téléphone / statut",documentMeta:"Type / client / référence",expenseMeta:"Catégorie / date / référence",cloud:"La synchronisation cloud authentifiée est active. Une copie locale est conservée.",saving:"Vos dernières modifications sont en cours d’enregistrement.",error:"Synchronisation cloud indisponible. La copie locale reste accessible.",checking:"HEGEVA vérifie votre espace cloud authentifié.",guest:"Connectez-vous pour activer la synchronisation. Les données restent sinon dans ce navigateur."},
    es:{eyebrow:"Espacio de negocio HEGEVA",customerMeta:"Correo / teléfono / estado",documentMeta:"Tipo / cliente / referencia",expenseMeta:"Categoría / fecha / referencia",cloud:"La sincronización autenticada está activa. Se conserva una copia local.",saving:"Tus últimos cambios se están guardando.",error:"La sincronización no está disponible. La copia del navegador sigue accesible.",checking:"HEGEVA está comprobando tu espacio autenticado.",guest:"Inicia sesión para activar la sincronización. Hasta entonces, los datos quedan en este navegador."}
  }[locale]
  const crm = {
    en:{followUp:"Next follow-up",lead:"Lead",active:"Active customer",paused:"Paused",overdue:"Follow-up overdue",today:"Follow-up today",markDone:"Complete follow-up",all:"All customers",due:"Needs follow-up"},
    hu:{followUp:"Következő utánkövetés",lead:"Érdeklődő",active:"Aktív ügyfél",paused:"Szüneteltetve",overdue:"Lejárt utánkövetés",today:"Mai utánkövetés",markDone:"Utánkövetés teljesítése",all:"Minden ügyfél",due:"Utánkövetést igényel"},
    de:{followUp:"Nächste Nachverfolgung",lead:"Interessent",active:"Aktiver Kunde",paused:"Pausiert",overdue:"Nachverfolgung überfällig",today:"Nachverfolgung heute",markDone:"Nachverfolgung abschließen",all:"Alle Kunden",due:"Nachverfolgung nötig"},
    fr:{followUp:"Prochain suivi",lead:"Prospect",active:"Client actif",paused:"En pause",overdue:"Suivi en retard",today:"Suivi aujourd’hui",markDone:"Terminer le suivi",all:"Tous les clients",due:"Suivi nécessaire"},
    es:{followUp:"Próximo seguimiento",lead:"Cliente potencial",active:"Cliente activo",paused:"En pausa",overdue:"Seguimiento vencido",today:"Seguimiento hoy",markDone:"Completar seguimiento",all:"Todos los clientes",due:"Necesita seguimiento"}
  }[locale]
  const translated = { customers:{title:t.business.customers,subtitle:t.business.customersDesc,placeholder:t.business.customers}, documents:{title:t.business.documents,subtitle:t.business.documentsDesc,placeholder:t.business.documents}, expenses:{title:t.business.expenses,subtitle:t.business.expensesDesc,placeholder:t.business.expenses} }[kind]
  const cfg = { ...config[kind], ...translated }
  const { data: session, isPending } = useSession()
  const [items, setItems] = useState<RecordItem[]>([])
  const [title, setTitle] = useState("")
  const [meta, setMeta] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [followUp, setFollowUp] = useState("")
  const [customerStatus, setCustomerStatus] = useState<RecordItem["customerStatus"]>("lead")
  const [query, setQuery] = useState("")
  const [customerFilter, setCustomerFilter] = useState<"all"|"due">("all")
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
    const searched = q ? items.filter((item) => `${item.title} ${item.meta ?? ""} ${item.notes ?? ""}`.toLowerCase().includes(q)) : items
    if (kind !== "customers" || customerFilter === "all") return searched
    const now = new Date().toISOString().slice(0,10)
    return searched.filter((item) => Boolean(item.followUp) && item.followUp! <= now)
  }, [items, query, kind, customerFilter])

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
        followUp: kind === "customers" ? followUp || undefined : undefined,
        customerStatus: kind === "customers" ? customerStatus : undefined,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    setTitle("")
    setMeta("")
    setAmount("")
    setNotes("")
    setFollowUp("")
    setCustomerStatus("lead")
  }

  const syncLabel =
    syncState === "cloud"
      ? ui.cloud
      : syncState === "saving"
        ? ui.saving
        : syncState === "checking"
          ? ui.checking
          : syncState === "error"
            ? ui.fallback
            : ui.local

  const syncDescription =
    syncState === "cloud"
      ? detail.cloud
      : syncState === "saving"
        ? detail.saving
        : syncState === "error"
          ? detail.error
          : session?.user
            ? detail.checking
            : detail.guest

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{detail.eyebrow}</p>
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
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{ui.total}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">£{total.toFixed(2)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{ui.calculated}</p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={addItem} className="glass-panel h-fit rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Plus className="size-4 text-primary" /> {ui.add}</div>
          <div className="mt-5 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={cfg.placeholder} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
            <input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder={kind === "customers" ? detail.customerMeta : kind === "documents" ? detail.documentMeta : detail.expenseMeta} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
            {kind === "expenses" && <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={ui.amount} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />}
            {kind === "customers" && <><select value={customerStatus} onChange={(e) => setCustomerStatus(e.target.value as RecordItem["customerStatus"])} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"><option value="lead">{crm.lead}</option><option value="active">{crm.active}</option><option value="paused">{crm.paused}</option></select><label className="block text-xs text-muted-foreground">{crm.followUp}<input type="date" value={followUp} onChange={(e)=>setFollowUp(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"/></label></>}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={ui.notes} rows={4} className="w-full resize-none rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          </div>
          <Button type="submit" className="mt-4 w-full">{ui.save}</Button>
        </form>

        <section>
          {kind === "customers" && <div className="mb-3 flex gap-2">{(["all","due"] as const).map((value)=><button key={value} type="button" onClick={()=>setCustomerFilter(value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${customerFilter===value?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground"}`}>{value==="all"?crm.all:crm.due}</button>)}</div>}
          <div className="glass-panel flex items-center gap-2 rounded-xl px-3 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${ui.search}: ${cfg.title}`} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          </div>

          <div className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center">
                <p className="font-medium text-foreground">{ui.none}</p>
                <p className="mt-2 text-sm text-muted-foreground">{ui.empty}</p>
              </div>
            ) : filtered.map((item) => (
              <article key={item.id} className="glass-panel flex items-start justify-between gap-4 rounded-2xl p-5">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">{item.title}</h2>
                  {item.meta && <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p>}
                  {typeof item.amount === "number" && <p className="mt-2 text-lg font-semibold text-primary">£{item.amount.toFixed(2)}</p>}
                  {item.notes && <p className="mt-2 text-sm leading-relaxed text-foreground/75">{item.notes}</p>}
                  {kind === "customers" && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground">{item.customerStatus === "active" ? crm.active : item.customerStatus === "paused" ? crm.paused : crm.lead}</span>{item.followUp && <span className={`rounded-full border px-2 py-1 text-[11px] ${item.followUp <= new Date().toISOString().slice(0,10)?"border-gold/40 bg-gold/10 text-gold":"border-border text-muted-foreground"}`}>{item.followUp === new Date().toISOString().slice(0,10)?crm.today:item.followUp < new Date().toISOString().slice(0,10)?crm.overdue:`${crm.followUp}: ${item.followUp}`}</span>}{item.followUp && item.followUp <= new Date().toISOString().slice(0,10) && <button type="button" onClick={()=>setItems((current)=>current.map((entry)=>entry.id===item.id?{...entry,followUp:undefined}:entry))} className="rounded-lg border border-primary/30 px-2 py-1 text-[11px] text-primary">{crm.markDone}</button>}</div>}
                  <p className="mt-3 text-[11px] text-muted-foreground">{ui.saved} {new Date(item.createdAt).toLocaleString(locale)}</p>
                </div>
                <button type="button" onClick={() => setItems((current) => current.filter((x) => x.id !== item.id))} className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive" aria-label={`${ui.del} ${item.title}`}><Trash2 className="size-4" /></button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
