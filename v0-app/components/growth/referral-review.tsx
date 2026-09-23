"use client"

import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n/provider"

const COPY = {
  en: { title: "Customer referrals", create: "Create referral link", copy: "Copy referral link", copied: "Referral link copied", revoke: "Revoke", empty: "No referred registrations yet.", pending: "Pending" },
  hu: { title: "Ügyfélajánlások", create: "Ajánlói link létrehozása", copy: "Ajánlói link másolása", copied: "Az ajánlói link kimásolva", revoke: "Visszavonás", empty: "Még nincs ajánlott regisztráció.", pending: "Függőben" },
  de: { title: "Kundenempfehlungen", create: "Empfehlungslink erstellen", copy: "Empfehlungslink kopieren", copied: "Empfehlungslink kopiert", revoke: "Widerrufen", empty: "Noch keine empfohlenen Registrierungen.", pending: "Ausstehend" },
  fr: { title: "Parrainages clients", create: "Créer un lien de parrainage", copy: "Copier le lien de parrainage", copied: "Lien de parrainage copié", revoke: "Révoquer", empty: "Aucune inscription recommandée.", pending: "En attente" },
  es: { title: "Referencias de clientes", create: "Crear enlace de referencia", copy: "Copiar enlace de referencia", copied: "Enlace de referencia copiado", revoke: "Revocar", empty: "Aún no hay registros referidos.", pending: "Pendiente" },
} as const

type ReferralCode = { id: string; code: string }
type Attribution = { id: string; firstTouchAt: string; attributionState: string }

export function ReferralReview() {
  const { locale } = useI18n()
  const c = COPY[locale as keyof typeof COPY] ?? COPY.en
  const [code, setCode] = useState<ReferralCode | null>(null)
  const [items, setItems] = useState<Attribution[]>([])
  const [copied, setCopied] = useState(false)
  useEffect(() => { fetch("/api/referrals/attributions", { credentials: "include" }).then((r) => r.ok ? r.json() : null).then((d) => setItems(d?.items || [])) }, [])
  const referralUrl = useMemo(() => code ? `${window.location.origin}/r/${code.code}` : "", [code])
  const copyReferral = async () => { if (!referralUrl) return; await navigator.clipboard.writeText(referralUrl); setCopied(true); window.setTimeout(() => setCopied(false), 2000) }
  return <section className="mt-8 glass-panel rounded-3xl p-6"><h2 className="text-lg font-semibold">{c.title}</h2><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={async () => { const r = await fetch("/api/referrals/code", { method: "POST", credentials: "include" }); const d = await r.json(); if (r.ok) setCode(d) }} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold">{c.create}</button>{code && <><code className="max-w-full break-all rounded-xl border border-border px-3 py-2 text-sm">{referralUrl}</code><button type="button" onClick={() => void copyReferral()} className="rounded-xl border border-primary/30 px-3 py-2 text-sm">{copied ? c.copied : c.copy}</button><button type="button" onClick={async () => { await fetch(`/api/referrals/code/${code.id}`, { method: "DELETE", credentials: "include" }); setCode(null); setCopied(false) }} className="rounded-xl border border-border px-3 py-2 text-sm">{c.revoke}</button></>}</div>{items.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{c.empty}</p> : <ul className="mt-4 space-y-2">{items.map((x) => <li key={x.id} className="rounded-xl border border-border p-3 text-sm">{c.pending} · {new Date(x.firstTouchAt).toLocaleDateString()}</li>)}</ul>}</section>
}
