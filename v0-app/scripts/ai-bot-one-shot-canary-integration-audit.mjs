import worker, { createRequestHandler } from "../../src/index.js"
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
assert(source.includes("approvalRevision") && source.includes("row.updatedAt") && source.includes("profile.approvalRevision"), "approval must bind to canonical saved revision")
const approvalStart = source.indexOf('url.pathname === "/api/ai-bot/approve"')
assert(approvalStart >= 0 && source.slice(approvalStart, start).includes("approvalRevision: approvedAt"), "approval route must bind the new CAS revision")
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
const panel = readFileSync(join(appRoot, "components/app-studio/ai-bot-owner-approval-panel.tsx"), "utf8")
assert(panel.includes('/api/workspace/ai-bot-profiles') && panel.includes("setProfiles(payload.data") && !panel.includes("setItems(payload.data"), "approval UI must refresh canonical cloud state without persisting the reload")

let providerCalls = 0
const env = { DB: { prepare() { return { bind() { return this }, async first() { return null }, async all() { return { results: [] } }, async run() { throw new Error("unexpected write") } } } }, AI: { async run() { providerCalls += 1; return { response: "should-not-run" } } }, ASSETS: { fetch() { return new Response("ok") } }, AI_PROVIDER_ENABLED: "disabled", AI_GLOBAL_KILL_SWITCH: "enabled", AI_BOT_CANARY_ENABLED: "disabled", FINANCIAL_GUARD_ENABLED: "disabled" }
const unauthenticated = await worker.fetch(new Request("https://example.test/api/ai-bot/canary-once", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profileId: "bot-test" }) }), env, {})
assert(unauthenticated.status === 401, "unauthenticated route did not reject")
assert(providerCalls === 0, "unauthenticated route called provider")
console.log("AI Bot integrated one-shot canary audit passed: real handler unauthenticated gate, bounded pre-authorization diagnostics, strict configuration and no provider call")

// Authenticated end-to-end proof using the same route handler with an injected
// authentication dependency and an entirely in-memory D1-shaped binding.
const envBase = { AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI_BOT_CANARY_ENABLED: "enabled", FINANCIAL_GUARD_ENABLED: "enabled", AI_BOT_CANARY_EMAIL: "owner@example.test", AI_PROVIDER_MODEL: "@cf/meta/llama-3.1-8b-instruct-fast", AI_DOCUMENTED_DAILY_NEURON_ALLOCATION: "10000", AI_DAILY_NEURON_CEILING: "7000", AI_DAILY_REQUEST_CEILING: "1", AI_PER_USER_CEILING: "1", AI_PER_WORKSPACE_CEILING: "1", AI_CONCURRENCY_CEILING: "1", AI_MAX_INPUT_TOKENS: "200", AI_MAX_OUTPUT_TOKENS: "100", AI_TIMEOUT_MS: "10000", ASSETS: { fetch: () => new Response("ok") } }
const makeD1 = () => {
  const initialRevision = new Date().toISOString()
  const s = { data: JSON.stringify([{ id: "bot-test", schemaVersion: "0.1", name: "Canary", purpose: "readiness", instructions: "short", knowledgeScope: "workspace", permittedTools: ["none"], enabled: true, approvalState: "not-requested", executionState: "not-started", approvedAt: null, approvalExpiresAt: null, approvedByActorHash: null, approvalVersion: 1, approvalRevision: null, createdAt: initialRevision, updatedAt: initialRevision }]), updatedAt: initialRevision, auth: 0, admissions: 0, reservations: 0, events: 0, operations: 0, history: 0, usage: 0 }
  const prepare = (sql) => ({
    bind(...args) {
      return {
        async first() {
          if (/SELECT\s+data\s*,\s*updatedAt/i.test(sql)) return { data: s.data, updatedAt: s.updatedAt }
          if (sql.includes("SELECT data FROM workspace_data")) return { data: s.data }
          if (sql.includes("SELECT scopeHash")) return { results: [] }
          return null
        },
        async all() { return { results: [] } },
        async run() {
          const normalized = sql.trim()
          if (normalized.startsWith("UPDATE workspace_data")) { s.data = args[0]; s.updatedAt = args[1]; return { meta: { changes: 1 } } }
          if (normalized.startsWith("INSERT INTO ai_canary_authorizations")) s.auth++
          if (normalized.startsWith("INSERT INTO ai_canary_admissions")) { s.admissions++; s.reservations++; s.events++; s.operations++; s.usage += 3 }
          if (normalized.startsWith("UPDATE financial_guard_reservations")) s.reservations++
          if (normalized.startsWith("INSERT INTO ai_bot_execution_history")) s.history++
          return { meta: { changes: 1 } }
        }
      }
    }
  })
  return { state: s, db: { prepare, async batch(xs) { for (const x of xs) await x.run() } } }
}
const endToEnd = async (label, user, mutate = () => {}, canaryUser = user) => { const x = makeD1(); let calls = 0; const env = { ...envBase, DB: x.db, AI: { async run() { calls++; return { response: "redacted" } } } }; const approvalHandler = createRequestHandler({ getLoggedInUserFn: async () => user }); const approval = await approvalHandler.fetch(new Request("https://example.test/api/ai-bot/approve", { method: "POST", headers: { cookie: "session=controlled", "content-type": "application/json" }, body: JSON.stringify({ profileId: "bot-test" }) }), env, {}); if (label === "fresh") { assert(approval.status === 200, "fresh approval failed"); const p = JSON.parse(x.state.data)[0]; assert(p.approvalRevision === x.state.updatedAt, "approval revision mismatch") } mutate(x.state); const h = createRequestHandler({ getLoggedInUserFn: async () => canaryUser }); const canary = await h.fetch(new Request("https://example.test/api/ai-bot/canary-once", { method: "POST", headers: { cookie: "session=controlled", "content-type": "application/json" }, body: JSON.stringify({ profileId: "bot-test" }) }), env, {}); if (label === "fresh") { const safeReason = canary.status === 403 ? (await canary.clone().json().catch(() => ({}))).reason : ""; const p = JSON.parse(x.state.data)[0]; assert(canary.status !== 403, `fresh profile rejected: ${safeReason}; state=${p.approvalState}; enabled=${p.enabled}; revision=${p.approvalRevision === x.state.updatedAt}; actor=${typeof p.approvedByActorHash === "string"}`); assert(calls === 1, "fresh profile provider attempt count") } else assert(calls === 0, `${label} provider attempt`); return calls }
const mutateProfile = (s, change) => { const profile = JSON.parse(s.data)[0]; change(profile); s.data = JSON.stringify([profile]) }
const counts = { fresh: await endToEnd("fresh", { id: "owner-123", email: "owner@example.test" }), edited: await endToEnd("edited", { id: "owner-123", email: "owner@example.test" }, s => mutateProfile(s, p => { p.purpose = "edited"; p.approvalRevision = "edited-revision" })), disabled: await endToEnd("disabled", { id: "owner-123", email: "owner@example.test" }, s => mutateProfile(s, p => { p.enabled = false; p.approvalState = "not-requested"; p.approvalRevision = null })), expired: await endToEnd("expired", { id: "owner-123", email: "owner@example.test" }, s => mutateProfile(s, p => { p.approvalExpiresAt = "2000-01-01T00:00:00.000Z" })), wrongActor: await endToEnd("wrong-actor", { id: "owner-123", email: "owner@example.test" }, () => {}, { id: "other-actor", email: "owner@example.test" }), foreign: await endToEnd("foreign", { id: "owner-123", email: "owner@example.test" }, s => { s.data = "[]" }), stale: await endToEnd("stale", { id: "owner-123", email: "owner@example.test" }, s => mutateProfile(s, p => { p.approvalRevision = "stale-revision" })) }
assert(counts.fresh === 1 && Object.entries(counts).filter(([k]) => k !== "fresh").every(([, v]) => v === 0), "end-to-end provider attempt counts invalid")
console.log(`AI Bot authenticated approval-to-canary integration passed: ${JSON.stringify(counts)}; no real provider or D1 access`)
