// Only public campaign labels, never arbitrary URL values or workspace identifiers.
const allowed = {
  utm_source: ["facebook", "instagram", "tiktok", "linkedin", "reddit", "youtube", "snapchat", "chatgpt", "share"],
  utm_medium: ["social", "paid_social", "organic_social", "organic", "referral"],
  utm_campaign: ["less_admin", "grow_business", "hegeva_launch", "hegeva_growth_2026"],
  utm_content: ["video_1", "video_2", "video_3", "text_post_1", "challenge_share", "v2_challenge", "v2_consultants", "v2_free_tools", "v2_electricians", "v2_builders", "v2_plumbers", "v2_cleaners", "v2_property"],
} as const
const campaignKey = "hegeva:campaign:v1"
const referralKey = "hegeva:referral:v1"
const SAFE_REFERRAL = /^[A-Za-z0-9_-]{1,32}$/

export const PUBLIC_ANALYTICS_PATHS = ["/", "/login", "/pricing", "/account", "/demo", "/challenge", "/ai-for-small-business", "/ai-business-assistant", "/quote-and-invoice-software", "/ai-for-trades", "/ai-for-electricians", "/for-electricians", "/for-builders", "/for-plumbers", "/for-cleaners", "/for-property-maintenance", "/for-consultants", "/free-tools"]

export function analyticsPageLocation(path: string): string {
  return window.location.origin + (PUBLIC_ANALYTICS_PATHS.includes(path) ? path : "/")
}

export function campaignAttribution(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    if (localStorage.getItem("hegeva:analytics-consent:v1") !== "granted") return {}
    const params = new URLSearchParams(window.location.search)
    const saved = JSON.parse(sessionStorage.getItem(campaignKey) || "{}")
    const hasCampaign = Object.keys(allowed).some(key => params.has(key))
    const result: Record<string, string> = {}
    for (const [key, values] of Object.entries(allowed)) {
      const value = hasCampaign ? params.get(key) : saved?.[key]
      if (typeof value === "string" && (values as readonly string[]).includes(value)) result[key] = value
    }
    sessionStorage.setItem(campaignKey, JSON.stringify(result))
    const names: Record<string, string> = { utm_source: "campaign_source", utm_medium: "campaign_medium", utm_campaign: "campaign_name", utm_content: "campaign_content" }
    return Object.fromEntries(Object.entries(result).map(([key, value]) => [names[key], value]))
  } catch { return {} }
}

export function captureReferralAttribution() {
  if (typeof window === "undefined") return null
  try {
    if (localStorage.getItem("hegeva:analytics-consent:v1") !== "granted") return null
    const params = new URLSearchParams(window.location.search)
    const direct = params.get("ref") || ""
    if (SAFE_REFERRAL.test(direct)) {
      const value = { code: direct, at: Date.now() }
      sessionStorage.setItem(referralKey, JSON.stringify(value))
      void fetch("/api/referrals/touch", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: direct, consentState: localStorage.getItem("hegeva:analytics-consent:v1") === "granted" ? "granted" : "essential" }) }).catch(() => null)
      return { ...value, fresh: true as const }
    }
    const saved = JSON.parse(sessionStorage.getItem(referralKey) || "null")
    if (!saved || !SAFE_REFERRAL.test(saved.code || "")) return null
    const age = Date.now() - Number(saved.at || 0)
    if (age < 0 || age > 30 * 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(referralKey)
      return null
    }
    return { code: saved.code as string, at: Number(saved.at), fresh: false as const }
  } catch {
    return null
  }
}

export function clearReferralAttribution() {
  try { sessionStorage.removeItem(referralKey) } catch {}
}

export function trackRegistrationCompleted() {
  window.dispatchEvent(new CustomEvent("hegeva:analytics-event", {
    detail: { event: "registration_completed", path: "/login" },
  }))
}

import { activationStorageKey, type ActivationEvent } from "./activation-measurement"
export type { ActivationEvent } from "./activation-measurement"

export function trackActivationEvent(event: ActivationEvent, path: string, identity?: string | null) {
  if (typeof window === "undefined") return
  try {
    if (localStorage.getItem("hegeva:analytics-consent:v1") !== "granted") return
    const key = activationStorageKey(event, identity)
    if (!key) return
    // Browser-local dedup prevents repeat milestones in later sessions. Clearing
    // browser storage or using another device can still produce a new event.
    const persistentMilestones = new Set<ActivationEvent>(["first_customer_created", "first_quote_created", "first_invoice_created", "first_core_priority_seen", "activation_completed"])
    const storage = persistentMilestones.has(event) ? localStorage : sessionStorage
    if (storage.getItem(key)) return
    storage.setItem(key, "1")
    window.dispatchEvent(new CustomEvent("hegeva:analytics-event", { detail: { event, path } }))
  } catch {}
}

// A checkout return is not proof of payment. This is called only after the
// Account page has re-read a paid entitlement from the authenticated API.
// Keep the local marker deliberately free of customer, checkout and Stripe IDs.
export function trackSubscriptionSuccess(plan: string, period: string) {
  const key = `hegeva:subscription-success:v1:${plan}:${period || "current"}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
  } catch {
    // Without safe deduplication storage, prefer not to emit a conversion.
    return
  }
  window.dispatchEvent(new CustomEvent("hegeva:analytics-event", {
    detail: { event: "subscription_success", path: "/account" },
  }))
}
