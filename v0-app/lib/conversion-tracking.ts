"use client"

export type ConversionEvent = "registration_submitted" | "subscription_success"
const CONSENT_KEY = "hegeva-analytics-consent"
const MEASUREMENT_ID = "G-TK99HP2BG7"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function analyticsAllowed(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(CONSENT_KEY) === "granted"
}

export function trackConversion(event: ConversionEvent): void {
  if (!analyticsAllowed() || typeof window.gtag !== "function") return
  window.gtag("event", event, { send_to: MEASUREMENT_ID })
}

export const ANALYTICS_CONSENT_KEY = CONSENT_KEY
export const GA4_MEASUREMENT_ID = MEASUREMENT_ID
