import { readFileSync } from "node:fs"
import { join } from "node:path"
const root = join(import.meta.dirname, "..")
const source = readFileSync(join(root, "../src/index.js"), "utf8")
const page = readFileSync(join(root, "app/app-studio/ai-bots/page.tsx"), "utf8")
const assert = (value, message) => { if (!value) throw new Error(message) }
assert(source.includes('/api/ai-bot/renewal-readiness'), "readiness endpoint missing")
assert(source.includes('renewalAvailable'), "bounded readiness response missing")
for (const token of ['AI_BOT_CANARY_EMAIL', 'enabled === false', 'executionState === "not-started"', 'permittedTools[0] === "none"', 'approvalState === "owner-approved"', 'approvedByActorHash', 'approvalRevision']) assert(source.includes(token), `readiness guard missing: ${token}`)
assert(page.includes('/api/ai-bot/renewal-readiness'), "page must query server readiness")
assert(page.includes('<ComingSoonCard feature="aiBots"'), "Coming Soon gate missing")
assert(page.includes('renewalAvailable'), "page readiness state missing")
const disabledBranch = page.slice(page.indexOf('if (!aiAvailability.status.aiBotsEnabled)'), page.indexOf('return <AIBotStudio'))
assert(disabledBranch.includes('<OwnerAIBotRenewal') && !disabledBranch.includes('<AIBotExecution') && !disabledBranch.includes('<AIBotStudio'), "disabled branch must expose renewal only")
console.log("Owner renewal readiness audit passed: server-bounded owner exception, renewal-only UI, Coming Soon preserved, no execution/provider path")
