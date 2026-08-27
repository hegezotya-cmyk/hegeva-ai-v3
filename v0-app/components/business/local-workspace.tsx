"use client"

import { FormEvent, useMemo, useState } from "react"
import { Cloud, CloudOff, FileText, Pencil, Plus, Receipt, Search, Sparkles, Trash2, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { AICore, IntelligenceCard, SignalIcon } from "@/components/visual-engine"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"

type Kind = "customers" | "documents" | "expenses"
type RecordItem = { id: string; title: string; meta?: string; amount?: number; notes?: string; followUp?: string; customerStatus?: "lead" | "active" | "paused"; createdAt: string }

const config: Record<Kind, { title: string; singular: string; subtitle: string; placeholder: string }> = {
  customers: { title: "Customers & CRM", singular: "customer", subtitle: "Manage real customer records. Signed-in accounts sync through the HEGEVA cloud workspace.", placeholder: "Customer or company name" },
  documents: { title: "Documents", singular: "document", subtitle: "Keep lightweight document records with authenticated cloud sync and a local browser fallback.", placeholder: "Document title" },
  expenses: { title: "Expenses", singular: "expense", subtitle: "Track real expense entries. Totals are calculated only from records you add.", placeholder: "Supplier or expense name" },
}

const visual = {
  customers: { icon: Users, tone: "emerald" as const, label: "CRM intelligence" },
  documents: { icon: FileText, tone: "cyan" as const, label: "Document intelligence" },
  expenses: { icon: Receipt, tone: "gold" as const, label: "Expense intelligence" },
}

export function LocalWorkspace({ kind }: { kind: Kind }) {
  const { locale, t } = useI18n()
  const ui = {
    en:{cloud:"Cloud synced",saving:"Saving to cloud…",checking:"Checking cloud…",fallback:"Local fallback",local:"Saved in this browser",add:"Add",save:"Save",update:"Update",edit:"Edit",cancel:"Cancel",search:"Search",notes:"Notes",amount:"Amount (£)",total:"Saved expense total",calculated:"Calculated only from entries saved below.",none:"No saved records yet",empty:"Add your first real record. HEGEVA never creates fake business data.",saved:"Saved",del:"Delete"},
    hu:{cloud:"Felhőbe szinkronizálva",saving:"Mentés a felhőbe…",checking:"Felhő ellenőrzése…",fallback:"Helyi biztonsági másolat",local:"Ebben a böngészőben mentve",add:"Hozzáadás",save:"Mentés",update:"Frissítés",edit:"Szerkesztés",cancel:"Mégse",search:"Keresés",notes:"Jegyzetek",amount:"Összeg (£)",total:"Mentett kiadások összege",calculated:"Csak az alább mentett tételekből számítva.",none:"Még nincs mentett adat",empty:"Add hozzá az első valódi adatot. A HEGEVA nem készít hamis üzleti adatokat.",saved:"Mentve",del:"Törlés"},
    de:{cloud:"Cloud-synchronisiert",saving:"Wird gespeichert…",checking:"Cloud wird geprüft…",fallback:"Lokale Sicherung",local:"Im Browser gespeichert",add:"Hinzufügen",save:"Speichern",update:"Aktualisieren",edit:"Bearbeiten",cancel:"Abbrechen",search:"Suchen",notes:"Notizen",amount:"Betrag (£)",total:"Gespeicherte Ausgaben",calculated:"Nur aus den unten gespeicherten Einträgen berechnet.",none:"Noch keine Einträge",empty:"Fügen Sie den ersten echten Eintrag hinzu. HEGEVA erstellt keine erfundenen Daten.",saved:"Gespeichert",del:"Löschen"},
    fr:{cloud:"Synchronisé dans le cloud",saving:"Enregistrement…",checking:"Vérification du cloud…",fallback:"Copie locale",local:"Enregistré dans ce navigateur",add:"Ajouter",save:"Enregistrer",update:"Mettre à jour",edit:"Modifier",cancel:"Annuler",search:"Rechercher",notes:"Notes",amount:"Montant (£)",total:"Total des dépenses enregistrées",calculated:"Calculé uniquement à partir des entrées ci-dessous.",none:"Aucune donnée enregistrée",empty:"Ajoutez votre première donnée réelle. HEGEVA ne crée aucune fausse donnée.",saved:"Enregistré",del:"Supprimer"},
    es:{cloud:"Sincronizado en la nube",saving:"Guardando…",checking:"Comprobando la nube…",fallback:"Copia local",local:"Guardado en este navegador",add:"Añadir",save:"Guardar",update:"Actualizar",edit:"Editar",cancel:"Cancelar",search:"Buscar",notes:"Notas",amount:"Importe (£)",total:"Total de gastos guardados",calculated:"Calculado solo con las entradas guardadas abajo.",none:"Aún no hay datos guardados",empty:"Añade tu primer dato real. HEGEVA no crea datos empresariales falsos.",saved:"Guardado",del:"Eliminar"}
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
  const theme = visual[kind]
  const ThemeIcon = theme.icon
  const { items, setItems, syncState, syncError, cloudEnabled } = useWorkspaceData<RecordItem>(kind)
  const [title, setTitle] = useState("")
  const [meta, setMeta] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [followUp, setFollowUp] = useState("")
  const [customerStatus, setCustomerStatus] = useState<RecordItem["customerStatus"]>("lead")
  const [query, setQuery] = useState("")
  const [customerFilter, setCustomerFilter] = useState<"all"|"due">("all")
  const [editingId, setEditingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const searched = q ? items.filter((item) => `${item.title} ${item.meta ?? ""} ${item.notes ?? ""}`.toLowerCase().includes(q)) : items
    if (kind !== "customers" || customerFilter === "all") return searched
    const now = new Date().toISOString().slice(0,10)
    return searched.filter((item) => Boolean(item.followUp) && item.followUp! <= now)
  }, [items, query, kind, customerFilter])

  const total = useMemo(() => items.reduce((sum, item) => sum + (item.amount || 0), 0), [items])
  function resetForm() { setTitle(""); setMeta(""); setAmount(""); setNotes(""); setFollowUp(""); setCustomerStatus("lead"); setEditingId(null) }
  function editItem(item: RecordItem) { setEditingId(item.id); setTitle(item.title); setMeta(item.meta || ""); setAmount(typeof item.amount === "number" ? String(item.amount) : ""); setNotes(item.notes || ""); setFollowUp(item.followUp || ""); setCustomerStatus(item.customerStatus || "lead") }
  function saveItem(e: FormEvent) {
    e.preventDefault(); const clean = title.trim(); if (!clean) return
    const parsedAmount = kind === "expenses" && amount ? Number(amount) : undefined
    if (kind === "expenses" && parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) return
    setItems((current) => {
      const existing = editingId ? current.find((item) => item.id === editingId) : undefined
      const next: RecordItem = { id: existing?.id || crypto.randomUUID(), title: clean, meta: meta.trim() || undefined, amount: parsedAmount, notes: notes.trim() || undefined, followUp: kind === "customers" ? followUp || undefined : undefined, customerStatus: kind === "customers" ? customerStatus : undefined, createdAt: existing?.createdAt || new Date().toISOString() }
      return existing ? current.map((item) => item.id === existing.id ? next : item) : [next, ...current]
    }); resetForm()
  }

  const syncLabel = syncState === "cloud" ? ui.cloud : syncState === "saving" ? ui.saving : syncState === "checking" ? ui.checking : syncState === "error" ? ui.fallback : ui.local
  const syncDescription = syncState === "cloud" ? detail.cloud : syncState === "saving" ? detail.saving : syncState === "error" ? detail.error : cloudEnabled ? detail.checking : detail.guest
  const inputClass = "w-full rounded-xl border border-white/10 bg-background/35 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/50 focus:bg-background/55 focus:shadow-[0_0_24px_-12px_var(--primary)]"

  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-20 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-52 size-72 rounded-full bg-violet/10 blur-3xl" />

      <IntelligenceCard tone={theme.tone} className="relative p-6 sm:p-8">
        <div className="absolute right-5 top-5 opacity-60"><AICore state="active" /></div>
        <div className="flex max-w-4xl items-start gap-4 pr-20">
          <SignalIcon icon={ThemeIcon} tone={theme.tone} className="size-12 rounded-2xl" />
          <div>
            <p className="ve-eyebrow">{detail.eyebrow} · {theme.label}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{cfg.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{cfg.subtitle}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3"><StatusBadge status="working" /><span className="rounded-full border border-white/10 bg-background/30 px-3 py-1 text-[11px] uppercase tracking-[.12em] text-muted-foreground">{items.length} records</span></div>
      </IntelligenceCard>

      <IntelligenceCard tone={syncState === "cloud" ? "cyan" : "neutral"} className="mt-5 flex items-start gap-3 p-4">
        {syncState === "cloud" || syncState === "saving" || syncState === "checking" ? <Cloud className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden /> : <CloudOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
        <div><p className="text-sm font-medium text-foreground">{syncLabel}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{syncDescription}</p>{syncError && <p className="mt-1 text-xs text-destructive">{syncError}</p>}</div>
      </IntelligenceCard>

      {kind === "expenses" && <IntelligenceCard tone="gold" className="mt-5 p-5"><div className="flex items-center gap-4"><SignalIcon icon={Receipt} tone="gold" /><div><p className="text-xs uppercase tracking-wide text-muted-foreground">{ui.total}</p><p className="mt-1 font-display text-3xl font-semibold text-gold">£{total.toFixed(2)}</p><p className="mt-1 text-xs text-muted-foreground">{ui.calculated}</p></div></div></IntelligenceCard>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <IntelligenceCard tone={theme.tone} className="h-fit p-5">
          <form onSubmit={saveItem}>
            <div className="flex items-center gap-3"><SignalIcon icon={editingId ? Pencil : Plus} tone={theme.tone} className="size-9 rounded-xl" /><div><p className="text-sm font-semibold text-foreground">{editingId ? ui.edit : ui.add}</p><p className="text-[11px] text-muted-foreground">{cfg.singular}</p></div></div>
            <div className="mt-5 space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={cfg.placeholder} className={inputClass} />
              <input value={meta} onChange={(e) => setMeta(e.target.value)} placeholder={kind === "customers" ? detail.customerMeta : kind === "documents" ? detail.documentMeta : detail.expenseMeta} className={inputClass} />
              {kind === "expenses" && <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={ui.amount} className={inputClass} />}
              {kind === "customers" && <><select value={customerStatus} onChange={(e) => setCustomerStatus(e.target.value as RecordItem["customerStatus"])} className={inputClass}><option value="lead">{crm.lead}</option><option value="active">{crm.active}</option><option value="paused">{crm.paused}</option></select><label className="block text-xs text-muted-foreground">{crm.followUp}<input type="date" value={followUp} onChange={(e)=>setFollowUp(e.target.value)} className={`mt-1 ${inputClass}`}/></label></>}
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={ui.notes} rows={4} className={`${inputClass} resize-none`} />
            </div>
            <div className="mt-4 flex gap-2"><Button type="submit" className="flex-1 shadow-[0_0_28px_-12px_var(--primary)]">{editingId ? ui.update : ui.save}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm} aria-label={ui.cancel}><X className="size-4" /> {ui.cancel}</Button>}</div>
          </form>
        </IntelligenceCard>

        <section>
          {kind === "customers" && <div className="mb-3 flex gap-2">{(["all","due"] as const).map((value)=><button key={value} type="button" onClick={()=>setCustomerFilter(value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${customerFilter===value?"border-primary/40 bg-primary/15 text-primary shadow-[0_0_22px_-12px_var(--primary)]":"border-white/10 bg-background/25 text-muted-foreground hover:border-primary/25"}`}>{value==="all"?crm.all:crm.due}</button>)}</div>}
          <IntelligenceCard tone="cyan" className="flex items-center gap-3 px-4 py-3"><Search className="size-4 text-cyan" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${ui.search}: ${cfg.title}`} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" /></IntelligenceCard>

          <div className="mt-4 space-y-3">
            {filtered.length === 0 ? <IntelligenceCard tone={theme.tone} className="p-10 text-center"><Sparkles className="mx-auto size-6 text-primary" /><p className="mt-3 font-medium text-foreground">{ui.none}</p><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{ui.empty}</p></IntelligenceCard> : filtered.map((item) => (
              <IntelligenceCard key={item.id} tone={theme.tone} interactive className="flex flex-col items-stretch justify-between gap-4 p-5 sm:flex-row sm:items-start">
                <div className="min-w-0"><h2 className="font-semibold text-foreground">{item.title}</h2>{item.meta && <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p>}{typeof item.amount === "number" && <p className="mt-2 text-lg font-semibold text-gold">£{item.amount.toFixed(2)}</p>}{item.notes && <p className="mt-2 text-sm leading-relaxed text-foreground/75">{item.notes}</p>}{kind === "customers" && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] text-primary">{item.customerStatus === "active" ? crm.active : item.customerStatus === "paused" ? crm.paused : crm.lead}</span>{item.followUp && <span className={`rounded-full border px-2 py-1 text-[11px] ${item.followUp <= new Date().toISOString().slice(0,10)?"border-gold/40 bg-gold/10 text-gold":"border-white/10 text-muted-foreground"}`}>{item.followUp === new Date().toISOString().slice(0,10)?crm.today:item.followUp < new Date().toISOString().slice(0,10)?crm.overdue:`${crm.followUp}: ${item.followUp}`}</span>}{item.followUp && item.followUp <= new Date().toISOString().slice(0,10) && <button type="button" onClick={()=>setItems((current)=>current.map((entry)=>entry.id===item.id?{...entry,followUp:undefined}:entry))} className="rounded-lg border border-primary/30 bg-primary/5 px-2 py-1 text-[11px] text-primary">{crm.markDone}</button>}</div>}<p className="mt-3 text-[11px] text-muted-foreground">{ui.saved} {new Date(item.createdAt).toLocaleString(locale)}</p></div>
                <div className="flex shrink-0 justify-end gap-2"><button type="button" onClick={() => editItem(item)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/5 p-2 text-cyan transition hover:bg-cyan/10" aria-label={`${ui.edit} ${item.title}`}><Pencil className="size-4" /></button><button type="button" onClick={() => { setItems((current) => current.filter((x) => x.id !== item.id)); if (editingId === item.id) resetForm() }} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-2 text-muted-foreground transition hover:border-destructive/40 hover:text-destructive" aria-label={`${ui.del} ${item.title}`}><Trash2 className="size-4" /></button></div>
              </IntelligenceCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
