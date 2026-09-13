"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { analyticsPageLocation, campaignAttribution, PUBLIC_ANALYTICS_PATHS } from "@/lib/conversion-tracking"
import { useI18n } from "@/lib/i18n/provider"

const MEASUREMENT_ID = "G-TK99HP2BG7"
const CONSENT_KEY = "hegeva:analytics-consent:v1"
const PENDING_CTA_KEY = "hegeva:pending-acquisition:v1"
type Consent = "granted" | "denied" | null

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const copy = {
  en: { title: "Your privacy choices", body: "With your permission, HEGEVA uses Google Analytics to understand visits and registration starts. We do not send business records, form content or advertising identifiers.", accept: "Allow analytics", reject: "Essential only", manage: "Privacy choices", privacy: "Privacy notice" },
  hu: { title: "Adatvédelmi beállítások", body: "Engedélyeddel a HEGEVA Google Analytics segítségével méri a látogatásokat és a regisztrációk elindítását. Üzleti adatokat, űrlaptartalmat és reklámazonosítókat nem küldünk.", accept: "Analytics engedélyezése", reject: "Csak szükséges", manage: "Adatvédelmi beállítások", privacy: "Adatvédelmi tájékoztató" },
  de: { title: "Ihre Datenschutzauswahl", body: "Mit Ihrer Erlaubnis nutzt HEGEVA Google Analytics, um Besuche und Registrierungsstarts zu verstehen. Geschäftsdaten, Formularinhalte und Werbe-IDs werden nicht gesendet.", accept: "Analytics erlauben", reject: "Nur erforderlich", manage: "Datenschutzauswahl", privacy: "Datenschutzhinweis" },
  fr: { title: "Vos choix de confidentialité", body: "Avec votre accord, HEGEVA utilise Google Analytics pour comprendre les visites et les débuts d’inscription. Aucune donnée métier, contenu de formulaire ou identifiant publicitaire n’est envoyé.", accept: "Autoriser Analytics", reject: "Nécessaires uniquement", manage: "Choix de confidentialité", privacy: "Avis de confidentialité" },
  es: { title: "Tus opciones de privacidad", body: "Con tu permiso, HEGEVA usa Google Analytics para conocer las visitas y los inicios de registro. No enviamos datos empresariales, contenido de formularios ni identificadores publicitarios.", accept: "Permitir Analytics", reject: "Solo necesarias", manage: "Opciones de privacidad", privacy: "Aviso de privacidad" },
} as const

function queueConsentDefault() {
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments) }
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  })
}

function enableAnalytics() {
  queueConsentDefault()
  window.gtag?.("consent", "update", { analytics_storage: "granted" })
  window.gtag?.("js", new Date())
  window.gtag?.("config", MEASUREMENT_ID, {
    send_page_view: false,
    page_location: analyticsPageLocation(window.location.pathname),
    page_title: "HEGEVA AI",
    page_referrer: "",
    ...campaignAttribution(),
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
  if (!document.getElementById("hegeva-google-analytics")) {
    const script = document.createElement("script")
    script.id = "hegeva-google-analytics"
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
    document.head.appendChild(script)
  }
}

export function AnalyticsConsent() {
  const { locale } = useI18n()
  const text = copy[locale]
  const [consent, setConsent] = useState<Consent>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const sent = useRef(new Set<string>())

  useEffect(() => {
    queueConsentDefault()
    const saved = localStorage.getItem(CONSENT_KEY)
    if (saved === "granted") { setConsent("granted"); enableAnalytics() }
    else if (saved === "denied") setConsent("denied")
    else setOpen(true)
  }, [])

  useEffect(() => {
    const receive = (event: Event) => {
      if (consent !== "granted" || !window.gtag) return
      const detail = (event as CustomEvent<{ event?: string; path?: string }>).detail
      if (!detail || !["landing_page_view", "registration_start", "registration_completed", "pricing_view", "primary_cta_click", "subscription_success"].includes(detail.event || "")) return
      if (!detail.path || !PUBLIC_ANALYTICS_PATHS.includes(detail.path)) return
      const key = `${detail.event}:${detail.path}`
      if (detail.event !== "primary_cta_click" && sent.current.has(key)) return
      sent.current.add(key)
      window.gtag("event", detail.event, { page_path: detail.path, page_location: analyticsPageLocation(detail.path), page_title: "HEGEVA AI", page_referrer: "", ...campaignAttribution() })
    }
    window.addEventListener("hegeva:analytics-event", receive)
    return () => window.removeEventListener("hegeva:analytics-event", receive)
  }, [consent])

  useEffect(() => {
    if (consent !== "granted") return
    // Native static-page navigation replaces dataLayer. Consume the consented CTA
    // on its destination, once, rather than dispatching from an unloading document.
    try {
      const pending = JSON.parse(sessionStorage.getItem(PENDING_CTA_KEY) || "null")
      if (pending && pending.destination === pathname) {
        sessionStorage.removeItem(PENDING_CTA_KEY)
        const age = Date.now() - pending.createdAt
        if (PUBLIC_ANALYTICS_PATHS.includes(pending.path) && age >= 0 && age < 60000) {
          window.dispatchEvent(new CustomEvent("hegeva:analytics-event", { detail: { event: "primary_cta_click", path: pending.path } }))
        }
      }
    } catch { /* Storage must never prevent navigation or signup. */ }
    const landingPaths = ["/", "/ai-for-small-business", "/ai-business-assistant", "/quote-and-invoice-software", "/ai-for-trades", "/ai-for-electricians"]
    const registering = pathname === "/login" && Boolean(document.querySelector('[data-registration-active="true"]'))
    const event = landingPaths.includes(pathname) ? "landing_page_view" : pathname === "/pricing" ? "pricing_view" : registering ? "registration_start" : null
    if (event) window.dispatchEvent(new CustomEvent("hegeva:analytics-event", { detail: { event, path: pathname } }))
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-acquisition-event='primary_cta_click']") : null
      if (!target || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || target.target === "_blank" || target.hasAttribute("download")) return
      const destination = new URL(target.href)
      if (destination.origin !== window.location.origin || !PUBLIC_ANALYTICS_PATHS.includes(destination.pathname) || !PUBLIC_ANALYTICS_PATHS.includes(pathname)) return
      try {
        sessionStorage.setItem(PENDING_CTA_KEY, JSON.stringify({path:pathname,destination:destination.pathname,createdAt:Date.now()}))
      } catch {
        // Best-effort only when storage is blocked; never delay the customer's navigation.
        window.dispatchEvent(new CustomEvent("hegeva:analytics-event", { detail: { event: "primary_cta_click", path: pathname } }))
      }
    }
    document.addEventListener("click", click, true)
    return () => document.removeEventListener("click", click, true)
  }, [consent, pathname])

  const choose = (next: Exclude<Consent, null>) => {
    localStorage.setItem(CONSENT_KEY, next)
    setConsent(next)
    setOpen(false)
    if (next === "granted") enableAnalytics()
    else {
      sessionStorage.removeItem("hegeva:campaign:v1")
      sessionStorage.removeItem(PENDING_CTA_KEY)
      window.gtag?.("consent", "update", { analytics_storage: "denied" })
    }
  }

  return <>
    {open && <section role="dialog" aria-modal="true" aria-labelledby="analytics-consent-title" className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-primary/30 bg-background/95 p-5 shadow-2xl backdrop-blur sm:p-6">
      <h2 id="analytics-consent-title" className="font-display text-xl font-semibold">{text.title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{text.body}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={() => choose("granted")} className="hegeva-primary min-h-11 px-5">{text.accept}</button>
        <button type="button" onClick={() => choose("denied")} className="hegeva-secondary min-h-11 px-5">{text.reject}</button>
        <Link href="/privacy" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">{text.privacy}</Link>
      </div>
    </section>}
    {!open && consent && <button type="button" onClick={() => setOpen(true)} className="fixed bottom-3 left-3 z-[90] rounded-full border border-border bg-background/90 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-lg backdrop-blur hover:text-foreground">{text.manage}</button>}
  </>
}
