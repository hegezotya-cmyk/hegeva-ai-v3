"use client"

import { useEffect } from "react"

const IS_STAGING = process.env.NEXT_PUBLIC_APP_ENV === "staging"
const PROJECT_KEY = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_KEY || ""
const CONSENT_KEY = "hegeva:analytics-consent:v1"
const ALLOWED_EVENTS = new Set([
  "landing_page_view", "registration_start", "registration_submitted",
  "registration_completed", "email_verified", "get_started_entry",
  "get_started_viewed", "first_customer_created", "first_quote_created",
  "first_invoice_created", "pricing_view", "checkout_started",
  "activation_completed", "primary_cta_click", "subscription_success",
])
const ALLOWED_PATHS = new Set([
  "/", "/ai-for-small-business", "/ai-business-assistant",
  "/quote-and-invoice-software", "/ai-for-trades", "/ai-for-electricians",
  "/for-electricians", "/for-builders", "/for-plumbers", "/for-cleaners",
  "/for-property-maintenance", "/for-consultants", "/free-tools",
  "/get-started", "/business/launch", "/business/customers",
  "/business/invoices", "/command-center", "/pricing", "/account",
  "/demo", "/challenge", "/login", "/email-verification",
])

type PostHogClient = {
  init: (key: string, options: Record<string, unknown>) => void
  capture: (event: string, properties?: Record<string, unknown>) => void
  optOutCapturing: () => void
}
declare global {
  interface Window { posthog?: PostHogClient; __hegevaPosthogReady?: boolean }
}

function startPostHog() {
  if (!IS_STAGING || !PROJECT_KEY || window.__hegevaPosthogReady || window.posthog) return
  const script = document.createElement("script")
  script.id = "hegeva-posthog-staging-sdk"
  script.async = true
  script.src = "https://eu.posthog.com/static/array.js"
  script.onload = () => {
    if (!window.posthog || window.__hegevaPosthogReady) return
    window.posthog.init(PROJECT_KEY, {
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
    window.posthog.capture("$pageview", { page_path: window.location.pathname })
  }
  document.head.appendChild(script)
}

export function PostHogStagingAnalytics() {
  useEffect(() => {
    if (!IS_STAGING || !PROJECT_KEY) return
    const hasConsent = () => localStorage.getItem(CONSENT_KEY) === "granted"
    const onConsent = (event: Event) => {
      const consent = (event as CustomEvent<{ consent?: string }>).detail?.consent
      if (consent === "granted") startPostHog()
      if (consent === "denied") window.posthog?.optOutCapturing()
    }
    if (hasConsent()) startPostHog()
    window.addEventListener("hegeva:analytics-consent", onConsent)
    const onAnalyticsEvent = (event: Event) => {
      if (!hasConsent() || !window.__hegevaPosthogReady || !window.posthog) return
      const detail = (event as CustomEvent<{ event?: string; path?: string }>).detail
      if (!detail || !detail.event || !ALLOWED_EVENTS.has(detail.event)) return
      const path = (detail.path || "").split("?")[0]
      if (!ALLOWED_PATHS.has(path)) return
      window.posthog.capture(detail.event, { page_path: path })
    }
    window.addEventListener("hegeva:analytics-event", onAnalyticsEvent)
    return () => {
      window.removeEventListener("hegeva:analytics-consent", onConsent)
      window.removeEventListener("hegeva:analytics-event", onAnalyticsEvent)
    }
  }, [])
  return null
}
