"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const IS_STAGING = process.env.NEXT_PUBLIC_APP_ENV === "staging"
const PROJECT_KEY = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_KEY || ""
const CONSENT_KEY = "hegeva:analytics-consent:v1"
const PAGE_PATHS = new Set([
  "/", "/ai-for-small-business", "/ai-business-assistant",
  "/quote-and-invoice-software", "/ai-for-trades", "/ai-for-electricians",
  "/for-electricians", "/for-builders", "/for-plumbers", "/for-cleaners",
  "/for-property-maintenance", "/for-consultants", "/free-tools",
  "/get-started", "/business/launch", "/business/customers",
  "/business/invoices", "/command-center", "/pricing", "/account",
  "/demo", "/challenge", "/login", "/email-verification",
])
const ALLOWED_EVENTS = new Set([
  "landing_page_view", "registration_start", "registration_submitted",
  "registration_completed", "email_verified", "get_started_entry",
  "get_started_viewed", "first_customer_created", "first_quote_created",
  "first_invoice_created", "pricing_view", "checkout_started",
  "activation_completed", "primary_cta_click", "subscription_success",
])

type PostHogClient = {
  init: (key: string, options: Record<string, unknown>) => void
  capture: (event: string, properties?: Record<string, unknown>) => void
  optOutCapturing: () => void
}
type PostHogQueue = PostHogClient[] & { _i?: unknown[]; __SV?: number }
declare global {
  interface Window {
    posthog?: PostHogClient
    __hegevaPosthogReady?: boolean
    __hegevaPosthogLoading?: boolean
  }
}

function startPostHog(path: string) {
  if (!IS_STAGING || !PROJECT_KEY || window.__hegevaPosthogReady || window.__hegevaPosthogLoading) return
  window.__hegevaPosthogLoading = true
  const queue = (window.posthog || []) as unknown as PostHogQueue
  queue._i = queue._i || []
  queue.__SV = 1
  queue.init = (key, options) => { queue._i?.push([key, options]) }
  window.posthog = queue as unknown as PostHogClient

  const script = document.createElement("script")
  script.id = "hegeva-posthog-staging-sdk"
  script.async = true
  script.crossOrigin = "anonymous"
  script.src = "https://eu-assets.i.posthog.com/static/array.js"
  script.onload = () => {
    const client = window.posthog
    if (!client) return
    client.init(PROJECT_KEY, {
      api_host: "https://eu.i.posthog.com",
      ui_host: "https://eu.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_persistence: true,
      person_profiles: "identified_only",
    })
    window.__hegevaPosthogReady = true
    if (PAGE_PATHS.has(path)) client.capture("$pageview", { page_path: path })
  }
  script.onerror = () => { window.__hegevaPosthogLoading = false }
  document.head.appendChild(script)
}

export function PostHogStagingAnalytics() {
  const pathname = usePathname()
  useEffect(() => {
    if (!IS_STAGING || !PROJECT_KEY) return
    const consented = () => localStorage.getItem(CONSENT_KEY) === "granted"
    const onConsent = (event: Event) => {
      const consent = (event as CustomEvent<{ consent?: string }>).detail?.consent
      if (consent === "granted") startPostHog(window.location.pathname)
      if (consent === "denied") window.posthog?.optOutCapturing()
    }
    if (consented()) startPostHog(pathname)
    window.addEventListener("hegeva:analytics-consent", onConsent)
    const onAnalyticsEvent = (event: Event) => {
      const client = window.posthog
      if (!consented() || !window.__hegevaPosthogReady || !client) return
      const detail = (event as CustomEvent<{ event?: string; path?: string }>).detail
      if (!detail?.event || !ALLOWED_EVENTS.has(detail.event)) return
      const path = (detail.path || "").split("?")[0]
      if (!PAGE_PATHS.has(path)) return
      client.capture(detail.event, { page_path: path })
    }
    window.addEventListener("hegeva:analytics-event", onAnalyticsEvent)
    return () => {
      window.removeEventListener("hegeva:analytics-consent", onConsent)
      window.removeEventListener("hegeva:analytics-event", onAnalyticsEvent)
    }
  }, [pathname])
  useEffect(() => {
    if (!IS_STAGING || !PROJECT_KEY || localStorage.getItem(CONSENT_KEY) !== "granted") return
    if (window.__hegevaPosthogReady && PAGE_PATHS.has(pathname)) {
      window.posthog?.capture("$pageview", { page_path: pathname })
    } else {
      startPostHog(pathname)
    }
  }, [pathname])
  return null
}
