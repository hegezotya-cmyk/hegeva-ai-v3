import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { invokeWorkersAiText, runWorkersAiOperation } from "../../src/cloudflare-ai-provider.js"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDir, "..")
const root = resolve(appRoot, "..")
const source = readFileSync(join(root, "src/index.js"), "utf8")
const assert = (value, message) => { if (!value) throw new Error(message) }
const route = source.slice(source.indexOf('url.pathname === "/api/ai-bot/execute"'), source.indexOf('url.pathname === "/api/x30/generate"'))
for (const token of ["loadCanonicalAIBotProfile", "parseProviderFlags", "admitAIBotCanary", "invokeWorkersAiText", "finishAIBotOperation", "reservationId", "status: provider.ok ? \"succeeded\" : \"failed\""]) assert(route.includes(token), `runtime lifecycle contract missing ${token}`)
assert(route.indexOf("admitAIBotCanary") < route.indexOf("invokeWorkersAiText"), "provider precedes admission")
assert(route.includes("flags.canaryEnabled") && source.includes("parseProviderFlags"), "canary flag gate missing")
assert(!route.includes("retry") && !route.includes("stream: true") && !route.includes("paid fallback"), "unsafe retry/stream/fallback path")
const providerSource = readFileSync(join(root, "src", "cloudflare-ai-provider.js"), "utf8")
assert(providerSource.includes("Promise.race([providerPromise, timeoutPromise])") && providerSource.includes("timeoutPromise"), "provider timeout must bound hung AI bindings")

let providerCalls = 0; let usage = 0; let financial = 0; let released = 0; let finalized = 0
const base = { authenticated: true, workspaceId: "workspace" }
const gates = { featureEnabled: true, providerAvailable: true, globalKillSwitch: false, rateAllowed: true, quotaAllowed: true, prepaidAllowed: true }
const run = (invoke) => runWorkersAiOperation({ context: base, gates, reserveUsage: async () => { usage++; return { reserved: true } }, reserveFinancial: async () => { financial++; return { reserved: true } }, releaseUsage: async () => { usage-- }, releaseFinancial: async () => { released++ }, finalizeUsage: async () => {}, finalizeFinancial: async () => { finalized++ }, invoke })
let result = await run(async () => { providerCalls++; return { response: "verified" } })
assert(result.ok && providerCalls === 1 && financial === 1 && finalized === 1, "success lifecycle failed")
result = await run(async () => { providerCalls++; throw new Error("provider failure") })
assert(!result.ok && providerCalls === 2 && usage === 1 && released === 1, "failure reconciliation failed")
const before = providerCalls
result = await runWorkersAiOperation({ context: base, gates: { ...gates, quotaAllowed: false }, reserveUsage: async () => { throw new Error("must not reserve") }, reserveFinancial: async () => { throw new Error("must not reserve") }, invoke: async () => { providerCalls++; throw new Error("must not invoke") } })
assert(!result.ok && result.reason === "quota-exhausted" && providerCalls === before, "duplicate/ceiling path invoked provider")
result = await run(async () => { throw new DOMException("timeout", "AbortError") })
assert(result.reason === "timeout" && released === 2, "timeout reconciliation failed")
result = await run(async () => { providerCalls++; return { response: "bounded" } })
assert(result.ok, "bounded result failed")
const blocked = await runWorkersAiOperation({ context: { authenticated: false, workspaceId: "workspace" }, gates, reserveUsage: async () => { throw new Error("must not reserve") }, reserveFinancial: async () => { throw new Error("must not reserve") }, invoke: async () => { throw new Error("must not invoke") } })
assert(!blocked.ok && blocked.reason === "authentication-required", "authentication fail-open")
const disabled = await runWorkersAiOperation({ context: base, gates: { ...gates, globalKillSwitch: true }, reserveUsage: async () => { throw new Error("must not reserve") }, reserveFinancial: async () => { throw new Error("must not reserve") }, invoke: async () => { throw new Error("must not invoke") } })
assert(!disabled.ok && disabled.reason === "provider-disabled", "kill switch fail-open")
const providerEnv = { AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI_BOT_CANARY_ENABLED: "disabled", AI_PROVIDER_MODEL: "@cf/meta/llama-3.1-8b-instruct-fast", AI_TIMEOUT_MS: "1", AI_MAX_OUTPUT_TOKENS: "100", AI_MAX_INPUT_TOKENS: "200", AI_DAILY_REQUEST_CEILING: "1", AI_PER_USER_CEILING: "1", AI_PER_WORKSPACE_CEILING: "1", AI_CONCURRENCY_CEILING: "1", AI_DOCUMENTED_DAILY_NEURON_ALLOCATION: "10000", AI_DAILY_NEURON_CEILING: "7000" }
const projection = { operation: "ai-bot", locale: "en", prompt: "bounded canary probe" }
let calls = 0
const success = await invokeWorkersAiText({ ...providerEnv, AI: { async run() { calls++; return { response: "verified" } } } }, projection)
assert(success.ok && calls === 1, "fake provider success contract failed")
const malformed = await invokeWorkersAiText({ ...providerEnv, AI: { async run() { calls++; return { output: "not accepted" } } } }, projection)
assert(!malformed.ok && malformed.reason === "missing-response" && calls === 2, "malformed provider response must fail closed")
const failed = await invokeWorkersAiText({ ...providerEnv, AI: { async run() { calls++; throw new Error("provider failure") } } }, projection)
assert(!failed.ok && failed.reason === "provider-failure" && calls === 3, "provider exception must reconcile as failure")
const timed = await invokeWorkersAiText({ ...providerEnv, AI: { async run() { calls++; return new Promise(() => {}) } } }, projection)
assert(!timed.ok && timed.reason === "timeout" && calls === 4, "hung provider must be bounded by timeout")
let finalizeFailureReleased = 0
const finalizedWithFailure = await runWorkersAiOperation({ context: base, gates, reserveUsage: async () => ({ reserved: true }), reserveFinancial: async () => ({ reserved: true }), releaseUsage: async () => {}, releaseFinancial: async () => { finalizeFailureReleased++ }, finalizeUsage: async () => { throw new Error("finalization unavailable") }, finalizeFinancial: async () => {}, invoke: async () => ({ response: "verified" }) })
assert(!finalizedWithFailure.ok && finalizeFailureReleased === 1, "finalization failure must enter reconciliation path")
console.log("AI canary runtime lifecycle audit passed: admission ordering, single provider attempt, success finalization, failure/timeout reconciliation, authentication and kill-switch fail-closed behavior")
