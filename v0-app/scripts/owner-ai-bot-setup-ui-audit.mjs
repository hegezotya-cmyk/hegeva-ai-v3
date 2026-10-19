import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const page = readFileSync(join(appRoot, "app", "app-studio", "ai-bots", "page.tsx"), "utf8")
const setupPath = join(appRoot, "components", "app-studio", "owner-ai-bot-setup.tsx")
assert(existsSync(setupPath), "owner setup component must exist")
const setup = readFileSync(setupPath, "utf8")

assert(page.includes("ComingSoonCard") && page.includes("!aiAvailability.status.aiBotsEnabled"), "AI Bots public Coming Soon gate must remain")
assert(page.includes("OwnerAIBotSetup"), "owner setup surface must mount independently of public AI Bot availability")
assert(setup.includes('/api/ai-bot/owner-setup-capability') && setup.includes('/api/ai-bot/owner-setup-profile'), "setup UI must use only owner setup endpoints")
for (const forbidden of ["/api/chat", "/api/ai-bot/canary-once", "/api/ai-bot/execute", "/api/ai-bot/approve", "invokeWorkersAiText", "sendResendEmail", "payment", "prepared-work"]) {
  assert(!setup.includes(forbidden), `setup UI must not reach ${forbidden}`)
}
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) assert(setup.includes(locale), `missing ${locale} setup copy`)
assert(setup.includes('credentials: "include"'), "owner setup requests must use the normal authenticated session")
assert(setup.includes('permittedTools: ["none"]'), "owner setup profile must have no tools")
assert(setup.includes("const labels") && setup.includes("labels[field]"), "setup form must map its localized knowledge-scope label explicitly")
console.log("Owner AI Bot setup UI audit: PASS")
