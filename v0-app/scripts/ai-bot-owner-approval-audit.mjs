import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const scriptDir=dirname(fileURLToPath(import.meta.url)); const appRoot=resolve(scriptDir,".."); const repo=resolve(appRoot,".."); const source=readFileSync(join(repo,"src/index.js"),"utf8"); const studio=readFileSync(join(appRoot,"components/app-studio/ai-bot-studio.tsx"),"utf8"); const page=readFileSync(join(appRoot,"app/app-studio/ai-bots/page.tsx"),"utf8"); const panel=readFileSync(join(appRoot,"components/app-studio/ai-bot-owner-approval-panel.tsx"),"utf8"); const control=readFileSync(join(appRoot,"components/app-studio/ai-bot-owner-approval-control.tsx"),"utf8")
const assert=(v,m)=>{if(!v)throw new Error(m)}; const route=source.slice(source.indexOf('url.pathname === "/api/ai-bot/approve"'),source.indexOf('url.pathname === "/api/ai-bot/canary-once"'))
for(const token of ["getLoggedInUser","loadStoredAIBotProfile","AI_BOT_CANARY_EMAIL","sha256Hex","approvalState: \"owner-approved\"","approvalExpiresAt","approvalVersion","updatedAt=?2","updatedAt=?4","status: 409"])assert(route.includes(token),`approval contract missing ${token}`)
assert(route.includes("30 * 60 * 1000")&&!route.includes("request.headers.get(\"X-HEGEVA-CANARY-TOKEN\")"),"approval is not bounded/server-only")
assert(route.indexOf("getLoggedInUser")<route.indexOf("loadStoredAIBotProfile"),"authentication ordering")
assert(route.includes("JSON.stringify(records)")&&!route.includes("body.email")&&!route.includes("body.userId"),"client approval data trusted")
assert(studio.includes("credentials:\"include\"")&&studio.includes("/api/ai-bot/approve"),"client approval route missing")
assert(studio.includes("approvalState:\"not-requested\"")&&studio.includes("approvalVersion:item.approvalVersion+1"),"editing does not revoke approval")
assert(page.includes("AIBotOwnerApprovalPanel")&&panel.includes("useWorkspaceData<AIBotProfile>(\"ai-bot-profiles\")"),"page-level approval panel missing")
assert(panel.includes("AIBotOwnerApprovalControl")&&panel.includes("item.enabled"),"saved enabled profile gating missing")
assert(control.includes("body:JSON.stringify({profileId:profile.id})")&&!control.includes("AI_BOT_CANARY_AUTHORIZATION_HASH"),"approval payload is not bounded")
assert(control.includes("state===\"pending\"")&&control.includes("en:")&&control.includes("hu:")&&control.includes("de:")&&control.includes("fr:")&&control.includes("es:"),"pending/locale states missing")
assert(!control.includes("/api/ai-bot/execute")&&!control.includes("AI_BOT_CANARY_AUTHORIZATION_HASH"),"approval control reaches execution/canary")
assert(!route.includes("env.AI.run")&&!route.includes("invokeWorkersAiText"),"approval invokes provider")
console.log("AI Bot owner approval audit passed: authenticated server-owned profile approval, 30-minute expiry, hashed actor, CAS update, no provider or canary admission")
