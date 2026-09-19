"use client"
import { useEffect } from "react"

export type AnalyticsEvent =
  | "landing_page_view"
  | "registration_start"
  | "pricing_view"
  | "demo_entry_click"
  | "demo_workspace_view"
  | "demo_business_switch"
  | "demo_signup_click"
  | "challenge_view"
  | "challenge_start"
  | "business_type_selected"
  | "demo_loaded"
  | "demo_analysis_complete"
  | "priority_viewed"
  | "prepare_action_click"
  | "prepared_action_complete"
  | "challenge_complete"
  | "business_score_view"
  | "try_my_business_click"
  | "own_business_start"
  | "own_business_result"
  | "share_click"
  | "free_tool_use"
  | "free_tool_cta_click"
  | "referral_visit"
  | "referral_signup"

export type AnalyticsParams = Record<string, string | number | boolean>

const CONSENT_KEY = "hegeva:analytics-consent:v1"
export const DEMO_REGISTRATION_KEY = "hegeva:demo-registration:v1"

export function recordAnalyticsEvent(event: AnalyticsEvent, path: string, params: AnalyticsParams = {}) {
  try {
    if (localStorage.getItem(CONSENT_KEY) !== "granted") return
    window.dispatchEvent(new CustomEvent("hegeva:analytics-event", { detail: { event, path, params } }))
  } catch {}
}

export function saveDemoRegistrationContext(businessType: string) {
  try {
    sessionStorage.setItem(DEMO_REGISTRATION_KEY, JSON.stringify({ origin: "demo", businessType, at: Date.now() }))
  } catch {}
}

export function readDemoRegistrationContext() {
  try {
    const raw = sessionStorage.getItem(DEMO_REGISTRATION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw)
    if (value?.origin !== "demo" || typeof value.businessType !== "string" || Date.now() - Number(value.at) > 30 * 60 * 1000) {
      sessionStorage.removeItem(DEMO_REGISTRATION_KEY)
      return null
    }
    return value as { origin: "demo"; businessType: string; at: number }
  } catch {
    return null
  }
}

export function AcquisitionAttribution({ path }: { path: string }) {
  useEffect(() => {
    recordAnalyticsEvent("landing_page_view", path)
    const click = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-acquisition-event]")
      const name = target?.dataset.acquisitionEvent as AnalyticsEvent | undefined
      if (name === "registration_start" || name === "pricing_view") recordAnalyticsEvent(name, path)
      if (name === "demo_entry_click") recordAnalyticsEvent(name, path, { source: "homepage", destination: "/demo" })
    }
    document.addEventListener("click", click)
    return () => document.removeEventListener("click", click)
  }, [path])
  return null
}
