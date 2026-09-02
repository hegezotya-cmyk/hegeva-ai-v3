import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const dir = dirname(fileURLToPath(import.meta.url)); const root = resolve(dir, "..")
const page = readFileSync(join(root, "app/app-studio/ai-bots/page.tsx"), "utf8")
const execution = readFileSync(join(root, "components/app-studio/ai-bot-execution.tsx"), "utf8")
const assert = (v, m) => { if (!v) throw new Error(m) }
assert(page.includes("<AppShell>") && page.includes("<main") && page.indexOf("<AppShell>") < page.indexOf("<main"), "workflow content is not inside app shell main")
assert(page.indexOf("<AIBotOwnerApprovalPanel") < page.indexOf("<AIBotExecution"), "approval/execution hierarchy order")
assert(!page.includes("-mt-") && !page.includes("absolute"), "workflow uses unsafe overlap positioning")
assert(execution.includes("w-full") && execution.includes("min-h-11") && execution.includes("min-w-0"), "execution lacks responsive safeguards")
assert(execution.includes("ai-bot-execution-title") && execution.includes("aria-live") && execution.includes("textarea"), "execution controls incomplete")
console.log("AI Bot layout audit passed")
