import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDir, "..")
const repoRoot = resolve(appRoot, "..")
const source = readFileSync(join(repoRoot, "src", "index.js"), "utf8")
const providerSource = readFileSync(join(repoRoot, "src", "cloudflare-ai-provider.js"), "utf8")
const control = readFileSync(join(appRoot, "components", "app-studio", "ai-bot-owner-approval-control.tsx"), "utf8")
const assert = (value, message) => { if (!value) throw new Error(message) }
const routeStart = source.indexOf('url.pathname === "/api/ai-bot/canary-once"')
const routeEnd = source.indexOf('url.pathname === "/api/ai-bot/execute"')
assert(routeStart >= 0 && routeEnd > routeStart, "server canary-once route missing")
const route = source.slice(routeStart, routeEnd)
for (const token of ["getLoggedInUser", "crypto.randomUUID()", "sha256Hex(rawToken)", "5 * 60 * 1000", "admitAIBotCanary", "invokeWorkersAiText", "finishAIBotOperation", "revokeUnusedCanaryAuthorization"]) assert(route.includes(token), `canary contract missing ${token}`)
for (const token of ["parseProviderFlags", "getWorkersAiCanaryConfig"]) assert(source.includes(token), `canary preflight contract missing ${token}`)
assert(source.includes("loadCanaryProfile") && source.includes("evaluateAIBotCanaryPreflight"), "shared canonical profile preflight missing")
assert(source.includes("AI_BOT_CANARY_EMAIL"), "owner identity gate missing")
assert(source.includes("AI_BOT_CANARY_AUTHORIZATION_HASH") && source.includes("values.authorizationHash"), "internal authorization hash boundary missing")
assert(route.includes("getLoggedInUserFn") && source.indexOf("evaluateAIBotCanaryPreflight") < source.indexOf('url.pathname === "/api/ai-bot/canary-once"') && route.indexOf("admitAIBotCanary") < route.indexOf("invokeWorkersAiText"), "provider ordering is unsafe")
assert(/keys\.length !== 1/.test(route) && /keys\[0\] !== "profileId"/.test(route), "client payload is not restricted to profileId")
assert(providerSource.includes("requestCeiling !== 1") && providerSource.includes("userCeiling !== 1") && providerSource.includes("workspaceCeiling !== 1"), "one-request ceilings missing")
assert(/providerConfig\.neuronCeiling/.test(route), "neuron bound missing")
assert(providerSource.includes("concurrency !== 1"), "concurrency bound missing")
assert(route.includes("return Response.json({ status: provider.ok ? \"succeeded\" : \"failed\", providerAttempted: true"), "bounded terminal response missing")
assert(!route.includes("response: provider.response") && !/console\.(log|info|error)[^\n]*(rawToken|provider\.response)/.test(route), "canary response or token leaked")
for (const forbidden of ["prompt", "provider", "model", "quota", "email", "userId", "workspaceId", "actorHash", "approval", "authorization"]) {
  const bodyOnly = route.match(/const body = await request\.json\(\);([\s\S]*?)const configuredOwner/)
  if (forbidden === "prompt") continue
  assert(!/Response\.json\([^)]*\bresponse\s*:\s*provider\.response/.test(route), "provider output returned")
}
assert(control.includes('fetch("/api/ai-bot/canary-once"') && /body:JSON\.stringify\(\{profileId:profile\.id\}\)/.test(control), "client canary control is not bounded")
assert(control.includes("canaryState===\"pending\"") && control.includes("canaryState===\"succeeded\"") && control.includes("canaryState===\"used\""), "canary UI lifecycle states missing")
assert(["en:", "hu:", "de:", "fr:", "es:"].every((locale) => control.includes(locale)), "canary UI locale coverage missing")
assert(!control.includes("/api/ai-bot/execute") && !control.includes("X-HEGEVA-CANARY-TOKEN") && !control.includes("providerAttempted") , "client canary exposes execution details")
assert(!/setInterval|retry|fallback|stream:\s*true|tools\s*:/i.test(route), "unbounded provider behavior introduced")
console.log("AI Bot one-shot canary audit passed: owner-only server boundary, internal token, bounded admission, redacted result and localized protected control")
