import { readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const scriptDir = dirname(fileURLToPath(import.meta.url)); const appRoot = resolve(scriptDir, ".."); const repositoryRoot = resolve(appRoot, ".."); const sourceRoot = join(repositoryRoot, "src")
const index = await readFile(join(sourceRoot, "index.js"), "utf8")
const adapter = await readFile(join(sourceRoot, "cloudflare-ai-provider.js"), "utf8")
const botPage = await readFile(join(appRoot, "app/app-studio/ai-bots/page.tsx"), "utf8")
const botClient = await readFile(join(appRoot, "components/app-studio/ai-bot-execution.tsx"), "utf8")
const assert = (v, m) => { if (!v) throw new Error(m) }
assert(index.includes('from "./cloudflare-ai-provider.js"'), "worker must import prepared adapter")
assert(index.includes('buildWorkersAiProjection({ operation: "assistant"'), "assistant must reach adapter projection")
assert(index.includes("invokeWorkersAiText(env, projection)"), "assistant must invoke prepared adapter")
assert(index.indexOf("await handleAiChatAdmission") < index.indexOf("invokeWorkersAiText(env, projection)"), "admission must precede adapter")
assert(index.includes("const isX20Action = body.actionKind === \"x20\""), "X20 operation boundary must remain explicit")
assert(index.includes("if (!isX20Action)"), "assistant adapter branch must exclude X20")
assert(adapter.includes("reserveUsage") && adapter.includes("reserveFinancial"), "shared reservation contract must remain available")
assert(adapter.includes("releaseUsage?.()") && adapter.includes("releaseFinancial?.()"), "failure reconciliation must remain bounded")
assert(botPage.includes("AIBotExecution") && botClient.includes("/api/ai-bot/execute") && /approvalState\s*===\s*["']owner-approved["']/.test(botClient), "AI Bot client must use authenticated approved route")
assert(!index.includes("AI_PROVIDER_ENABLED = \"enabled\""), "provider must not be enabled in source")
assert(!/console\.(log|info|error).*prompt|console\.(log|info|error).*response/i.test(adapter), "adapter must not log raw prompt or response")
console.log("Cloudflare Workers AI runtime integration audit passed")
