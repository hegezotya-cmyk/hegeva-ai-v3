import assert from "node:assert/strict"
import fs from "node:fs"

const backend = fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
const admission = fs.readFileSync(new URL("../../src/ai-chat-admission.js", import.meta.url), "utf8")
const wow = fs.readFileSync(new URL("../components/app-studio/build-my-app-x20-studio-wow.tsx", import.meta.url), "utf8")
const repair = fs.readFileSync(new URL("../components/app-studio/x20-capability-auto-repair.tsx", import.meta.url), "utf8")

for (const event of [
  "x20_reservation_started", "x20_reservation_denied", "x20_reservation_failed",
  "x20_attempt_reserved", "x20_provider_started", "x20_provider_completed",
  "x20_provider_failed", "x20_attempt_completed", "x20_attempt_failed",
]) assert.match(`${backend}\n${admission}`, new RegExp(event))

assert.match(backend, /function logX20Lifecycle\(event, metadata = \{\}\)/)
assert.match(backend, /safeErrorName\(error\)/)
assert.match(admission, /x20_reservation_denied/)
assert.match(backend, /max_tokens: selectAiOutputTokens\(\{ isX20Action/)
assert.match(wow, /localStorage\.removeItem\(HTML_KEY\)/)
assert.match(wow, /localStorage\.setItem\(BUILD_INTENT_KEY, buildSessionId\)/)
assert.match(repair, /localStorage\.getItem\(BUILD_SESSION_KEY\) !== buildSessionId/)
assert.match(repair, /localStorage\.getItem\(BUILD_INTENT_KEY\) !== buildSessionId/)
assert.match(repair, /MAX_REPAIR_ATTEMPTS = 3/)

for (const source of [backend, admission]) {
  assert.doesNotMatch(source, /console\.(?:info|error)\([^\n]*(?:prompt|message|html|email|token|authorization|cookie|stack)/i)
}

console.log("X20 lifecycle observability audit passed: fail-closed admission, safe events and build-session repair isolation")
