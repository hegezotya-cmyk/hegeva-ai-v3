"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { analyticsPageLocation, campaignAttribution, captureReferralAttribution, clearReferralAttribution, PUBLIC_ANALYTICS_PATHS } from "@/lib/conversion-tracking"
import { analyticsReferrerOrigin } from "@/lib/analytics-referrer.mjs"
import { useI18n } from "@/lib/i18n/provider"

const IS_STAGING = process.env.NEXT_PUBLIC_APP_ENV === "staging"
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || (IS_STAGING ? "" : "G-TK99HP2BG7")
const ANALYTICS_DEBUG_MODE = process.env.NEXT_PUBLIC_GA_DEBUG_MODE === "enabled"
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || ""
const POSTHOG_PROJECT_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || ""
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || ""
const CLARITY_PUBLIC_PATHS = ["/", "/pricing", "/ai-for-small-business", "/ai-business-assistant", "/quote-and-invoice-software", "/ai-for-trades", "/ai-for-electricians", "/for-electricians", "/for-builders", "/for-plumbers", "/for-cleaners", "/for-property-maintenance", "/for-consultants"]
const POSTHOG_EVENTS = new Set([
  "$pageview",
  "landing_page_view", "registration_start", "registration_submitted", "registration_completed", "email_verified",
  "get_started_entry", "get_started_viewed", "first_customer_created", "first_quote_created", "first_invoice_created",
  "first_core_priority_seen", "pricing_view", "activation_completed", "primary_cta_click", "demo_entry_click",
  "demo_workspace_view", "demo_business_switch", "demo_signup_click", "challenge_view", "challenge_start",
  "business_type_selected", "demo_loaded", "demo_analysis_complete", "priority_viewed", "prepare_action_click",
  "prepared_action_complete", "challenge_complete", "business_score_view", "try_my_business_click", "own_business_start",
  "own_business_result", "share_click", "free_tool_use", "free_tool_cta_click", "referral_visit", "referral_signup",
  "referral_link_copy", "referral_paid_qualified", "referral_reward_reviewed",
])
const POSTHOG_ALLOWED_PATHS = [
  ...PUBLIC_ANALYTICS_PATHS,
  "/get-started", "/business/launch", "/business/customers", "/business/invoices", "/command-center", "/email-verification",
]
const CONSENT_KEY = "hegeva:analytics-consent:v1"
const PENDING_CTA_KEY = "hegeva:pending-acquisition:v1"
type Consent = "granted" | "denied" | null
type PostHogBrowser = typeof import("posthog-js").default

let posthogClient: PostHogBrowser | null = null
let posthogInit: Promise<PostHogBrowser | null> | null = null

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
    clarity?: (...args: unknown[]) => void
    __hegevaConsentDefaulted?: boolean
  }
}

const copy = {
  en: { title: "Your privacy choices", body: `With your permission, HEGEVA uses Google Analytics and PostHog EU to measure page visits and selected usage events.${CLARITY_PROJECT_ID ? " Microsoft Clarity may record interactions on public marketing pages; it is disabled on sign-in and workspace pages." : ""} We do not send business records, form content or advertising identifiers.`, accept: "Allow analytics", reject: "Essential only", manage: "Privacy choices", privacy: "Privacy notice" },
  hu: { title: "Adatvédelmi beállítások", body: `Engedélyeddel a HEGEVA a Google Analytics és az EU-s PostHog segítségével méri az oldalmegtekintéseket és egyes használati eseményeket.${CLARITY_PROJECT_ID ? " A Microsoft Clarity a nyilvános marketingoldalak használatát rögzítheti; a bejelentkezési és munkaterületi oldalakon nem fut." : ""} Üzleti adatokat, űrlaptartalmat vagy reklámazonosítókat nem küldünk.`, accept: "Analytics engedélyezése", reject: "Csak szükséges", manage: "Adatvédelmi beállítások", privacy: "Adatvédelmi tájékoztató" },
  de: { title: "Ihre Datenschutzauswahl", body: `Mit Ihrer Erlaubnis nutzt HEGEVA Google Analytics und PostHog EU, um Seitenaufrufe und ausgewählte Nutzungsereignisse zu messen.${CLARITY_PROJECT_ID ? " Microsoft Clarity kann Interaktionen auf öffentlichen Marketingseiten aufzeichnen; auf Anmelde- und Arbeitsbereichsseiten ist es deaktiviert." : ""} Geschäftsdaten, Formularinhalte und Werbe-IDs werden nicht gesendet.`, accept: "Analytics erlauben", reject: "Nur erforderlich", manage: "Datenschutzauswahl", privacy: "Datenschutzhinweis" },
  fr: { title: "Vos choix de confidentialité", body: `Avec votre accord, HEGEVA utilise Google Analytics et PostHog EU pour mesurer les pages vues et certains événements d’utilisation.${CLARITY_PROJECT_ID ? " Microsoft Clarity peut enregistrer les interactions sur les pages marketing publiques ; il est désactivé sur les pages de connexion et de l’espace de travail." : ""} Aucune donnée métier, contenu de formulaire ou identifiant publicitaire n’est envoyé.`, accept: "Autoriser Analytics", reject: "Nécessaires uniquement", manage: "Choix de confidentialité", privacy: "Avis de confidentialité" },
  es: { title: "Tus opciones de privacidad", body: `Con tu permiso, HEGEVA usa Google Analytics y PostHog EU para medir páginas vistas y algunos eventos de uso.${CLARITY_PROJECT_ID ? " Microsoft Clarity puede registrar interacciones en páginas públicas de marketing; está desactivado en las páginas de inicio de sesión y del espacio de trabajo." : ""} No enviamos datos empresariales, contenido de formularios ni identificadores publicitarios.`, accept: "Permitir Analytics", reject: "Solo necesarias", manage: "Opciones de privacidad", privacy: "Aviso de privacidad" },
} as const

function hasAnalyticsConsent() {
  try { return localStorage.getItem(CONSENT_KEY) === "granted" } catch { return false }
}

function safePostHogPath(path: string) {
  return POSTHOG_ALLOWED_PATHS.includes(path) ? path : ""
}

async function getPostHogClient(): Promise<PostHogBrowser | null> {
  if (!POSTHOG_PROJECT_TOKEN || POSTHOG_HOST !== "https://eu.i.posthog.com" || !hasAnalyticsConsent()) return null
  if (posthogClient) {
    posthogClient.opt_in_capturing()
    return posthogClient
  }
  if (!posthogInit) {
    posthogInit = import("posthog-js").then(({ default: posthog }) => {
      if (!hasAnalyticsConsent()) {
        posthogInit = null
        return null
      }
      posthog.init(POSTHOG_PROJECT_TOKEN, {
        api_host: POSTHOG_HOST,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_product_tours: true,
        capture_exceptions: false,
        capture_performance: false,
        enable_recording_console_log: false,
        disableDeviceModel: true,
        person_profiles: "never",
        get_current_url: () => {
          const path = safePostHogPath(window.location.pathname)
          return `${window.location.origin}${path || "/"}`
        },
        before_send: event => {
          if (!POSTHOG_EVENTS.has(event.event)) return null
          const path = safePostHogPath(String(event.properties.page_path || event.properties.$pathname || window.location.pathname))
          if (!path) return null
          const source = event.properties
          const properties: Record<string, string | number | boolean | null | undefined> = {}
          for (const key of ["token", "distinct_id", "$session_id", "$window_id", "$lib", "$lib_version"]) {
            const value = source[key]
            if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") properties[key] = value
          }
          properties.$current_url = `${window.location.origin}${path}`
          properties.$pathname = path
          properties.$host = window.location.host
          properties.$title = "HEGEVA AI"
          properties.page_path = path
          return { ...event, properties, $set: undefined, $set_once: undefined, $unset: undefined }
        },
      })
      posthogClient = posthog
      return posthog
    }).catch(() => {
      posthogInit = null
      return null
    })
  }
  return posthogInit
}

function capturePostHogEvent(event: string, path: string) {
  const safePath = safePostHogPath(path)
  if (!safePath || !POSTHOG_EVENTS.has(event)) return
  void getPostHogClient().then(posthog => {
    if (!posthog || !hasAnalyticsConsent()) return
    posthog.capture(event, { page_path: safePath })
  })
}

function queueConsentDefault() {
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments) }
  if (window.__hegevaConsentDefaulted) return
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  })
  window.__hegevaConsentDefaulted = true
}

function enableAnalytics(pageReferrer = analyticsReferrerOrigin(document.referrer, window.location.origin)) {
  if (!MEASUREMENT_ID) return
  queueConsentDefault()
  window.gtag?.("consent", "update", { analytics_storage: "granted" })
  window.gtag?.("js", new Date())
  window.gtag?.("config", MEASUREMENT_ID, {
    send_page_view: false,
    page_location: analyticsPageLocation(window.location.pathname),
    page_title: "HEGEVA AI",
    page_referrer: pageReferrer,
    ...campaignAttribution(),
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(ANALYTICS_DEBUG_MODE ? { debug_mode: true } : {}),
  })
  if (!document.getElementById("hegeva-google-analytics")) {
    const script = document.createElement("script")
    script.id = "hegeva-google-analytics"
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
    document.head.appendChild(script)
  }
  if (CLARITY_PROJECT_ID) {
    if (!CLARITY_PUBLIC_PATHS.includes(window.location.pathname)) {
      window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" })
      return
    }
    window.clarity = window.clarity || function clarity(...args: unknown[]) {
      (window.clarity as unknown as { q?: unknown[] }).q = (window.clarity as unknown as { q?: unknown[] }).q || []
      ;(window.clarity as unknown as { q: unknown[] }).q.push(args)
    }
    window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" })
    if (!document.getElementById("hegeva-microsoft-clarity")) {
      const script = document.createElement("script")
      script.id = "hegeva-microsoft-clarity"
      script.async = true
      script.src = `https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_PROJECT_ID)}`
      document.head.appendChild(script)
    }
  }
}

export function AnalyticsConsent() {
  const { locale } = useI18n()
  const text = copy[locale]
  const [consent, setConsent] = useState<Consent>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const sent = useRef(new Set<string>())
  const lastPageView = useRef<string | null>(null)
  const firstPageReferrerSent = useRef(false)
  const currentPageReferrer = useRef("")

  useEffect(() => {
    queueConsentDefault()
    const saved = localStorage.getItem(CONSENT_KEY)
    if (saved === "granted") { setConsent("granted"); enableAnalytics() }
    else if (saved === "denied") setConsent("denied")
    else setOpen(true)
  }, [])

  useEffect(() => {
    const receive = (event: Event) => {
      if (!hasAnalyticsConsent()) return
      const detail = (event as CustomEvent<{ event?: string; path?: string; params?: Record<string, string | number | boolean> }>).detail
      const eventName = detail?.event
      if (!detail || !eventName || !["landing_page_view", "registration_start", "registration_submitted", "registration_completed", "email_verified", "get_started_entry", "get_started_viewed", "first_customer_created", "first_quote_created", "first_invoice_created", "first_core_priority_seen", "pricing_view", "checkout_started", "activation_completed", "primary_cta_click", "subscription_success", "demo_entry_click", "demo_workspace_view", "demo_business_switch", "demo_signup_click", "challenge_view", "challenge_start", "business_type_selected", "demo_loaded", "demo_analysis_complete", "priority_viewed", "prepare_action_click", "prepared_action_complete", "challenge_complete", "business_score_view", "try_my_business_click", "own_business_start", "own_business_result", "share_click", "free_tool_use", "free_tool_cta_click", "referral_visit", "referral_signup", "referral_link_copy", "referral_paid_qualified", "referral_reward_reviewed"].includes(eventName)) return
      const activationPaths = ["/get-started", "/business/launch", "/business/customers", "/business/invoices", "/command-center", "/pricing", "/account", "/demo", "/challenge"]
      const verifiedEmail = eventName === "email_verified" && detail.path === "/email-verification"
      if (!detail.path || (!verifiedEmail && !PUBLIC_ANALYTICS_PATHS.includes(detail.path) && !activationPaths.includes(detail.path))) return
      const key = `${detail.event}:${detail.path}`
      const repeatable = detail.event === "primary_cta_click" || detail.event === "demo_business_switch" || detail.event === "business_type_selected" || detail.event === "referral_reward_reviewed"
      if (!repeatable && sent.current.has(key)) return
      if (!repeatable) sent.current.add(key)
      const rewardParams = detail.event === "referral_reward_reviewed" && ["approved", "rejected"].includes(String(detail.params?.outcome || "")) && ["approved", "rejected"].includes(String(detail.params?.status || "")) && detail.params?.methodologyVersion === "referral-reward-review-v1"
        ? { outcome: detail.params.outcome, status: detail.params.status, methodologyVersion: "referral-reward-review-v1" }
        : ["referral_link_copy", "referral_paid_qualified"].includes(detail.event || "") ? {} : detail.params || {}
      const analyticsParams = detail.event === "referral_reward_reviewed" ? rewardParams : { page_path: detail.path, page_location: analyticsPageLocation(detail.path), page_title: "HEGEVA AI", page_referrer: currentPageReferrer.current, ...campaignAttribution(), ...rewardParams, ...(ANALYTICS_DEBUG_MODE ? { debug_mode: true } : {}) }
      if (verifiedEmail) analyticsParams.page_location = `${window.location.origin}/email-verification`
      window.gtag?.("event", detail.event, analyticsParams)
      capturePostHogEvent(eventName, detail.path)
    }
    window.addEventListener("hegeva:analytics-event", receive)
    return () => window.removeEventListener("hegeva:analytics-event", receive)
  }, [])

  useEffect(() => {
    if (consent !== "granted") return
    // Keep the standard GA4 page_view in the same consented lifecycle that emits
    // the proven acquisition events. This avoids a first-consent effect race.
    const pageReferrer = firstPageReferrerSent.current
      ? ""
      : analyticsReferrerOrigin(document.referrer, window.location.origin)
    currentPageReferrer.current = pageReferrer
    enableAnalytics(pageReferrer)
    if (PUBLIC_ANALYTICS_PATHS.includes(pathname) && lastPageView.current !== pathname) {
      lastPageView.current = pathname
      firstPageReferrerSent.current = true
      window.gtag?.("event", "page_view", {
        page_path: pathname,
        page_location: analyticsPageLocation(pathname),
        page_title: "HEGEVA AI",
        page_referrer: pageReferrer,
        ...campaignAttribution(),
        ...(ANALYTICS_DEBUG_MODE ? { debug_mode: true } : {}),
      })
      capturePostHogEvent("$pageview", pathname)
    }
    // Native static-page navigation replaces dataLayer. Consume the consented CTA
    // on its destination, once, rather than dispatching from an unloading document.
    try {
      const pending = JSON.parse(sessionStorage.getItem(PENDING_CTA_KEY) || "null")
      if (pending && pending.destination === pathname) {
        sessionStorage.removeItem(PENDING_CTA_KEY)
        const age = Date.now() - pending.createdAt
        if (PUBLIC_ANALYTICS_PATHS.includes(pending.path) && age >= 0 && age < 60000) {
          window.dispatchEvent(new CustomEvent("hegeva:analytics-event", { detail: { event: "primary_cta_click", path: pending.path, params: { destination: pending.destination, cta: pending.cta || "unspecified" } } }))
        }
      }
    } catch { /* Storage must never prevent navigation or signup. */ }
    const landingPaths = ["/", "/ai-for-small-business", "/ai-business-assistant", "/quote-and-invoice-software", "/ai-for-trades", "/ai-for-electricians", "/for-electricians", "/for-builders", "/for-plumbers", "/for-cleaners", "/for-property-maintenance", "/for-consultants", "/free-tools"]
    const registering = pathname === "/login" && Boolean(document.querySelector('[data-registration-active="true"]'))
    const event = landingPaths.includes(pathname) ? "landing_page_view" : pathname === "/pricing" ? "pricing_view" : registering ? "registration_start" : null
    if (event) window.dispatchEvent(new CustomEvent("hegeva:analytics-event", { detail: { event, path: pathname } }))
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-acquisition-event='primary_cta_click']") : null
      if (!target || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || target.target === "_blank" || target.hasAttribute("download")) return
      const destination = new URL(target.href)
      if (destination.origin !== window.location.origin || !PUBLIC_ANALYTICS_PATHS.includes(destination.pathname) || !PUBLIC_ANALYTICS_PATHS.includes(pathname)) return
      try {
        sessionStorage.setItem(PENDING_CTA_KEY, JSON.stringify({path:pathname,destination:destination.pathname,cta:target.dataset.acquisitionCta || "unspecified",createdAt:Date.now()}))
      } catch {
        // Best-effort only when storage is blocked; never delay the customer's navigation.
        window.dispatchEvent(new CustomEvent("hegeva:analytics-event", { detail: { event: "primary_cta_click", path: pathname } }))
      }
    }
    document.addEventListener("click", click, true)
    return () => document.removeEventListener("click", click, true)
  }, [consent, pathname])

  useEffect(() => {
    if (consent !== "granted" || pathname !== "/challenge") return
    const referral = captureReferralAttribution()
    if (!referral?.fresh) return
    window.dispatchEvent(new CustomEvent("hegeva:analytics-event", {
      detail: { event: "referral_visit", path: "/challenge" },
    }))
  }, [consent, pathname])

  const choose = (next: Exclude<Consent, null>) => {
    localStorage.setItem(CONSENT_KEY, next)
    setConsent(next)
    setOpen(false)
    if (next === "granted") enableAnalytics()
    else {
      sessionStorage.removeItem("hegeva:campaign:v1")
      sessionStorage.removeItem(PENDING_CTA_KEY)
      clearReferralAttribution()
      window.gtag?.("consent", "update", { analytics_storage: "denied" })
      window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" })
      posthogClient?.opt_out_capturing()
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
