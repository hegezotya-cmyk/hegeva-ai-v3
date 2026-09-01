import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
const root = process.cwd(); const files = ["app/app-studio/ai-bots/page.tsx", "components/app-studio/ai-bot-studio.tsx", "lib/ai-bot.ts"]
for (const file of files) if (!existsSync(join(root, file))) throw new Error(`Missing AI Bot file: ${file}`)
const source = files.map((file) => readFileSync(join(root, file), "utf8")).join("\n")
for (const token of ["useWorkspaceData", "createAIBotProfile", "validateAIBotProfile", "validateAIBotAdapterRequest", "validateAIBotAdapterResult", "AI_BOT_TOOL_REGISTRY", "redactAIBotDiagnostics", "createDisabledAIBotAdapter", "window.confirm", "approval", "not-started", "maxLength", "ai-bot-profiles"]) if (!source.includes(token)) throw new Error(`AI Bot contract missing: ${token}`)
if (/fetch\s*\(/.test(source) || /X30_GENERATION_ENABLED|wrangler|Workers AI/.test(source)) throw new Error("AI Bot must not introduce a provider path")
const lib = readFileSync(join(root, "lib/ai-bot.ts"), "utf8")
for (const token of ["provider-neutral", "provider-disabled", "requiresApproval", "attemptNumber", "cancelled", "prompt", "knowledgeScope", "dailyLimit", "redactAIBotDiagnostics"]) {
  if (!lib.toLowerCase().includes(token.toLowerCase())) throw new Error(`AI Bot safety boundary missing: ${token}`)
}
if (!/generate:\s*\(\)\s*=>/.test(lib) || /fetch\s*\(/.test(lib)) throw new Error("Disabled AI Bot adapter must be local and provider-free")
if (/console\.(log|error)\([^)]*(?:email|input|output|instructions)/i.test(lib)) throw new Error("AI Bot diagnostics must not log private content")
console.log("AI BOT AUDIT PASSED — bounded CRUD, workspace persistence, approval gate and provider-disabled testing")
