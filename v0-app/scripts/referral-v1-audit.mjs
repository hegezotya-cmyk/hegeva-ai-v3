import fs from "node:fs"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const route = read("app/r/[code]/page.tsx")
const tracking = read("lib/conversion-tracking.ts")
const attribution = read("components/acquisition/acquisition-attribution.tsx")
const consent = read("components/analytics-consent.tsx")
const auth = read("components/auth/auth-panel.tsx")

const expect = (condition, message) => {
  if (!condition) throw new Error(`Referral V1 audit failed: ${message}`)
}

expect(route.includes("SAFE_REFERRAL"), "referral code validation missing")
expect(route.includes("/challenge?ref=") && route.includes("encodeURIComponent(safe)"), "referral route redirect missing")
expect(tracking.includes("captureReferralAttribution"), "referral capture helper missing")
expect(tracking.includes("clearReferralAttribution"), "referral clear helper missing")
expect(tracking.includes("hegeva:analytics-consent:v1"), "referral storage must be consent-gated")
expect(attribution.includes('"referral_visit"') && attribution.includes('"referral_signup"'), "referral analytics types missing")
expect(consent.includes('"referral_visit"') && consent.includes('"referral_signup"'), "referral analytics allowlist missing")
expect(consent.includes("clearReferralAttribution()"), "analytics denial must clear referral context")
expect(auth.includes('"referral_signup"'), "successful referral registration event missing")
expect(auth.includes("clearReferralAttribution()"), "referral context must be one-shot after signup")
expect(!route.includes("email") && !tracking.includes("customerName"), "referral flow must not contain customer identity")
console.log("HEGEVA Referral V1 audit PASS")
