// Drop known first-party legacy hosting from the external referrer field.
// This does not rewrite GA4 history, and does not discard real external referrals.
const PRODUCTION_HOSTS = new Set(["hegevaai.co.uk", "www.hegevaai.co.uk"])
const LEGACY_FIRST_PARTY_HOSTS = new Set(["shiny-stardust-e0dcb3.netlify.app"])

export function analyticsReferrerOrigin(referrer, currentOrigin) {
  try {
    const source = new URL(referrer)
    const current = new URL(currentOrigin)
    if (!["http:", "https:"].includes(source.protocol) || !["http:", "https:"].includes(current.protocol)) return ""
    if (source.origin === current.origin) return ""
    if (PRODUCTION_HOSTS.has(current.hostname) && LEGACY_FIRST_PARTY_HOSTS.has(source.hostname)) return ""
    return `${source.origin}/`
  } catch {
    return ""
  }
}
