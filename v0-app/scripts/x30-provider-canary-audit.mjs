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
assert.equal(isX30CanaryOwner({ email: " Owner@Example.test " }, { ADMIN_EMAIL: "owner@example.test" }), true)
assert.equal(isX30CanaryOwner({ email: "other@example.test" }, { ADMIN_EMAIL: "owner@example.test" }), false)
assert.equal(isX30CanaryOwner({ email: "owner@example.test" }, {}), false)
assert.equal(X30_PROVIDER_MODEL, "@cf/meta/llama-3.1-8b-instruct-fast")
assert.equal(X30_PROVIDER_MAX_TOKENS, 1200)
assert.equal(X30_PROVIDER_TIMEOUT_MS, 20_000)
assert(provider.includes("temperature: 0.1") && provider.includes("stream: false"), "provider controls must be fixed")
assert(!provider.includes("retry") && !provider.includes("repair") && !provider.includes("fetch("), "no retry, repair or fetch path")
assert(!provider.includes("dangerouslySetInnerHTML") && !provider.includes("new Function") && !provider.includes("dynamic import"), "no executable output path")
assert(!page.includes("/api/x30/generate") && !page.includes("fetch("), "frontend must not invoke the provider in Phase C")

const operationId = "00000000-0000-4000-8000-000000000001"
const brief = { domain: "professional-services", targetUsers: "bounded-user-summary", primaryGoal: "bounded-goal-summary", requiredPages: ["Overview"], requiredCapabilities: ["records"], visualDirection: "professional", language: "en", dataSensitivity: "internal", deploymentIntent: "preview-only" }
const spec = { version: "0.1", id: "safe-preview", name: "X30 Preview", direction: { industry: "Professional services", mood: "direct", density: "balanced", primaryWorkflow: "workflow", palette: "meadow", surface: "soft", typography: "confident", navigation: "workspace", mobilePriority: "responsive" }, nodes: [{ id: "brief-hero", type: "hero", props: { eyebrow: "Preview", title: "Workspace", description: "Safe preview" } }] }
let calls = 0
let captured
const success = await invokeX30Provider({ AI: { async run(...args) { calls += 1; captured = args; return { response: JSON.stringify({ schemaVersion: "0.1", kind: "x30-generation-result", status: "ready-for-review", spec, provenance: { source: "x30-ai", mode: "preview-only", scope: "authenticated" }, operation: { operationId, attemptNumber: 1 }, executionState: "not-started" }) } } } }, { brief, operationId })
assert.equal(success.ok, true)
assert.equal(calls, 1)
assert.equal(captured[0], X30_PROVIDER_MODEL)
assert.equal(captured[1].temperature, 0.1)
assert.equal(captured[1].max_tokens, 1200)
assert.equal(captured[1].stream, false)
assert(!captured[1].messages[1].content.includes("targetUsers") || captured[1].messages[1].content.includes("bounded-user-summary"))

let malformedCalls = 0
const malformed = await invokeX30Provider({ AI: { async run() { malformedCalls += 1; return { response: "<html>unsafe</html>" } } } }, { brief, operationId })
assert.equal(malformed.ok, false)
assert.equal(malformed.reason, "malformed_result")
assert.equal(malformedCalls, 1)

console.log("X30 provider canary audit passed: owner-only gate, disabled-by-default activation, one bounded attempt, fixed model/limits, strict result validation and fail-closed errors")
