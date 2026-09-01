import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { runWorkersAiOperation } from "../../src/cloudflare-ai-provider.js"

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
console.log("AI canary runtime lifecycle audit passed: admission ordering, single provider attempt, success finalization, failure/timeout reconciliation, authentication and kill-switch fail-closed behavior")
