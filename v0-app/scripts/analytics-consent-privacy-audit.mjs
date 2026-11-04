import assert from "node:assert/strict"
import fs from "node:fs"

const source = fs.readFileSync(new URL("../components/analytics-consent.tsx", import.meta.url), "utf8")
assert.match(source, /analytics_storage: "denied",[\s\S]*?ad_storage: "denied",[\s\S]*?ad_user_data: "denied",[\s\S]*?ad_personalization: "denied"/, "consent defaults must deny analytics and advertising storage")
assert.match(source, /window\.gtag\?\.\("consent", "update", \{ analytics_storage: "granted" \}\)/, "analytics consent may enable only analytics storage")
assert.match(source, /window\.clarity\("consentv2", \{ ad_Storage: "denied", analytics_Storage: "granted" \}\)/, "Clarity advertising storage must remain denied on analytics-only consent")
assert.match(source, /window\.clarity\?\.\("consentv2", \{ ad_Storage: "denied", analytics_Storage: "denied" \}\)/, "Clarity must revoke both categories on rejection")
assert.doesNotMatch(source, /ad_Storage: "granted"/, "no path may enable advertising storage without separate consent")
// Consent must transition to granted before the page lifecycle initializes GA4.
// Otherwise initial load and button selection both call config twice.
assert.match(source, /if \(saved === "granted"\) setConsent\("granted"\)/, "stored consent updates state only")
assert.match(source, /if \(next === "denied"\) \{/, "selection never configures GA4 before consent state re-renders")
assert.doesNotMatch(source, /if \(saved === "granted"\) \{ setConsent\("granted"\); enableAnalytics\(\) \}/, "no duplicate config on reload")
assert.equal((source.match(/enableAnalytics\(pageReferrer\)/g) || []).length, 1, "one page lifecycle initializer")
console.log("Analytics-only consent privacy audit: PASS")
