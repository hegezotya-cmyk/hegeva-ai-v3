// Only public campaign labels, never arbitrary URL values or workspace identifiers.
const allowed = {
  utm_source: ["facebook", "instagram", "tiktok", "linkedin", "reddit"],
  utm_medium: ["social", "paid_social", "organic_social"],
  utm_campaign: ["less_admin", "grow_business", "hegeva_launch"],
  utm_content: ["video_1", "video_2"],
} as const
const campaignKey = "hegeva:campaign:v1"

export const PUBLIC_ANALYTICS_PATHS = ["/", "/login", "/pricing", "/account", "/ai-for-small-business", "/ai-business-assistant", "/quote-and-invoice-software", "/ai-for-trades", "/ai-for-electricians"]

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

export function trackRegistrationCompleted() {
  window.dispatchEvent(new CustomEvent("hegeva:analytics-event", {
    detail: { event: "registration_completed", path: "/login" },
  }))
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
