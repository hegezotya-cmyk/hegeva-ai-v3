import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequestHandler } from "../../src/index.js"

const handler = createRequestHandler()
let providerCalls = 0
const scriptDir = dirname(fileURLToPath(import.meta.url))
const workerSource = readFileSync(resolve(scriptDir, "..", "..", "src", "index.js"), "utf8")

const baseEnv = {
  AI_PROVIDER_ENABLED: "enabled",
  AI_GLOBAL_KILL_SWITCH: "disabled",
  AI_PUBLIC_ASSISTANT_ENABLED: "disabled",
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
  ["defaults fail closed", {}, false, false, false],
  ["legacy canary flag does not enable any surface", { AI_BOT_CANARY_ENABLED: "enabled" }, false, false, false],
  ["owner setup does not expose Assistant or AI Bots", { AI_OWNER_PROFILE_SETUP_ENABLED: "enabled" }, false, false, true],
  ["owner canary does not expose public Assistant", { AI_OWNER_CANARY_ENABLED: "enabled" }, false, true, false],
  ["public Assistant can be enabled independently", { AI_PUBLIC_ASSISTANT_ENABLED: "enabled" }, true, false, false],
  ["both explicit gates can be enabled", { AI_PUBLIC_ASSISTANT_ENABLED: "enabled", AI_OWNER_CANARY_ENABLED: "enabled" }, true, true, false],
  ["global kill switch blocks both gates", { AI_PUBLIC_ASSISTANT_ENABLED: "enabled", AI_OWNER_CANARY_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "enabled" }, false, false, false],
  ["disabled provider blocks both gates", { AI_PUBLIC_ASSISTANT_ENABLED: "enabled", AI_OWNER_CANARY_ENABLED: "enabled", AI_PROVIDER_ENABLED: "disabled" }, false, false, false],
  ["malformed gate values fail closed", { AI_PUBLIC_ASSISTANT_ENABLED: "true", AI_OWNER_PROFILE_SETUP_ENABLED: "yes", AI_OWNER_CANARY_ENABLED: "yes" }, false, false, false],
]

for (const [label, overrides, assistantEnabled, aiBotsEnabled, ownerProfileSetupEnabled] of cases) {
  const status = await readStatus(overrides)
  assert.equal(status.assistantEnabled, assistantEnabled, `${label}: assistantEnabled`)
  assert.equal(status.aiBotsEnabled, aiBotsEnabled, `${label}: aiBotsEnabled`)
  assert.equal(status.ownerProfileSetupEnabled, ownerProfileSetupEnabled, `${label}: ownerProfileSetupEnabled`)
}

assert.equal(providerCalls, 0, "status checks must not invoke the provider")
const chatRoute = workerSource.slice(workerSource.indexOf("// HEGEVA AI CHAT"), workerSource.indexOf('/api/ai-bot/approve'))
assert(chatRoute.includes("const isX20Action = body.actionKind === \"x20\";"), "public Assistant route must classify X20 before admission")
assert(chatRoute.includes("!flags.publicAssistantEnabled") && chatRoute.includes("HEGEVA Assistant is currently unavailable."), "public Assistant route must fail closed when public availability is disabled")
assert(chatRoute.indexOf("!flags.publicAssistantEnabled") < chatRoute.indexOf("handleAiChatAdmission"), "public Assistant gate must precede quota admission")
console.log("Owner canary gating separation audit: PASS")
console.log(`cases: ${cases.length}; provider calls: ${providerCalls}`)
