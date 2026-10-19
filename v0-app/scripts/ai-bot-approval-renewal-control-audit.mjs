import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = join(import.meta.dirname, "..")
const panel = readFileSync(join(root, "components/app-studio/ai-bot-owner-approval-panel.tsx"), "utf8")
const page = readFileSync(join(root, "app/app-studio/ai-bots/page.tsx"), "utf8")
const source = readFileSync(join(root, "../src/index.js"), "utf8")
const assert = (value, message) => { if (!value) throw new Error(message) }

assert(panel.includes('/api/ai-bot/renew-approval'), "renewal control must use the existing endpoint")
assert(panel.includes('credentials: "include"'), "renewal control must use the authenticated session")
assert(panel.includes('JSON.stringify({ profileId })'), "renewal payload must contain only profileId")
for (const locale of ["en", "hu", "de", "fr", "es"]) assert(panel.includes(`${locale}:`), `missing ${locale} renewal copy`)
assert(panel.includes('item.approvalState === "owner-approved"') && panel.includes('Date.parse(item.approvalExpiresAt) <= Date.now()'), "renewal must be limited to expired approvals")
assert(!panel.includes('/api/ai-bot/canary-once'), "renewal control must not execute a canary")
assert(!panel.includes('/api/chat'), "renewal control must not call Assistant")
assert(page.includes('<ComingSoonCard feature="aiBots"'), "normal users must retain Coming Soon")
const renewal = source.slice(source.indexOf('url.pathname === "/api/ai-bot/renew-approval"'), source.indexOf('url.pathname === "/api/ai-bot/canary-readiness"'))
assert(renewal.includes('AI_BOT_PROFILE_ID') && renewal.includes('user.id'), "server ownership boundary must remain authoritative")
assert(renewal.includes('current.enabled === false') && renewal.includes('current.executionState === "not-started"'), "renewal lifecycle guard missing")
assert(renewal.includes('current.permittedTools[0] === "none"'), "renewal tool boundary missing")
console.log("Owner AI Bot approval renewal control audit passed: authenticated existing endpoint, expired-only control, unchanged Coming Soon gate, no execution/provider path")
