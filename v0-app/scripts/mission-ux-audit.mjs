import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const operatingCenter = fs.readFileSync(new URL("../components/command-center/operating-center.tsx", import.meta.url), "utf8")
const runtime = fs.readFileSync(new URL("../lib/foundation/brain-runtime.ts", import.meta.url), "utf8")
const compiledRuntime = ts.transpileModule(runtime, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { createWorkspaceMissionProjection } = await import(`data:text/javascript;base64,${Buffer.from(compiledRuntime).toString("base64")}`)
for (const scope of ["authenticated-cloud", "local-browser"]) {
  const projection = createWorkspaceMissionProjection({ scope, hasRecords: true, openTasks: 1, overdueItems: 0 })
  assert(projection.safeSummary.length <= 120, "Displayed mission summary must remain bounded")
  assert(typeof projection.needsUser === "string" && projection.needsUser.length <= 160, "Displayed mission guidance must remain bounded")
  assert(projection.history.every((entry) => entry.safeSummary.length <= 120), "Displayed mission history must remain bounded")
}
assert(runtime.includes("export type WorkspaceMissionProjection = SafeBrainRun"), "Mission projection return type must extend SafeBrainRun")
assert(operatingCenter.includes("missionProjection.safeSummary"), "Mission safe summary must be visible")
assert(operatingCenter.includes("ux.approval") && operatingCenter.includes("ux.notStarted"), "Approval and execution state must be explicit")
assert(operatingCenter.includes("missionProjection.needsUser"), "Bounded needsUser guidance must be visible")
assert(/missionProjection\.stage==="permission"/.test(operatingCenter), "Brain permission stage mapping must remain intact")
assert(/authenticated-cloud/.test(operatingCenter) && /local-browser/.test(operatingCenter), "Cloud/local scope labels must remain")
assert(!/onClick|onSubmit|setItems\(|fetch\(|env\.AI|startX20Action|reserveAIUsage/.test(operatingCenter), "Mission UX must remain read-only without side effects")
assert(!/dangerouslySetInnerHTML|new Function|eval\(/.test(operatingCenter), "Mission UX must not execute dynamic content")
assert(/mission-surface/.test(operatingCenter) && /mission-body/.test(operatingCenter), "Existing responsive mission structure must remain")
assert([...operatingCenter.matchAll(/safeSummary/g)].length > 0, "Bounded mission summaries must remain visible")

console.log("Mission UX audit passed: safe summary, explicit approval boundary, execution-not-started state and preserved read-only responsive surface")
