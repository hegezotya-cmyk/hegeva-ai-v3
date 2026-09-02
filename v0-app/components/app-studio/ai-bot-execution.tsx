"use client"
import { useState } from "react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import type { AIBotProfile } from "@/lib/ai-bot"
const COPY={en:{title:"Approved execution",choose:"Choose an enabled, approved bot",prompt:"Test message",run:"Run one request",disabled:"Provider disabled — no AI request will be made.",processing:"Processing…",done:"Verified response received.",failed:"Execution failed safely."},hu:{title:"Jóváhagyott végrehajtás",choose:"Válasszon engedélyezett, jóváhagyott botot",prompt:"Tesztüzenet",run:"Egy kérés indítása",disabled:"A szolgáltató le van tiltva — AI-kérés nem indul.",processing:"Feldolgozás…",done:"Ellenőrzött válasz érkezett.",failed:"A végrehajtás biztonságosan sikertelen."},de:{title:"Freigegebene Ausführung",choose:"Aktiven, freigegebenen Bot wählen",prompt:"Testnachricht",run:"Eine Anfrage starten",disabled:"Anbieter deaktiviert — keine KI-Anfrage.",processing:"Verarbeitung…",done:"Verifizierte Antwort empfangen.",failed:"Ausführung sicher fehlgeschlagen."},fr:{title:"Exécution approuvée",choose:"Choisir un bot actif et approuvé",prompt:"Message de test",run:"Lancer une requête",disabled:"Fournisseur désactivé — aucune requête IA.",processing:"Traitement…",done:"Réponse vérifiée reçue.",failed:"Échec sécurisé de l’exécution."},es:{title:"Ejecución aprobada",choose:"Elige un bot activo y aprobado",prompt:"Mensaje de prueba",run:"Ejecutar una solicitud",disabled:"Proveedor desactivado — no se enviará IA.",processing:"Procesando…",done:"Respuesta verificada recibida.",failed:"La ejecución falló de forma segura."}} as const
export function AIBotExecution() {
  const { locale } = useI18n()
  const c = COPY[locale]
  const { items } = useWorkspaceData<AIBotProfile>("ai-bot-profiles")
  const [profileId, setProfileId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [status, setStatus] = useState("")
  const approved = items.filter((item) => item.enabled && item.approvalState === "owner-approved")

  async function run() {
    const profile = approved.find((item) => item.id === profileId)
    if (!profile || !prompt.trim()) return
    setStatus(c.processing)
    try {
      const res = await fetch("/api/ai-bot/execute", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ profileId: profile.id, operationId: crypto.randomUUID(), prompt: prompt.slice(0, 400), locale }),
      })
      setStatus(res.ok ? c.done : c.failed)
    } catch {
      setStatus(c.failed)
    }
  }

  return (
    <section className="mt-8 min-w-0 w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-5" aria-labelledby="ai-bot-execution-title">
      <h2 id="ai-bot-execution-title" className="font-display text-xl">{c.title}</h2>
      <select aria-label={c.choose} value={profileId} onChange={(e) => setProfileId(e.target.value)} className="mt-4 min-h-11 w-full min-w-0 rounded-lg border border-white/15 bg-black/30 px-3">
        <option value="">{c.choose}</option>
        {approved.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <label className="mt-4 block text-sm">
        <span className="mb-1 block">{c.prompt}</span>
        <textarea maxLength={400} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-20 w-full min-w-0 rounded-lg border border-white/15 bg-black/30 p-3" />
      </label>
      <button type="button" disabled={!profileId || !prompt.trim() || status === c.processing} onClick={run} className="mt-3 min-h-11 rounded-lg border border-cyan-300/40 px-4 disabled:opacity-50">{c.run}</button>
      {status && <p className="mt-3 text-sm text-muted-foreground" role="status" aria-live="polite">{status}</p>}
      <p className="mt-3 text-xs text-muted-foreground">{c.disabled}</p>
    </section>
  )
}
