import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source = fs.readFileSync(new URL("../lib/foundation/roadmap-foundations.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { createWorkspacePulseProjection } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)

const cloud = createWorkspacePulseProjection({ scope: "authenticated-cloud", hasRecords: true, openTasks: 2, missionState: "awaiting-approval" })
assert.equal(cloud.continuity[0], "Authenticated workspace")
assert(cloud.continuity.every((entry) => entry.length <= 80))
assert(cloud.nextActions.length === 2 && cloud.nextActions.every((entry) => entry.length <= 80))
assert(cloud.needsUser)

const empty = createWorkspacePulseProjection({ scope: "authenticated-cloud", hasRecords: false, openTasks: 0, missionState: "awaiting-approval" })
assert.match(empty.understood, /No workspace data available/)
assert(!empty.continuity.some((entry) => /user|email|id|prompt|record:/i.test(entry)))

const local = createWorkspacePulseProjection({ scope: "local-browser", hasRecords: true, openTasks: 0, missionState: "awaiting-approval" })
assert.equal(local.continuity[0], "Local workspace")
assert(local.nextActions.every((entry) => !/execute|run|send|delete|save/i.test(entry)))

const operatingCenter = fs.readFileSync(new URL("../components/command-center/operating-center.tsx", import.meta.url), "utf8")
assert(operatingCenter.includes("createWorkspacePulseProjection"))
assert(/tasksToday/.test(operatingCenter) && /openInvoices/.test(operatingCenter) && /expectedRevenue/.test(operatingCenter) && /draftMessages/.test(operatingCenter), "Pulse must summarize real daily workspace signals")
for (const route of ["/business/invoices", "/business/messages", "/business/planner", "/business/customers"]) assert(operatingCenter.includes(route), `Pulse must link to ${route}`)
assert(!/fetch\(|env\.AI|setItems\(|startX20Action|reserveAIUsage/.test(operatingCenter))
assert(!/dangerouslySetInnerHTML|eval\(|new Function/.test(operatingCenter))

console.log("Pulse continuity audit passed: bounded scoped summaries, explicit cloud/local/empty states and user-controlled next steps")
