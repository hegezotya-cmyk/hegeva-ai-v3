import fs from "node:fs"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const challenge = read("components/growth/sixty-second-challenge.tsx")
const attribution = read("components/acquisition/acquisition-attribution.tsx")
const consent = read("components/analytics-consent.tsx")
const tracking = read("lib/conversion-tracking.ts")

const expect = (condition, message) => {
  if (!condition) throw new Error(`Share V1 audit failed: ${message}`)
}

expect(challenge.includes("shareChallenge"), "share action missing")
expect(challenge.includes("navigator.share"), "native share path missing")
expect(challenge.includes("navigator.clipboard.writeText"), "copy-link fallback missing")
expect(challenge.includes("I tried the HEGEVA 60-Second Business Challenge"), "safe demo share copy missing")
expect(!challenge.includes("My HEGEVA Business Score:"), "demo score must not be represented as the visitor's own score")
expect(challenge.includes("utm_source=share") && challenge.includes("utm_content=challenge_share"), "share attribution link missing")
expect(!challenge.includes("Sarah Collins") || !challenge.match(/share(Text|Challenge)[\s\S]{0,300}Sarah Collins/), "customer data must not enter share payload")
expect(attribution.includes('"share_click"'), "share_click event type missing")
expect(consent.includes('"share_click"'), "share_click consent allowlist missing")
expect(tracking.includes('"share"') && tracking.includes('"challenge_share"'), "share UTM allowlist missing")
console.log("HEGEVA Share V1 audit PASS")
