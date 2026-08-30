import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source = fs.readFileSync(new URL("../lib/foundation/brain-runtime.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { createWorkspaceMissionProjection, advanceBrainRun, BrainTransitionError } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)

for (const scope of ["authenticated-cloud", "local-browser"]) {
  const projection = createWorkspaceMissionProjection({ scope, hasRecords: true, openTasks: 1, overdueItems: 0 })
  assert.equal(projection.stage, "permission")
  assert.equal(projection.permission, "pending")
  assert.match(projection.safeSummary, /approval|required/i)
  assert.throws(() => advanceBrainRun(projection, { stage: "model", safeSummary: "should not execute" }), (error) => error instanceof BrainTransitionError && error.code === "approval-required")
}

const empty = createWorkspaceMissionProjection({ scope: "authenticated-cloud", hasRecords: false, openTasks: 0, overdueItems: 0 })
assert.equal(empty.history[1].safeSummary, "No workspace data available")
assert.equal(empty.stage, "permission")
assert.equal(empty.history.some((entry) => /provider|tool|job|execute/i.test(entry.safeSummary)), false)

const operatingCenter = fs.readFileSync(new URL("../components/command-center/operating-center.tsx", import.meta.url), "utf8")
assert(operatingCenter.includes("createWorkspaceMissionProjection"), "Operating Center must use the read-only projection")
assert(/cloudEnabled\s*\?\s*["']authenticated-cloud["']\s*:\s*["']local-browser["']/.test(operatingCenter), "Projection scope must follow authenticated/local workspace state")
assert(!/startX20Action|reserveAIUsage|env\.AI|setItems\(/.test(operatingCenter), "Projection must not mutate or invoke providers")

console.log("Brain/Mission projection audit passed: scoped read-only projection, approval-gated runtime and no provider or mutation path")
