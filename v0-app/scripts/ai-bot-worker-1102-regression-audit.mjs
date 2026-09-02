import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const panel = readFileSync(join(root, "components/app-studio/ai-bot-owner-approval-panel.tsx"), "utf8")
const page = readFileSync(join(root, "app/app-studio/ai-bots/page.tsx"), "utf8")
const execution = readFileSync(join(root, "components/app-studio/ai-bot-execution.tsx"), "utf8")
const studio = readFileSync(join(root, "components/app-studio/ai-bot-studio.tsx"), "utf8")
const assert = (condition, message) => { if (!condition) throw new Error(message) }

assert(panel.includes("lastItemsSnapshot") && panel.includes("JSON.stringify(items)"), "canonical reload guard missing")
assert(panel.includes("if (snapshot === lastItemsSnapshot.current) return"), "reload guard must bail out on unchanged data")
assert((panel.match(/setProfiles\(/g) || []).length === 2, "panel profile state updates are not bounded")
assert((panel.match(/fetch\(/g) || []).length === 1, "panel fetch count is not bounded")
assert(!page.includes("AppShell") && page.includes("<AIBotStudio afterContent") && page.includes("<main") && page.indexOf("<AIBotOwnerApprovalPanel") < page.indexOf("<AIBotExecution"), "workflow hierarchy must use one shell")
assert(studio.includes("afterContent?: ReactNode") && studio.includes("{afterContent}</AppShell>"), "studio must own the single shell and render trailing workflow content")
assert(!page.includes("-mt-") && !page.includes("absolute"), "workflow has unsafe overlap positioning")
assert(execution.includes("w-full") && execution.includes("min-w-0") && execution.includes("aria-live=\"polite\""), "execution responsive/status safeguards missing")
console.log("AI Bot Worker 1102 regression audit passed: reload 1 bounded sync, fetches remain finite, workflow is shell-contained")
