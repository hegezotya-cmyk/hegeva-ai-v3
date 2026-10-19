import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequestHandler } from "../../src/index.js"

const handler = createRequestHandler()
let providerCalls = 0
let chatAuthCalls = 0
let chatDatabaseTouches = 0
const scriptDir = dirname(fileURLToPath(import.meta.url))
const workerSource = readFileSync(resolve(scriptDir, "..", "..", "src", "index.js"), "utf8")

const baseEnv = {
  AI_PROVIDER_ENABLED: "enabled",
  AI_GLOBAL_KILL_SWITCH: "disabled",
  AI_PUBLIC_ASSISTANT_ENABLED: "disabled",
  AI_X10_ENABLED: "disabled",
  AI_OWNER_PROFILE_SETUP_ENABLED: "disabled",
  AI_OWNER_CANARY_ENABLED: "disabled",
  AI_BOT_CANARY_ENABLED: "disabled",
  AI: { async run() { providerCalls += 1; throw new Error("status must not invoke provider") } },
}

async function readStatus(overrides = {}) {
  const response = await handler.fetch(new Request("https://hegevaai.co.uk/api/ai/status"), { ...baseEnv, ...overrides }, {})
  assert.equal(response.status, 200)
  return response.json()
}

const cases = [
  ["defaults fail closed", {}, false, false, false, false],
  ["legacy canary flag does not enable any surface", { AI_BOT_CANARY_ENABLED: "enabled" }, false, false, false, false],
  ["owner setup does not expose Assistant or AI Bots", { AI_OWNER_PROFILE_SETUP_ENABLED: "enabled" }, false, false, true, false],
  ["owner canary does not expose public Assistant", { AI_OWNER_CANARY_ENABLED: "enabled" }, false, true, false, false],
  ["public Assistant can be enabled independently", { AI_PUBLIC_ASSISTANT_ENABLED: "enabled" }, true, false, false, false],
  ["both explicit gates can be enabled", { AI_PUBLIC_ASSISTANT_ENABLED: "enabled", AI_OWNER_CANARY_ENABLED: "enabled" }, true, true, false, false],
  ["global kill switch blocks Assistant and X10", { AI_PUBLIC_ASSISTANT_ENABLED: "enabled", AI_X10_ENABLED: "enabled", AI_OWNER_CANARY_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "enabled" }, false, false, false, false],
  ["disabled provider blocks Assistant and X10", { AI_PUBLIC_ASSISTANT_ENABLED: "enabled", AI_X10_ENABLED: "enabled", AI_OWNER_CANARY_ENABLED: "enabled", AI_PROVIDER_ENABLED: "disabled" }, false, false, false, false],
  ["Assistant enabled while X10 remains disabled", { AI_PUBLIC_ASSISTANT_ENABLED: "enabled" }, true, false, false, false],
  ["X10 requires its explicit flag", { AI_X10_ENABLED: "enabled" }, false, false, false, true],
  ["X10 explicit flag cannot bypass provider or kill switch", { AI_X10_ENABLED: "enabled", AI_PROVIDER_ENABLED: "disabled" }, false, false, false, false],
  ["malformed gate values fail closed", { AI_PUBLIC_ASSISTANT_ENABLED: "true", AI_X10_ENABLED: "true", AI_OWNER_PROFILE_SETUP_ENABLED: "yes", AI_OWNER_CANARY_ENABLED: "yes" }, false, false, false, false],
]

for (const [label, overrides, assistantEnabled, aiBotsEnabled, ownerProfileSetupEnabled, x10Enabled] of cases) {
  const status = await readStatus(overrides)
  assert.equal(status.assistantEnabled, assistantEnabled, `${label}: assistantEnabled`)
  assert.equal(status.aiBotsEnabled, aiBotsEnabled, `${label}: aiBotsEnabled`)
  assert.equal(status.ownerProfileSetupEnabled, ownerProfileSetupEnabled, `${label}: ownerProfileSetupEnabled`)
  assert.equal(status.x10Enabled, x10Enabled, `${label}: x10Enabled`)
}

assert.equal(providerCalls, 0, "status checks must not invoke the provider")
const chatRoute = workerSource.slice(workerSource.indexOf("// HEGEVA AI CHAT"), workerSource.indexOf('/api/ai-bot/approve'))
assert(chatRoute.includes("const isX20Action = body.actionKind === \"x20\";"), "public Assistant route must classify X20 before admission")
assert(chatRoute.includes("!flags.publicAssistantEnabled") && chatRoute.includes("HEGEVA Assistant is currently unavailable."), "public Assistant route must fail closed when public availability is disabled")
assert(chatRoute.indexOf("!flags.publicAssistantEnabled") < chatRoute.indexOf("handleAiChatAdmission"), "public Assistant gate must precede quota admission")
assert(chatRoute.includes('body.appStudioProfile === "x10"'), "X10 profile must be detected server-side")
assert(chatRoute.includes("!flags.x10Enabled"), "X10 profile must require the dedicated server-side flag")
assert(chatRoute.indexOf("!flags.x10Enabled") < chatRoute.indexOf("getUserPlan("), "X10 gate must run before plan/quota work")
assert(chatRoute.indexOf("!flags.x10Enabled") < chatRoute.indexOf("handleAiChatAdmission"), "X10 gate must run before quota reservation")

const chatHandler = createRequestHandler({
  getLoggedInUserFn: async () => { chatAuthCalls += 1; return { id: "audit-user" } },
})
const deniedX10Response = await chatHandler.fetch(new Request("https://hegevaai.co.uk/api/chat", {
  method: "POST",
  headers: { "content-type": "application/json", origin: "https://hegevaai.co.uk" },
  body: JSON.stringify({ message: "audit only", appStudioProfile: "x10" }),
}), {
  ...baseEnv,
  AI_PUBLIC_ASSISTANT_ENABLED: "enabled",
  AI_X10_ENABLED: "disabled",
  DB: { prepare() { chatDatabaseTouches += 1; throw new Error("X10 rejection must precede quota/database work") } },
})
assert.equal(deniedX10Response.status, 503, "X10-profile request must be rejected when X10 is disabled")
assert.equal(chatAuthCalls, 1, "authenticated X10 test request must reach the server-side feature gate")
assert.equal(chatDatabaseTouches, 0, "X10 rejection must precede quota/database work")
assert.equal(providerCalls, 0, "disabled X10 request must make zero provider calls")
console.log("Owner canary gating separation audit: PASS")
console.log(`cases: ${cases.length}; X10 request: denied before quota; provider calls: ${providerCalls}`)
