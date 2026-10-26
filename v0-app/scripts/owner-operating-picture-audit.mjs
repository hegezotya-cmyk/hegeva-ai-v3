import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
const component = readFileSync(new URL("../components/business/business-intelligence-center.tsx", import.meta.url), "utf8")
const selector = readFileSync(new URL("../lib/owner-operating-picture.ts", import.meta.url), "utf8")
assert.match(component, /selectOwnerOperatingPicture/)
assert.match(selector, /payment-followup/)
assert.match(selector, /quote-followup/)
assert.doesNotMatch(selector, /fetch\s*\(|POST|send-email|external-actions/)
console.log("Owner operating picture safety audit passed.")
