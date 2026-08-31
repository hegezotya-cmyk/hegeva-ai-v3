import assert from "node:assert/strict"
import fs from "node:fs"
import { isX30CanaryOwner } from "../../src/x30-generation.js"
import { invokeX30Provider, X30_PROVIDER_MODEL, X30_PROVIDER_MAX_TOKENS, X30_PROVIDER_TIMEOUT_MS } from "../../src/x30-provider.js"

const root = new URL("../", import.meta.url)
const index = fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
const provider = fs.readFileSync(new URL("../../src/x30-provider.js", import.meta.url), "utf8")
const generation = fs.readFileSync(new URL("../../src/x30-generation.js", import.meta.url), "utf8")
const page = fs.readFileSync(new URL("app/app-studio/x30-alpha/page.tsx", root), "utf8")
const route = index.slice(index.indexOf('url.pathname === "/api/x30/generate"'))
assert(route.includes("isX30CanaryOwner") && route.indexOf("isX30CanaryOwner") < route.indexOf("startX30Generation"), "canary must precede reservation")
assert(route.indexOf("startX30Generation") < route.indexOf("invokeX30Provider"), "reservation must precede provider")
assert(generation.includes('env?.X30_GENERATION_ENABLED === "enabled"'), "kill switch must require exact enabled value")
assert.equal(isX30CanaryOwner({ email: " Owner@Example.test " }, { X30_CANARY_EMAIL: "owner@example.test" }), true)
assert.equal(isX30CanaryOwner({ email: "other@example.test" }, { X30_CANARY_EMAIL: "owner@example.test" }), false)
assert.equal(isX30CanaryOwner({ email: "owner@example.test" }, { ADMIN_EMAIL: "owner@example.test" }), false)
assert.equal(isX30CanaryOwner({ email: "owner@example.test" }, { X30_CANARY_EMAIL: "" }), false)
assert.equal(isX30CanaryOwner({ email: "owner@example.test" }, { X30_CANARY_EMAIL: "not-an-email" }), false)
assert.equal(isX30CanaryOwner({ email: "owner@example.test" }, {}), false)
assert.equal(X30_PROVIDER_MODEL, "@cf/meta/llama-3.1-8b-instruct-fast")
assert.equal(X30_PROVIDER_MAX_TOKENS, 1200)
assert.equal(X30_PROVIDER_TIMEOUT_MS, 20_000)
assert(provider.includes("temperature: 0.1") && provider.includes("stream: false"), "provider controls must be fixed")
assert(provider.includes("response_format") && provider.includes("json_schema"), "documented structured JSON mode must be requested")
for (const reason of ["provider_failure", "provider_timeout", "missing_response", "malformed_response", "invalid_provider_decision", "invalid_result", "invalid_spec"]) assert(provider.includes(reason), `stable failure category missing: ${reason}`)
assert(!provider.includes("console.") && !provider.includes("prompt") && !provider.includes("email"), "provider path must not log sensitive data")
assert(!provider.includes("retry") && !provider.includes("repair") && !provider.includes("fetch("), "no retry, repair or fetch path")
assert(!provider.includes("dangerouslySetInnerHTML") && !provider.includes("new Function") && !provider.includes("dynamic import"), "no executable output path")
assert(!page.includes("/api/x30/generate") && !page.includes("fetch("), "frontend must not invoke the provider in Phase C")
assert(generation.includes("X30_CANARY_EMAIL") && !generation.includes("ADMIN_EMAIL"), "X30 canary must use its dedicated secret")

const operationId = "00000000-0000-4000-8000-000000000001"
const brief = { domain: "professional-services", targetUsers: "bounded-user-summary", primaryGoal: "bounded-goal-summary", requiredPages: ["Overview"], requiredCapabilities: ["records"], visualDirection: "professional", language: "en", dataSensitivity: "internal", deploymentIntent: "preview-only" }
let calls = 0
let captured
const decisions = ["professional", "ledger", "hospitality", "studio", "editorial", "technical"]
const success = await invokeX30Provider({ AI: { async run(...args) { calls += 1; captured = args; return { response: { visualDirection: "professional", density: "balanced", accent: "violet", emphasis: ["records", "search"] } } } } }, { brief, operationId })
assert.equal(success.ok, true)
assert.equal(calls, 1)
assert.equal(captured[0], X30_PROVIDER_MODEL)
assert.equal(captured[1].temperature, 0.1)
assert.equal(captured[1].max_tokens, 1200)
assert.equal(captured[1].stream, false)
assert.equal(captured[1].response_format.type, "json_schema")
assert(!captured[1].messages[1].content.includes("targetUsers") || captured[1].messages[1].content.includes("bounded-user-summary"))
assert(!captured[1].messages[1].content.includes("private goal text") && captured[1].messages[1].content.includes("bounded-goal-summary") && !captured[1].messages[1].content.includes("projectName"), "raw brief values must not reach provider")

for (const visualDirection of decisions) {
  const result = await invokeX30Provider({ AI: { async run() { return { response: { visualDirection, density: "balanced", accent: "cyan", emphasis: ["records"] } } } } }, { brief, operationId })
  assert.equal(result.ok, true, `allowlisted decision ${visualDirection} must construct a valid result`)
}

let malformedCalls = 0
const malformed = await invokeX30Provider({ AI: { async run() { malformedCalls += 1; return { response: "not-json" } } } }, { brief, operationId })
assert.equal(malformed.ok, false)
assert.equal(malformed.reason, "malformed_response")
assert.equal(malformedCalls, 1)
assert.equal((await invokeX30Provider({ AI: { async run() { return {} } } }, { brief, operationId })).reason, "missing_response")
assert.equal((await invokeX30Provider({ AI: { async run() { return { response: { visualDirection: "unsafe", density: "balanced", accent: "cyan", emphasis: [] } } } } }, { brief, operationId })).reason, "invalid_provider_decision")
assert.equal((await invokeX30Provider({ AI: { async run() { throw new Error("provider unavailable") } } }, { brief, operationId })).reason, "provider_failure")
const originalSetTimeout = globalThis.setTimeout
globalThis.setTimeout = (callback) => originalSetTimeout(callback, 0)
const timeout = await invokeX30Provider({ AI: { async run() { return new Promise(() => {}) } } }, { brief, operationId })
globalThis.setTimeout = originalSetTimeout
assert.equal(timeout.reason, "provider_timeout")

console.log("X30 provider canary audit passed: owner-only gate, disabled-by-default activation, one bounded attempt, fixed model/limits, strict result validation and fail-closed errors")
