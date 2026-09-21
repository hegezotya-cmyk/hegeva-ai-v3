"use client"

import { FormEvent, useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/provider"

type Locale = "en" | "hu" | "de" | "fr" | "es"
type SetupCapability = { setupEligible: boolean; profileExists: boolean; reason?: "profile-exists" }
type ProfileForm = { name: string; purpose: string; instructions: string; knowledgeScope: string }

const COPY: Record<Locale, { eyebrow: string; title: string; body: string; name: string; purpose: string; instructions: string; scope: string; create: string; creating: string; created: string; existing: string; unavailable: string }> = {
  en: { eyebrow: "OWNER-ONLY SETUP", title: "Create a disabled AI Bot profile", body: "This only saves an inactive profile. It does not enable HEGEVA AI, tools, execution, or a provider.", name: "Profile name", purpose: "Purpose", instructions: "Instructions", scope: "Knowledge scope", create: "Create disabled profile", creating: "Creating disabled profile…", created: "Disabled owner profile saved. HEGEVA AI remains unavailable.", existing: "A disabled owner profile already exists. HEGEVA AI remains unavailable.", unavailable: "Owner setup is temporarily unavailable." },
  hu: { eyebrow: "CSAK TULAJDONOSNAK", title: "Letiltott AI Bot profil létrehozása", body: "Ez csak egy inaktív profilt ment. Nem engedélyezi a HEGEVA AI-t, eszközöket, végrehajtást vagy providert.", name: "Profil neve", purpose: "Cél", instructions: "Utasítások", scope: "Tudás hatóköre", create: "Letiltott profil létrehozása", creating: "Letiltott profil létrehozása…", created: "A letiltott tulajdonosi profil elmentve. A HEGEVA AI továbbra sem elérhető.", existing: "Letiltott tulajdonosi profil már létezik. A HEGEVA AI továbbra sem elérhető.", unavailable: "A tulajdonosi beállítás átmenetileg nem elérhető." },
  de: { eyebrow: "NUR FÜR INHABER", title: "Deaktiviertes AI-Bot-Profil erstellen", body: "Dies speichert nur ein inaktives Profil. HEGEVA AI, Tools, Ausführung und ein Provider werden nicht aktiviert.", name: "Profilname", purpose: "Zweck", instructions: "Anweisungen", scope: "Wissensumfang", create: "Deaktiviertes Profil erstellen", creating: "Deaktiviertes Profil wird erstellt…", created: "Deaktiviertes Inhaberprofil gespeichert. HEGEVA AI bleibt nicht verfügbar.", existing: "Ein deaktiviertes Inhaberprofil besteht bereits. HEGEVA AI bleibt nicht verfügbar.", unavailable: "Die Inhaber-Einrichtung ist vorübergehend nicht verfügbar." },
  fr: { eyebrow: "RÉSERVÉ AU PROPRIÉTAIRE", title: "Créer un profil AI Bot désactivé", body: "Cette action enregistre seulement un profil inactif. Elle n’active ni HEGEVA AI, ni outils, ni exécution, ni fournisseur.", name: "Nom du profil", purpose: "Objectif", instructions: "Instructions", scope: "Périmètre de connaissances", create: "Créer le profil désactivé", creating: "Création du profil désactivé…", created: "Profil propriétaire désactivé enregistré. HEGEVA AI reste indisponible.", existing: "Un profil propriétaire désactivé existe déjà. HEGEVA AI reste indisponible.", unavailable: "La configuration propriétaire est temporairement indisponible." },
  es: { eyebrow: "SOLO PARA EL PROPIETARIO", title: "Crear perfil de AI Bot desactivado", body: "Esto solo guarda un perfil inactivo. No habilita HEGEVA AI, herramientas, ejecución ni proveedor.", name: "Nombre del perfil", purpose: "Propósito", instructions: "Instrucciones", scope: "Alcance de conocimiento", create: "Crear perfil desactivado", creating: "Creando perfil desactivado…", created: "Perfil desactivado del propietario guardado. HEGEVA AI sigue sin estar disponible.", existing: "Ya existe un perfil desactivado del propietario. HEGEVA AI sigue sin estar disponible.", unavailable: "La configuración del propietario no está disponible temporalmente." },
}

const INITIAL_FORM: ProfileForm = {
  name: "Owner canary profile",
  purpose: "Verify one bounded owner-only AI Bot canary.",
  instructions: "Return one concise readiness statement only.",
  knowledgeScope: "No customer data and no external actions.",
}

export function OwnerAIBotSetup() {
  const { locale } = useI18n()
  const copy = COPY[locale]
  const labels: Record<keyof ProfileForm, string> = { name: copy.name, purpose: copy.purpose, instructions: copy.instructions, knowledgeScope: copy.scope }
  const [capability, setCapability] = useState<SetupCapability | null>(null)
  const [form, setForm] = useState<ProfileForm>(INITIAL_FORM)
  const [state, setState] = useState<"idle" | "creating" | "created" | "unavailable">("idle")

  useEffect(() => {
    let active = true
    async function readCapability() {
      try {
        const response = await fetch("/api/ai-bot/owner-setup-capability", { credentials: "include", headers: { Accept: "application/json" } })
        const data = await response.json().catch(() => null)
        if (active && response.ok && data?.setupEligible === true && data?.profileExists === false) setCapability({ setupEligible: true, profileExists: false })
        if (active && response.ok && data?.setupEligible === false && data?.profileExists === true && data?.reason === "profile-exists") setCapability({ setupEligible: false, profileExists: true, reason: "profile-exists" })
      } catch {}
    }
    void readCapability()
    return () => { active = false }
  }, [])

  async function createProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!capability?.setupEligible || state === "creating") return
    setState("creating")
    try {
      const response = await fetch("/api/ai-bot/owner-setup-profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...form, permittedTools: ["none"] }),
      })
      const data = await response.json().catch(() => null)
      if (response.status === 201 && data?.status === "created") setState("created")
      else setState("unavailable")
    } catch { setState("unavailable") }
  }

  if (capability?.profileExists) return <section className="mx-auto mt-4 w-full max-w-4xl rounded-2xl border border-amber-300/30 bg-black/40 p-5 text-sm text-amber-100" role="status">{copy.existing}</section>
  if (!capability?.setupEligible) return null
  if (state === "created") return <section className="mx-auto mt-4 w-full max-w-4xl rounded-2xl border border-amber-300/30 bg-black/40 p-5 text-sm text-amber-100" role="status">{copy.created}</section>

  return <section className="mx-auto mt-4 w-full max-w-4xl rounded-2xl border border-amber-300/30 bg-black/40 p-5 shadow-[0_0_32px_rgba(245,158,11,0.08)]">
    <p className="text-xs font-semibold tracking-[0.18em] text-amber-300">{copy.eyebrow}</p>
    <h2 className="mt-2 text-xl font-semibold text-white">{copy.title}</h2>
    <p className="mt-2 text-sm text-slate-300">{copy.body}</p>
    <form className="mt-5 grid gap-4" onSubmit={createProfile}>
      {(["name", "purpose", "instructions", "knowledgeScope"] as const).map((field) => <label key={field} className="grid gap-1.5 text-sm font-medium text-slate-200">
        {labels[field]}
        <textarea className="min-h-11 w-full rounded-lg border border-amber-300/25 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none ring-0 transition focus:border-amber-300/60" value={form[field]} maxLength={field === "name" ? 80 : field === "instructions" ? 1200 : 240} rows={field === "instructions" ? 3 : 2} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} required />
      </label>)}
      <button type="submit" className="min-h-11 w-full rounded-lg border border-amber-300/40 bg-amber-300/10 px-4 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-60" disabled={state === "creating"}>{state === "creating" ? copy.creating : copy.create}</button>
      <p className="text-xs text-slate-400" role="status" aria-live="polite">{state === "unavailable" ? copy.unavailable : copy.body}</p>
    </form>
  </section>
}
