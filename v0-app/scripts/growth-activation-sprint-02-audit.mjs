import fs from "node:fs"
import assert from "node:assert/strict"

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
const consent = read("components/analytics-consent.tsx")
const tracking = read("components/acquisition/acquisition-attribution.tsx")
const verification = read("components/auth/email-verification-panel.tsx")
const authCopy = read("lib/i18n/auth-copy.ts")
const core = read("components/command-center/core-decision-surface.tsx")

assert.match(tracking, /"email_verified"/, "tracking must allow the email_verified activation event")
assert.match(consent, /"email_verified"/, "consent allowlist must include email_verified")
assert.match(verification, /recordAnalyticsEvent\("email_verified"/, "verified state must emit email_verified")
assert.match(verification, /useRef/)
assert.match(verification, /analyticsRecorded\.current/)
assert.match(verification, /get-started/, "verified state must point to the first authenticated next step")
assert.match(verification, /nextStep/, "verification copy must explain the next step")
assert.match(core, /firstAction/, "empty Core state must expose one named first action")
assert.equal((core.match(/href="\/business\/customers"/g) || []).length, 1, "empty Core state must have one primary customer action")
assert.ok(!core.includes('href="/business/invoices"'), "empty Core state must not promote invoice before the first customer")
console.log("Growth Activation Sprint 02 audit: PASS")
