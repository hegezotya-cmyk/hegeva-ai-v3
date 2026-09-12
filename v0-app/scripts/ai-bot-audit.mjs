import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
const root = process.cwd(); const files = ["app/app-studio/ai-bots/page.tsx", "components/app-studio/ai-bot-studio.tsx", "components/app-studio/ai-bot-owner-approval-control.tsx", "lib/ai-bot.ts"]
for (const file of files) if (!existsSync(join(root, file))) throw new Error(`Missing AI Bot file: ${file}`)
const source = files.map((file) => readFileSync(join(root, file), "utf8")).join("\n")
for (const token of ["useWorkspaceData", "createAIBotProfile", "validateAIBotProfile", "validateAIBotAdapterRequest", "validateAIBotAdapterResult", "AI_BOT_TOOL_REGISTRY", "redactAIBotDiagnostics", "createDisabledAIBotAdapter", "window.confirm", "approval", "not-started", "maxLength", "ai-bot-profiles"]) if (!source.includes(token)) throw new Error(`AI Bot contract missing: ${token}`)
const approvalControl = readFileSync(join(root, "components/app-studio/ai-bot-owner-approval-control.tsx"), "utf8")
if (/\/api\/ai-bot\/execute|env\.AI|Workers AI|wrangler|X30_GENERATION_ENABLED|https?:\/\//i.test(approvalControl)) throw new Error("AI Bot approval control must not introduce a provider path")
for (const match of source.matchAll(/fetch\s*\(\s*["']([^"']+)["']/g)) if (!["/api/ai-bot/approve", "/api/ai-bot/canary-readiness", "/api/ai-bot/canary-once"].includes(match[1])) throw new Error(`AI Bot client fetch is not an approved authenticated boundary: ${match[1]}`)
if (!/fetch\("\/api\/ai-bot\/approve"/.test(approvalControl) || !/method:\s*"POST"/.test(approvalControl) || !/credentials:\s*"include"/.test(approvalControl)) throw new Error("AI Bot approval control must use authenticated approval POST")
const bodyMatch = approvalControl.match(/body:\s*JSON\.stringify\(([^)]+)\)/)
if (!bodyMatch || bodyMatch[1].replace(/\s/g, "") !== "{profileId:profile.id}") throw new Error("AI Bot approval payload must contain only profileId")
for (const field of ["email", "userId", "workspaceId", "actorHash", "approvalState", "approvedAt", "approvalExpiresAt", "approvalVersion", "provider", "model", "quota", "authorization"]) {
  if (new RegExp(`[.{,]${field}\\s*:`, "i").test(bodyMatch[1])) throw new Error(`AI Bot approval payload contains authority field: ${field}`)
}
if (!/state===\"pending\"/.test(approvalControl) || !/disabled=\{state===\"pending\"\}/.test(approvalControl)) throw new Error("AI Bot approval control must block duplicate pending submissions")
const lib = readFileSync(join(root, "lib/ai-bot.ts"), "utf8")
for (const token of ["provider-neutral", "provider-disabled", "requiresApproval", "attemptNumber", "cancelled", "prompt", "knowledgeScope", "dailyLimit", "redactAIBotDiagnostics"]) {
  if (!lib.toLowerCase().includes(token.toLowerCase())) throw new Error(`AI Bot safety boundary missing: ${token}`)
}
if (!/generate:\s*\(\)\s*=>/.test(lib) || /fetch\s*\(/.test(lib)) throw new Error("Disabled AI Bot adapter must be local and provider-free")
if (/console\.(log|error)\([^)]*(?:email|input|output|instructions)/i.test(lib)) throw new Error("AI Bot diagnostics must not log private content")
console.log("AI BOT AUDIT PASSED — bounded CRUD, workspace persistence, approval gate and provider-disabled testing")
