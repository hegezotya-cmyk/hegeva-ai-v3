"use client"
import { useState } from "react"
import { useI18n } from "@/lib/i18n/provider"

const COPY = {
  en: { eyebrow: "OWNER-ONLY RENEWAL", title: "Renew the expired owner approval", body: "This renews approval for the existing bounded profile only. It does not enable AI, tools, execution, or the provider.", renew: "Renew approval", pending: "Renewing…", success: "Approval renewed. The profile remains disabled.", failed: "Renewal is unavailable." },
  hu: { eyebrow: "CSAK TULAJDONOSI MEGÚJÍTÁS", title: "Lejárt tulajdonosi jóváhagyás megújítása", body: "Ez csak a meglévő korlátozott profil jóváhagyását újítja meg. Nem engedélyezi az AI-t, az eszközöket, a végrehajtást vagy a providert.", renew: "Jóváhagyás megújítása", pending: "Megújítás…", success: "A jóváhagyás megújult. A profil továbbra is letiltva marad.", failed: "A megújítás nem érhető el." },
  de: { eyebrow: "NUR BESITZER-ERNEUERUNG", title: "Abgelaufene Besitzerfreigabe erneuern", body: "Erneuert nur die Freigabe des bestehenden begrenzten Profils. KI, Tools, Ausführung und Anbieter bleiben deaktiviert.", renew: "Freigabe erneuern", pending: "Wird erneuert…", success: "Freigabe erneuert. Das Profil bleibt deaktiviert.", failed: "Erneuerung nicht verfügbar." },
  fr: { eyebrow: "RENOUVELLEMENT PROPRIÉTAIRE", title: "Renouveler l’approbation expirée", body: "Renouvelle uniquement l’approbation du profil limité existant. L’IA, les outils, l’exécution et le fournisseur restent désactivés.", renew: "Renouveler l’approbation", pending: "Renouvellement…", success: "Approbation renouvelée. Le profil reste désactivé.", failed: "Renouvellement indisponible." },
  es: { eyebrow: "RENOVACIÓN SOLO DEL PROPIETARIO", title: "Renovar la aprobación expirada", body: "Solo renueva la aprobación del perfil limitado existente. La IA, las herramientas, la ejecución y el proveedor siguen desactivados.", renew: "Renovar aprobación", pending: "Renovando…", success: "Aprobación renovada. El perfil sigue desactivado.", failed: "Renovación no disponible." },
} as const

export function OwnerAIBotRenewal({ profileId }: { profileId: string }) {
  const { locale } = useI18n()
  const copy = COPY[locale]
  const [state, setState] = useState<"idle" | "pending" | "success" | "failed">("idle")
  async function renew() {
    setState("pending")
    try {
      const response = await fetch("/api/ai-bot/renew-approval", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ profileId }) })
      setState(response.ok ? "success" : "failed")
    } catch { setState("failed") }
  }
  return <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-amber-300/30 bg-amber-300/5 p-5" aria-labelledby="owner-ai-bot-renewal-title"><p className="text-xs uppercase tracking-[0.2em] text-amber-200">{copy.eyebrow}</p><h2 id="owner-ai-bot-renewal-title" className="mt-2 font-display text-xl">{copy.title}</h2><p className="mt-2 text-sm text-muted-foreground">{copy.body}</p><button type="button" className="mt-4 min-h-11 rounded-lg border border-amber-300/40 px-4" onClick={renew} disabled={state === "pending"}>{state === "pending" ? copy.pending : copy.renew}</button>{state !== "idle" && <p className="mt-3 text-sm" role="status" aria-live="polite">{state === "success" ? copy.success : copy.failed}</p>}</section>
}
