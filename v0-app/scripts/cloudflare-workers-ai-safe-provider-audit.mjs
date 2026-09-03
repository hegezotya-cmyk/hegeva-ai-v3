import { readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const scriptDir = dirname(fileURLToPath(import.meta.url)); const appRoot = resolve(scriptDir, ".."); const repositoryRoot = resolve(appRoot, ".."); const sourceRoot = join(repositoryRoot, "src"); const migrationsRoot = join(repositoryRoot, "migrations")
const source = await readFile(join(sourceRoot, "cloudflare-ai-provider.js"), "utf8")
const config = await readFile(join(appRoot, "lib/commercial-config.ts"), "utf8")
const assert = (value, message) => { if (!value) throw new Error(message) }
for (const token of ["WORKERS_AI_MODEL", "getWorkersAiConfig", "AI_PROVIDER_ENABLED", "AI_MAX_INPUT_TOKENS", "AI_MAX_OUTPUT_TOKENS", "AI_TIMEOUT_MS", "AI_DAILY_REQUEST_CEILING", "AI_DAILY_NEURON_CEILING", "AI_PER_USER_CEILING", "AI_PER_WORKSPACE_CEILING", "AI_CONCURRENCY_CEILING", "AI_GLOBAL_KILL_SWITCH"]) assert(source.includes(token), `missing ${token}`)
assert(source.includes('env.AI_PROVIDER_ENABLED'), "provider flag must be environment controlled")
assert(source.includes('value === "enabled"'), "provider flag must require exact enabled")
assert(source.includes("Math.floor(freeAllocation * 0.7)"), "daily neuron ceiling must cap at 70% of documented allocation")
assert(source.includes("boundedInt(env.AI_DOCUMENTED_DAILY_NEURON_ALLOCATION, 0"), "unknown allocation must fail closed")
assert(source.includes('ratio >= 0.9') && source.includes('ratio >= 0.7'), "allocation thresholds missing")
assert(source.includes('reason: "provider-disabled"'), "provider must fail closed")
assert(source.includes("reserveUsage()") && source.includes("reserveFinancial()") && source.indexOf("reserveUsage()") < source.indexOf("invoke()"), "reservations must precede provider")
assert(source.includes("releaseUsage?.()") && source.includes("releaseFinancial?.()"), "failed reservations must reconcile")
assert(source.includes('operation === "assistant" || operation === "ai-bot"'), "only approved text operations may project")
assert(source.includes("stream: false") && source.includes("Do not call tools"), "streaming and tools must remain unavailable")
assert(source.includes("slice(0, 8_000)") && source.includes("slice(0, 12_000)"), "input/output bounds missing")
assert(config.includes("liveBilling: true") && config.includes("paidAi: false"), "live billing must remain independent from the disabled paid-AI gate")
console.log("Cloudflare Workers AI safe provider audit passed")
