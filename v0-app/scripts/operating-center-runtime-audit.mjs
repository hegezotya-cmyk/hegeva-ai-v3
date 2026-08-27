import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source = fs.readFileSync(new URL("../lib/operating-center/runtime.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { createOperatingCenterSnapshot } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const base = {
  ownerUserId: "user-a",
  workspaceId: "workspace-a",
  today: "2026-08-27",
  syncState: "cloud",
  customers: [{ id: "customer-a" }],
  documents: [{ id: "document-a" }],
  expenses: [],
  tasks: [{ id: "task-a", title: "Send proposal", due: "2026-08-26", done: false }],
  invoices: [{ id: "invoice-a", type: "invoice", status: "sent", dueDate: "2026-08-25" }],
}

const attention = createOperatingCenterSnapshot(base)
assert.deepEqual(attention.inventory, { customers: 1, documents: 1, expenses: 0, invoices: 1 })
assert.deepEqual(attention.overdue, { tasks: 1, invoices: 1, total: 2 })
assert.equal(attention.currentStage, "execute")
assert.equal(attention.openTaskCount, 1)
assert.equal(attention.openTasks.length, 1)
assert.equal(attention.safeSummary, "2 workspace items require attention.")

const complete = createOperatingCenterSnapshot({ ...base, tasks: [{ ...base.tasks[0], done: true }], invoices: [{ ...base.invoices[0], status: "paid" }] })
assert.equal(complete.currentStage, "result")
assert.equal(complete.completedStages, 5)
assert(complete.stages.every((stage) => stage.status === "completed"))

const empty = createOperatingCenterSnapshot({ ...base, customers: [], documents: [], tasks: [], invoices: [] })
assert.equal(empty.currentStage, "understand")
assert.equal(empty.completedStages, 0)
assert.throws(() => createOperatingCenterSnapshot({ ...base, workspaceId: "" }), /scope-required/)
assert.throws(() => createOperatingCenterSnapshot({ ...base, today: "not-a-date" }), /date-invalid/)
assert(!/fetch\(|localStorage|setInterval|setTimeout|eval\(|Function\(|MemoryService|BrainMemoryGateway|advanceBrainRun|validateX30Spec/.test(source), "Operating Center runtime must remain a pure bounded projection")
console.log("Operating Center runtime audit passed: scoped deterministic inventory, ordered readiness stages, overdue attention, safe summaries, input validation and no execution authority")
