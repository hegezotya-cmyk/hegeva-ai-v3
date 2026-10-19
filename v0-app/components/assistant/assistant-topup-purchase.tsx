"use client"

import { useEffect, useState } from "react"

type Locale = "en" | "hu" | "de" | "fr" | "es"
type Pack = "small" | "medium" | "large"

const COPY = {
  en: { title: "Extra AI credits", body: "Top-Up credits stay on your account until you use them.", balance: "Top-Up balance", monthly: "Your monthly Assistant allowance is used first. Top-Up credits are used only after the monthly allowance runs out.", received: "Payment received. Your credits appear after Stripe confirms the payment. Refresh shortly if the balance has not updated yet.", cancelled: "Top-Up purchase cancelled. No credits were charged.", unavailable: "Top-Up checkout is temporarily unavailable. No charge was made.", packs: { small: "Small · 100 credits · £1.99", medium: "Medium · 300 credits · £3.99", large: "Large · 1,000 credits · £7.99" } },
  hu: { title: "Extra AI-kreditek", body: "A feltöltött kreditek a fiókodban maradnak, amíg fel nem használod őket.", balance: "Feltöltési egyenleg", monthly: "A havi Asszisztens-kereted használjuk először. A feltöltött kreditek csak a havi keret elfogyása után kerülnek felhasználásra.", received: "A fizetés megtörtént. A kreditek a Stripe visszaigazolása után jelennek meg. Ha az egyenleg még nem frissült, frissítsd az oldalt rövidesen.", cancelled: "A Top-Up vásárlást megszakítottad. Nem történt terhelés.", unavailable: "A Top-Up pénztár átmenetileg nem érhető el. Nem történt terhelés.", packs: { small: "Kicsi · 100 kredit · £1.99", medium: "Közepes · 300 kredit · £3.99", large: "Nagy · 1 000 kredit · £7.99" } },
  de: { title: "Zusätzliche KI-Guthaben", body: "Top-Up-Guthaben bleibt in Ihrem Konto, bis Sie es verwenden.", balance: "Top-Up-Guthaben", monthly: "Ihr monatliches Assistant-Kontingent wird zuerst verwendet. Top-Up-Guthaben wird erst nach dem Verbrauch des Kontingents genutzt.", received: "Zahlung erhalten. Ihr Guthaben erscheint nach der Stripe-Bestätigung. Aktualisieren Sie die Seite, falls der Kontostand noch nicht aktualisiert ist.", cancelled: "Top-Up-Kauf abgebrochen. Es wurde nichts berechnet.", unavailable: "Der Top-Up-Checkout ist vorübergehend nicht verfügbar. Es wurde nichts berechnet.", packs: { small: "Klein · 100 Guthaben · £1.99", medium: "Mittel · 300 Guthaben · £3.99", large: "Groß · 1.000 Guthaben · £7.99" } },
  fr: { title: "Crédits IA supplémentaires", body: "Les crédits Top-Up restent sur votre compte jusqu’à leur utilisation.", balance: "Solde Top-Up", monthly: "Votre quota mensuel Assistant est utilisé en premier. Les crédits Top-Up ne sont utilisés qu’après épuisement du quota.", received: "Paiement reçu. Vos crédits apparaîtront après confirmation par Stripe. Actualisez bientôt si le solde n’est pas encore à jour.", cancelled: "Achat Top-Up annulé. Aucun débit n’a été effectué.", unavailable: "Le paiement Top-Up est temporairement indisponible. Aucun débit n’a été effectué.", packs: { small: "Petit · 100 crédits · £1.99", medium: "Moyen · 300 crédits · £3.99", large: "Grand · 1 000 crédits · £7.99" } },
  es: { title: "Créditos de IA adicionales", body: "Los créditos Top-Up permanecen en tu cuenta hasta que los uses.", balance: "Saldo Top-Up", monthly: "Tu cuota mensual del Asistente se usa primero. Los créditos Top-Up solo se usan cuando se agota la cuota mensual.", received: "Pago recibido. Tus créditos aparecerán después de la confirmación de Stripe. Actualiza pronto si el saldo aún no se ha actualizado.", cancelled: "Compra Top-Up cancelada. No se ha realizado ningún cargo.", unavailable: "El checkout Top-Up no está disponible temporalmente. No se ha realizado ningún cargo.", packs: { small: "Pequeño · 100 créditos · £1.99", medium: "Mediano · 300 créditos · £3.99", large: "Grande · 1.000 créditos · £7.99" } },
} as const

export function AssistantTopUpPurchase({ locale, credits }: { locale: Locale; credits: number }) {
  const c = COPY[locale]
  const [buying, setBuying] = useState<Pack | null>(null)
  const [error, setError] = useState(false)
  const [result, setResult] = useState<"success" | "cancelled" | null>(null)

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("topup")
    setResult(value === "success" || value === "cancelled" ? value : null)
  }, [])

  async function buy(pack: Pack) {
    if (buying) return
    setBuying(pack)
    setError(false)
    try {
      const response = await fetch("/api/billing/topup/checkout", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ pack }) })
      const data = await response.json().catch(() => null)
      if (!response.ok || typeof data?.url !== "string" || !data.url.startsWith("https://checkout.stripe.com/")) throw new Error("topup")
      window.location.assign(data.url)
    } catch {
      setError(true)
      setBuying(null)
    }
  }

  return <section id="assistant-topup" className="mt-8 rounded-2xl border border-primary/25 bg-primary/[.06] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{c.title}</h2><p className="mt-1 text-sm text-muted-foreground">{c.body}</p></div><div className="rounded-xl border border-primary/25 bg-background/60 px-4 py-2 text-right"><span className="block text-xs text-muted-foreground">{c.balance}</span><strong className="text-lg text-primary">{credits}</strong></div></div>
    {result === "success" && <p role="status" className="mt-4 text-sm text-muted-foreground">{c.received}</p>}
    {result === "cancelled" && <p role="status" className="mt-4 text-sm text-muted-foreground">{c.cancelled}</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-3">{(["small", "medium", "large"] as const).map((pack) => <button key={pack} type="button" disabled={Boolean(buying)} onClick={() => void buy(pack)} className="min-h-11 rounded-xl border border-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60">{buying === pack ? "…" : c.packs[pack]}</button>)}</div>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">{c.monthly}</p>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{c.unavailable}</p>}
  </section>
}
