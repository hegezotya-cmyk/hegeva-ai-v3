import assert from "node:assert/strict"
import fs from "node:fs"

const operatingCenter = fs.readFileSync(new URL("../components/command-center/operating-center.tsx", import.meta.url), "utf8")
const runtime = fs.readFileSync(new URL("../lib/foundation/brain-runtime.ts", import.meta.url), "utf8")
assert(runtime.includes("export type WorkspaceMissionProjection = SafeBrainRun"), "Mission projection return type must extend SafeBrainRun")
assert(operatingCenter.includes("missionProjection.safeSummary"), "Mission safe summary must be visible")
assert(operatingCenter.includes("ux.approval") && operatingCenter.includes("ux.notStarted"), "Approval and execution state must be explicit")
assert(operatingCenter.includes("missionProjection.needsUser"), "Bounded needsUser guidance must be visible")
assert(/missionProjection\.stage==="permission"/.test(operatingCenter), "Brain permission stage mapping must remain intact")
assert(/authenticated-cloud/.test(operatingCenter) && /local-browser/.test(operatingCenter), "Cloud/local scope labels must remain")
assert(!/onClick|onSubmit|setItems\(|fetch\(|env\.AI|startX20Action|reserveAIUsage/.test(operatingCenter), "Mission UX must remain read-only without side effects")
assert(!/dangerouslySetInnerHTML|new Function|eval\(/.test(operatingCenter), "Mission UX must not execute dynamic content")
assert(/mission-surface/.test(operatingCenter) && /mission-body/.test(operatingCenter), "Existing responsive mission structure must remain")
assert([...operatingCenter.matchAll(/safeSummary/g)].length > 0 && operatingCenter.length < 30000, "Displayed content must remain bounded")

console.log("Mission UX audit passed: safe summary, explicit approval boundary, execution-not-started state and preserved read-only responsive surface")
