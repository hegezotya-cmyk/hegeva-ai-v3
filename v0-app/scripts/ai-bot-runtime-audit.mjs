import { readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const scriptDir=dirname(fileURLToPath(import.meta.url)); const appRoot=resolve(scriptDir,".."); const repositoryRoot=resolve(appRoot,".."); const sourceRoot=join(repositoryRoot,"src"); const migrationsRoot=join(repositoryRoot,"migrations")
const source=await readFile(join(sourceRoot,"index.js"),"utf8")
const provider=await readFile(join(sourceRoot,"cloudflare-ai-provider.js"),"utf8")
const route=source.slice(source.indexOf('url.pathname === "/api/ai-bot/execute"'), source.indexOf('url.pathname === "/api/x30/generate"'))
const migration=await readFile(join(migrationsRoot,"0013_ai_bot_execution.sql"),"utf8")
const profile=await readFile(join(appRoot,"components/app-studio/ai-bot-studio.tsx"),"utf8")
const assert=(v,m)=>{if(!v)throw new Error(m)}
for(const token of ["/api/ai-bot/execute","loadCanonicalAIBotProfile","approvalState !== \"owner-approved\"","workspace_data","reserveAIBotOperation","invokeWorkersAiText","FINANCIAL_GUARD_ENABLED","AI_BOT_PROFILE_ID","AI_BOT_OPERATION_ID","AI_BOT_CANARY_EMAIL"])assert(source.includes(token),`missing ${token}`)
assert(provider.includes("AI_BOT_CANARY_ENABLED")&&provider.includes("parseProviderFlags"),"central canary flag parser missing")
for(const token of ["ai_bot_usage","ai_bot_operations","ai_bot_execution_history","ai_bot_reserve_usage","ai_bot_history_no_update","ai_bot_history_no_delete","retentionUntil","FOREIGN KEY (operationId)"])assert(migration.includes(token),`missing migration ${token}`)
assert(route.indexOf("getLoggedInUser(request, env, ctx)")<route.indexOf("loadCanonicalAIBotProfile"),"authentication must precede profile lookup")
assert(route.indexOf("loadCanonicalAIBotProfile(env, user.id, profileId)")<route.indexOf("admitAIBotCanary(env, request"),"canonical profile must precede admission")
assert(route.indexOf("admitAIBotCanary(env, request")<route.indexOf("invokeWorkersAiText(env, projection)"),"atomic admission must precede provider")
assert(source.includes("admitAIBotCanary")&&source.includes("env.DB.batch([")&&source.indexOf("admitAIBotCanary(env, request")<source.indexOf("invokeWorkersAiText(env, projection)"),"atomic canary admission must precede provider")
assert(source.includes("approvalExpiresAt")&&source.includes("Date.parse(profile.approvalExpiresAt) <= now"),"approval expiry must fail closed")
assert(profile.includes('approvalState:"not-requested"')&&profile.includes("approvalVersion:item.approvalVersion+1"),"editing must invalidate prior approval")
assert(migration.includes("executions >= 0")&&migration.includes("attemptNumber BETWEEN 0 AND 1")&&migration.includes("length(userId) BETWEEN 1 AND 128"),"ledger bounds missing")
assert(!route.includes("ADMIN_EMAIL")&&!route.includes("body.approval")&&source.includes("profile.approvalState !== \"owner-approved\""),"client cannot supply approval")
assert(source.includes("providerConfig.freeAllocationSource !== \"configured\""),"unknown allocation must fail closed")
assert(migration.includes("approvedAt")&&migration.includes("approvalExpiresAt")&&migration.includes("approvalVersion"),"approval metadata schema missing")
console.log("AI Bot runtime audit passed")
