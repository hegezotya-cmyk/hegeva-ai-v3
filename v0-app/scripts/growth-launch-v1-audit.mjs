import fs from "node:fs"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const expect = (condition, message) => { if (!condition) throw new Error(`Growth Launch audit failed: ${message}`) }

const requiredRoutes = [
  "app/challenge/page.tsx",
  "app/free-tools/page.tsx",
  "app/for-electricians/page.tsx",
  "app/for-builders/page.tsx",
  "app/for-plumbers/page.tsx",
  "app/for-cleaners/page.tsx",
  "app/for-property-maintenance/page.tsx",
  "app/for-consultants/page.tsx",
  "app/li/page.tsx", "app/fb/page.tsx", "app/ig/page.tsx", "app/tt/page.tsx", "app/reddit/page.tsx", "app/yt/page.tsx", "app/sc/page.tsx",
  "app/r/[code]/page.tsx",
]
for (const route of requiredRoutes) expect(fs.existsSync(new URL(`../${route}`, import.meta.url)), `missing route ${route}`)

const challenge = read("components/growth/sixty-second-challenge.tsx")
const onboarding = read("components/get-started/first-wow.tsx")
const freeTools = read("components/growth/free-tools-hub.tsx")
const referral = read("lib/conversion-tracking.ts")
const consent = read("components/analytics-consent.tsx")

for (const marker of ["challenge_start","challenge_complete","business_score_view","share_click"]) expect(challenge.includes(marker), `challenge marker missing: ${marker}`)
expect(onboarding.includes("Nothing is sent automatically.") || onboarding.includes("Semmi nem kerül automatikusan elküldésre."), "onboarding approval-first boundary missing")
expect(!freeTools.includes("fetch("), "free tools must remain zero-provider/browser-only")
expect(referral.includes("captureReferralAttribution") && referral.includes("clearReferralAttribution"), "referral attribution helpers missing")
for (const event of ["referral_visit","referral_signup","free_tool_use","free_tool_cta_click","share_click","own_business_start","own_business_result"]) expect(consent.includes(event), `analytics allowlist missing: ${event}`)

console.log("HEGEVA Growth Launch summary audit PASS")
