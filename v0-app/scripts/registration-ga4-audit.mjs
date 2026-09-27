import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const auth = fs.readFileSync(path.join(root, "components", "auth", "auth-panel.tsx"), "utf8")
const tracking = fs.readFileSync(path.join(root, "lib", "conversion-tracking.ts"), "utf8")
const consent = fs.readFileSync(path.join(root, "components", "analytics-consent.tsx"), "utf8")

assert.match(auth, /registration_start/)
assert.match(auth, /signUp\.email/)
assert.match(auth, /trackRegistrationCompleted\(\)/)
assert.match(auth, /if \(result\.error\)[\s\S]*?setError\(c\.authFailed\)/)
assert.match(tracking, /event: "registration_completed"/)
assert.match(tracking, /hegeva:registration-completed:v1/)
assert.match(tracking, /analytics-consent:v1/)
assert.match(consent, /registration_completed/)
assert.doesNotMatch(auth, /trackRegistrationCompleted\(\)[\s\S]{0,80}signIn\.email/)
const registrationTracker = tracking.match(/export function trackRegistrationCompleted\(\)[\s\S]*?\n}\n/)?.[0] || ""
assert.doesNotMatch(registrationTracker, /email|userId|workspaceId|password|token|params/i)
console.log("REGISTRATION GA4 AUDIT PASSED")
