import worker from "../../src/index.js"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDir, "..")
const repoRoot = resolve(appRoot, "..")
const source = readFileSync(join(repoRoot, "src", "index.js"), "utf8")
const providerSource = readFileSync(join(repoRoot, "src", "cloudflare-ai-provider.js"), "utf8")
const assert = (value, message) => { if (!value) throw new Error(message) }
const start = source.indexOf('url.pathname === "/api/ai-bot/canary-once"')
const end = source.indexOf('url.pathname === "/api/ai-bot/execute"')
assert(start >= 0 && end > start, "integrated canary route missing")
const route = source.slice(start, end)
for (const reason of ["authentication-required", "invalid-request", "owner-identity-mismatch", "profile-not-found", "profile-disabled", "profile-not-approved", "profile-approval-expired", "profile-approval-stale", "profile-actor-mismatch", "provider-disabled", "kill-switch-active", "canary-disabled", "financial-guard-disabled", "ai-binding-unavailable", "model-invalid", "allocation-invalid", "request-ceiling-invalid", "user-ceiling-invalid", "workspace-ceiling-invalid", "neuron-ceiling-invalid", "concurrency-invalid", "included-allowance-unavailable", "authorization-reservation-failed", "internal-unavailable"]) assert(source.includes(`"${reason}"`) || providerSource.includes(`"${reason}"`), `missing bounded reason ${reason}`)
assert(route.indexOf("getLoggedInUser") < route.indexOf("loadCanaryProfile") && route.indexOf("loadCanaryProfile") < route.indexOf("getWorkersAiCanaryConfig") && route.indexOf("admitAIBotCanary") < route.indexOf("invokeWorkersAiText"), "pre-authorization ordering changed")
assert(route.includes("Object.keys(body)") && route.includes('keys[0] !== "profileId"'), "request authority fields are not rejected")
assert(providerSource.includes("AI_PROVIDER_MODEL") && providerSource.includes("model-invalid"), "model validation boundary missing")
assert(route.includes("ai_provider_usage") && route.includes("prepaidReserved") && route.includes("included-allowance-unavailable"), "persisted included allowance check missing")
assert(!route.includes("response: provider.response") && !/console\.(log|info|error)[^\n]*(prompt|rawToken|provider\.response)/.test(route), "sensitive canary data exposed")
assert(route.includes("crypto.randomUUID()") && route.includes("sha256Hex(rawToken)") && route.includes("5 * 60 * 1000"), "internal one-use token boundary missing")
assert(route.includes("finishAIBotOperation") && route.includes("providerAttempted: true"), "terminal lifecycle boundary missing")
const control = readFileSync(join(appRoot, "components/app-studio/ai-bot-owner-approval-control.tsx"), "utf8")
assert(control.includes('fetch("/api/ai-bot/canary-once"') && /body:JSON\.stringify\(\{profileId:profile\.id\}\)/.test(control), "live control payload is not profile-only")
assert(["en:", "hu:", "de:", "fr:", "es:"].every((locale) => control.includes(locale)), "canary control localization missing")
assert(!control.includes("/api/ai-bot/execute") && !control.includes("X-HEGEVA-CANARY-TOKEN"), "client canary bypasses server boundary")

let providerCalls = 0
const env = { DB: { prepare() { return { bind() { return this }, async first() { return null }, async all() { return { results: [] } }, async run() { throw new Error("unexpected write") } } } }, AI: { async run() { providerCalls += 1; return { response: "should-not-run" } } }, ASSETS: { fetch() { return new Response("ok") } }, AI_PROVIDER_ENABLED: "disabled", AI_GLOBAL_KILL_SWITCH: "enabled", AI_BOT_CANARY_ENABLED: "disabled", FINANCIAL_GUARD_ENABLED: "disabled" }
const unauthenticated = await worker.fetch(new Request("https://example.test/api/ai-bot/canary-once", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profileId: "bot-test" }) }), env, {})
assert(unauthenticated.status === 401, "unauthenticated route did not reject")
assert(providerCalls === 0, "unauthenticated route called provider")
console.log("AI Bot integrated one-shot canary audit passed: real handler unauthenticated gate, bounded pre-authorization diagnostics, strict configuration and no provider call")
