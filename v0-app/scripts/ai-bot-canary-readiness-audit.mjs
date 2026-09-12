import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const index = readFileSync(join(root, "..", "src", "index.js"), "utf8")
const control = readFileSync(join(root, "components/app-studio/ai-bot-owner-approval-control.tsx"), "utf8")
const assert = (ok, message) => { if (!ok) throw new Error(message) }
assert(index.includes('/api/ai-bot/canary-readiness'), "readiness route missing")
assert(index.includes('evaluateAIBotCanaryPreflight'), "shared preflight missing")
assert(index.includes('ready: true') && index.includes('reason: "ready"'), "ready response missing")
assert(index.indexOf('evaluateAIBotCanaryPreflight(env, request, user, body.profileId)') < index.indexOf('authorizationHash = await sha256Hex(rawToken)'), "readiness/preflight must precede authorization")
assert(!/canary-readiness[\s\S]{0,1200}env\.AI\.run/.test(index), "readiness must not invoke provider")
assert(control.includes('/api/ai-bot/canary-readiness') && control.includes('body:JSON.stringify({profileId:profile.id})'), "control must send only profileId")
assert(control.includes('Canary readiness check') || control.includes('Canary-készenléti ellenőrzés'), "localized readiness labels missing")
assert((control.match(/canary-readiness/g) || []).length === 1, "readiness control must not poll")
console.log("AI Bot canary readiness audit passed: shared read-only preflight, bounded reason response, no mutation/provider path")

const { createRequestHandler } = await import("../../src/index.js")
let mutations = 0
let providerCalls = 0
const actor = { id: "readiness-owner", email: "owner@example.test" }
const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(actor.id))
const actorHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
const profile = { id: "bot-readiness", enabled: true, approvalState: "owner-approved", executionState: "not-started", approvalVersion: 1, approvedAt: new Date().toISOString(), approvalExpiresAt: new Date(Date.now() + 60_000).toISOString(), approvedByActorHash: actorHash, approvalRevision: "r1" }
const db = { prepare() { return { bind() { return this }, async first() { return { data: JSON.stringify([profile]), updatedAt: "r1" } }, async all() { return { results: [] } }, async run() { mutations += 1; throw new Error("mutation forbidden in readiness") } } } }
const env = { DB: db, AI: { async run() { providerCalls += 1; return { response: "unexpected" } } }, AI_PROVIDER_ENABLED: "disabled", AI_GLOBAL_KILL_SWITCH: "enabled", AI_BOT_CANARY_ENABLED: "disabled", FINANCIAL_GUARD_ENABLED: "disabled", AI_BOT_CANARY_EMAIL: actor.email, AI_PROVIDER_MODEL: "@cf/meta/llama-3.1-8b-instruct-fast", AI_DOCUMENTED_DAILY_NEURON_ALLOCATION: "10000", AI_DAILY_NEURON_CEILING: "7000", AI_DAILY_REQUEST_CEILING: "1", AI_PER_USER_CEILING: "1", AI_PER_WORKSPACE_CEILING: "1", AI_CONCURRENCY_CEILING: "1", AI_MAX_INPUT_TOKENS: "200", AI_MAX_OUTPUT_TOKENS: "100", AI_TIMEOUT_MS: "10000" }
const handler = createRequestHandler({ getLoggedInUserFn: async () => actor })
const response = await handler.fetch(new Request("https://hegevaai.co.uk/api/ai-bot/canary-readiness", { method: "POST", headers: { cookie: "session=redacted", "content-type": "application/json" }, body: JSON.stringify({ profileId: profile.id }) }), env, {})
const result = await response.json()
assert(response.status === 503 && result.reason === "provider-disabled", "integrated disabled readiness reason")
assert(providerCalls === 0 && mutations === 0, "disabled readiness must not mutate or invoke provider")
console.log("Integrated readiness proof passed: provider-disabled => 503, zero mutations, zero provider calls")
const cases = [["kill-switch-active", { AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "enabled", AI_BOT_CANARY_ENABLED: "enabled", FINANCIAL_GUARD_ENABLED: "enabled" }], ["canary-disabled", { AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI_BOT_CANARY_ENABLED: "disabled", FINANCIAL_GUARD_ENABLED: "enabled" }], ["financial-guard-disabled", { AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI_BOT_CANARY_ENABLED: "enabled", FINANCIAL_GUARD_ENABLED: "disabled" }], ["model-invalid", { AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI_BOT_CANARY_ENABLED: "enabled", FINANCIAL_GUARD_ENABLED: "enabled", AI_PROVIDER_MODEL: "wrong-model" }], ["allocation-invalid", { AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI_BOT_CANARY_ENABLED: "enabled", FINANCIAL_GUARD_ENABLED: "enabled", AI_DOCUMENTED_DAILY_NEURON_ALLOCATION: "bad" }]]
for (const [reason, overrides] of cases) {
  const caseEnv = { ...env, ...overrides }
  const branchResponse = await handler.fetch(new Request("https://hegevaai.co.uk/api/ai-bot/canary-readiness", { method: "POST", headers: { cookie: "session=redacted", "content-type": "application/json" }, body: JSON.stringify({ profileId: profile.id }) }), caseEnv, {})
  const branchBody = await branchResponse.json()
  assert(branchResponse.status === 503 && branchBody.reason === reason, `integrated readiness ${reason}`)
  assert(providerCalls === 0 && mutations === 0, `readiness ${reason} must remain side-effect free`)
}
console.log(`Integrated readiness branches passed: ${cases.length + 1} bounded reasons, zero mutations, zero provider calls`)
const readyEnv = { ...env, AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI_BOT_CANARY_ENABLED: "enabled", FINANCIAL_GUARD_ENABLED: "enabled" }
const readyResponse = await handler.fetch(new Request("https://hegevaai.co.uk/api/ai-bot/canary-readiness", { method: "POST", headers: { cookie: "session=redacted", "content-type": "application/json" }, body: JSON.stringify({ profileId: profile.id }) }), readyEnv, {})
const readyBody = await readyResponse.json()
assert(readyResponse.status === 200 && readyBody.ready === true && readyBody.reason === "ready", "integrated ready response")
assert(providerCalls === 0 && mutations === 0, "ready readiness must remain side-effect free")
console.log("Integrated ready proof passed: 200 ready, zero mutations, zero provider calls")
