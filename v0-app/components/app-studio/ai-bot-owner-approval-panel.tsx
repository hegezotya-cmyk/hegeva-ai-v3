"use client"
import { useState } from "react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import type { AIBotProfile } from "@/lib/ai-bot"
import { AIBotOwnerApprovalControl } from "./ai-bot-owner-approval-control"

const COPY = {
  en: { title: "Temporary owner approval", sub: "Approve an enabled saved profile for one short canary window. This does not activate AI; a separate canary authorization is still required.", empty: "No saved AI Bot profiles yet.", disabled: "Disabled profiles cannot be approved.", enabled: "Enabled", disabledLabel: "Disabled" },
  hu: { title: "Ideiglenes tulajdonosi jóváhagyás", sub: "Egy engedélyezett mentett profil jóváhagyása rövid canary-időablakra. Ez nem aktiválja az AI-t; külön canary-jogosultság szükséges.", empty: "Még nincs mentett AI Bot profil.", disabled: "A letiltott profilok nem hagyhatók jóvá.", enabled: "Engedélyezve", disabledLabel: "Letiltva" },
  de: { title: "Temporäre Besitzerfreigabe", sub: "Ein aktiviertes gespeichertes Profil für ein kurzes Canary-Fenster freigeben. Dies aktiviert keine KI; eine separate Canary-Berechtigung bleibt erforderlich.", empty: "Noch keine gespeicherten AI-Bot-Profile.", disabled: "Deaktivierte Profile können nicht freigegeben werden.", enabled: "Aktiv", disabledLabel: "Deaktiviert" },
  fr: { title: "Approbation temporaire du propriétaire", sub: "Approuvez un profil enregistré actif pour une courte fenêtre canary. Cela n’active pas l’IA ; une autorisation canary distincte reste requise.", empty: "Aucun profil de bot IA enregistré.", disabled: "Les profils désactivés ne peuvent pas être approuvés.", enabled: "Actif", disabledLabel: "Désactivé" },
  es: { title: "Aprobación temporal del propietario", sub: "Aprueba un perfil guardado activo para una ventana canary breve. Esto no activa la IA; se requiere una autorización canary independiente.", empty: "Aún no hay perfiles de bot IA guardados.", disabled: "Los perfiles desactivados no se pueden aprobar.", enabled: "Activo", disabledLabel: "Desactivado" },
} as const
const PROFILE_ID = /^bot-[A-Za-z0-9._:-]{1,95}$/

export function AIBotOwnerApprovalPanel() {
  const { locale } = useI18n(); const copy = COPY[locale]; const { items, setItems } = useWorkspaceData<AIBotProfile>("ai-bot-profiles"); const [message, setMessage] = useState("")
  async function update(profileId: string) { try { const response = await fetch("/api/workspace/ai-bot-profiles", { credentials: "include", cache: "no-store", headers: { Accept: "application/json" } }); const payload = await response.json().catch(() => null); if (!response.ok || !Array.isArray(payload?.data)) throw new Error("refresh-failed"); setItems(payload.data as AIBotProfile[]); setMessage(copy.enabled) } catch { setMessage(copy.disabled) } }
  return <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="ai-bot-owner-approval-title"><div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5"><h2 id="ai-bot-owner-approval-title" className="font-display text-xl">{copy.title}</h2><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{copy.sub}</p>{message&&<p className="mt-2 text-sm" role="status">{message}</p>}{items.length===0&&<p className="mt-4 text-sm text-muted-foreground">{copy.empty}</p>}<div className="mt-5 grid gap-4 md:grid-cols-2">{items.filter(item=>PROFILE_ID.test(item.id)).map(item=><div key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-medium">{item.name}</h3><span className="text-xs text-muted-foreground">{item.enabled?copy.enabled:copy.disabledLabel}</span></div>{item.enabled?<AIBotOwnerApprovalControl profile={item} locale={locale} onApproved={update}/>:<p className="mt-3 text-xs text-muted-foreground">{copy.disabled}</p>}</div>)}</div></div></section>
}
