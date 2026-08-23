"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Cloud, HardDrive, History, RotateCcw, Save, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"

const LAST_BUILD_KEY = "hegeva:app-studio:last-built-html"

type ProjectVersion = {
  id: string
  name: string
  html: string
  createdAt: string
}

const copy = {
  en: {
    title: "Project versions",
    body: "Save verified App Studio builds as restorable versions. Signed-in users sync through the HEGEVA workspace; signed-out users stay local to this browser.",
    name: "Version name",
    placeholder: "e.g. Invoice app v1",
    save: "Save current build",
    empty: "No saved versions yet.",
    restore: "Restore",
    remove: "Delete",
    restored: "Version restored as the current App Studio build.",
    noBuild: "Create a successful build before saving a version.",
    cloud: "Cloud synced",
    local: "Local browser storage",
    saving: "Saving…",
    checking: "Checking storage…",
    error: "Cloud sync unavailable — local fallback is active.",
  },
  hu: {
    title: "Projektverziók",
    body: "Az ellenőrzött App Studio buildjeidet visszaállítható verzióként mentheted. Bejelentkezve a HEGEVA felhőmunkaterülettel szinkronizál, kijelentkezve ebben a böngészőben marad.",
    name: "Verzió neve",
    placeholder: "pl. Számlázó app v1",
    save: "Aktuális build mentése",
    empty: "Még nincs mentett verzió.",
    restore: "Visszaállítás",
    remove: "Törlés",
    restored: "A verzió visszaállítva aktuális App Studio buildként.",
    noBuild: "Mentés előtt készíts egy sikeres buildet.",
    cloud: "Felhőbe szinkronizálva",
    local: "Helyi böngészőtárhely",
    saving: "Mentés…",
    checking: "Tárhely ellenőrzése…",
    error: "A felhőszinkron nem elérhető — a helyi mentés aktív.",
  },
  de: {
    title: "Projektversionen",
    body: "Speichere geprüfte App-Studio-Builds als wiederherstellbare Versionen. Angemeldete Nutzer synchronisieren über den HEGEVA-Arbeitsbereich; sonst bleibt alles lokal im Browser.",
    name: "Versionsname",
    placeholder: "z. B. Rechnungs-App v1",
    save: "Aktuellen Build speichern",
    empty: "Noch keine gespeicherten Versionen.",
    restore: "Wiederherstellen",
    remove: "Löschen",
    restored: "Version als aktueller App-Studio-Build wiederhergestellt.",
    noBuild: "Erstelle vor dem Speichern einen erfolgreichen Build.",
    cloud: "Cloud synchronisiert",
    local: "Lokaler Browserspeicher",
    saving: "Speichern…",
    checking: "Speicher wird geprüft…",
    error: "Cloud-Sync nicht verfügbar — lokaler Fallback ist aktiv.",
  },
  fr: {
    title: "Versions du projet",
    body: "Enregistrez les builds App Studio vérifiés comme versions restaurables. Les utilisateurs connectés synchronisent via l’espace HEGEVA; sinon les données restent dans ce navigateur.",
    name: "Nom de la version",
    placeholder: "ex. App facturation v1",
    save: "Enregistrer le build actuel",
    empty: "Aucune version enregistrée.",
    restore: "Restaurer",
    remove: "Supprimer",
    restored: "Version restaurée comme build App Studio actuel.",
    noBuild: "Créez un build réussi avant d’enregistrer une version.",
    cloud: "Synchronisé dans le cloud",
    local: "Stockage local du navigateur",
    saving: "Enregistrement…",
    checking: "Vérification du stockage…",
    error: "Synchronisation cloud indisponible — le stockage local reste actif.",
  },
  es: {
    title: "Versiones del proyecto",
    body: "Guarda builds verificados de App Studio como versiones restaurables. Los usuarios con sesión iniciada sincronizan mediante el espacio HEGEVA; sin sesión permanecen en este navegador.",
    name: "Nombre de versión",
    placeholder: "p. ej. App de facturas v1",
    save: "Guardar build actual",
    empty: "Todavía no hay versiones guardadas.",
    restore: "Restaurar",
    remove: "Eliminar",
    restored: "Versión restaurada como build actual de App Studio.",
    noBuild: "Crea un build correcto antes de guardar una versión.",
    cloud: "Sincronizado en la nube",
    local: "Almacenamiento local del navegador",
    saving: "Guardando…",
    checking: "Comprobando almacenamiento…",
    error: "La sincronización en la nube no está disponible — sigue activo el respaldo local.",
  },
} as const

export function ProjectHistory() {
  const { locale } = useI18n()
  const c = copy[locale]
  const { items, setItems, syncState, cloudEnabled } = useWorkspaceData<ProjectVersion>("app-studio-projects")
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [hasBuild, setHasBuild] = useState(false)

  function refreshBuildState() {
    try {
      setHasBuild(Boolean(localStorage.getItem(LAST_BUILD_KEY)?.trim()))
    } catch {
      setHasBuild(false)
    }
  }

  useEffect(() => {
    refreshBuildState()
    const id = window.setInterval(refreshBuildState, 1500)
    return () => window.clearInterval(id)
  }, [])

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items],
  )

  function saveVersion() {
    setMessage("")
    let html = ""
    try {
      html = localStorage.getItem(LAST_BUILD_KEY)?.trim() || ""
    } catch {}
    if (!html) {
      setMessage(c.noBuild)
      return
    }

    const createdAt = new Date().toISOString()
    const fallbackName = `Build ${createdAt.replace("T", " ").slice(0, 16)}`
    const version: ProjectVersion = {
      id: crypto.randomUUID(),
      name: name.trim() || fallbackName,
      html,
      createdAt,
    }

    setItems((current) => [version, ...current].slice(0, 25))
    setName("")
  }

  function restoreVersion(version: ProjectVersion) {
    try {
      localStorage.setItem(LAST_BUILD_KEY, version.html)
      setMessage(c.restored)
      window.dispatchEvent(new StorageEvent("storage", { key: LAST_BUILD_KEY, newValue: version.html }))
    } catch {
      setMessage(c.noBuild)
    }
  }

  function removeVersion(id: string) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  const storageLabel =
    syncState === "saving" ? c.saving :
    syncState === "checking" ? c.checking :
    syncState === "error" ? c.error :
    cloudEnabled && syncState === "cloud" ? c.cloud : c.local

  return (
    <section className="mt-8 glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold text-foreground">{c.title}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
          {cloudEnabled && syncState === "cloud" ? <Cloud className="size-3.5" aria-hidden /> : <HardDrive className="size-3.5" aria-hidden />}
          {storageLabel}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="project-version-name" className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{c.name}</label>
          <input
            id="project-version-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={c.placeholder}
            className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <button
          type="button"
          disabled={!hasBuild}
          onClick={saveVersion}
          className="self-end inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="size-4" aria-hidden />
          {c.save}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}

      <div className="mt-5 space-y-3">
        {sorted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{c.empty}</p>
        ) : sorted.map((version) => (
          <article key={version.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
                <h3 className="truncate text-sm font-semibold text-foreground">{version.name}</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => restoreVersion(version)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium">
                <RotateCcw className="size-3.5" aria-hidden />{c.restore}
              </button>
              <button type="button" onClick={() => removeVersion(version.id)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground">
                <Trash2 className="size-3.5" aria-hidden />{c.remove}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
