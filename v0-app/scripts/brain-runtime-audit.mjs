import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source=fs.readFileSync(new URL("../lib/foundation/brain-runtime.ts",import.meta.url),"utf8")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const { advanceBrainRun, BrainTransitionError, createBrainRun, setBrainApproval }=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)

const advance = (run, stage, extra = {}) => advanceBrainRun(run, { stage, safeSummary: `${stage} complete`, ...extra })
let run = createBrainRun({ id: "run-1", correlationId: "corr-1", request: "Build a booking workflow" })
for (const stage of ["understand", "spec", "plan", "permission"]) run = advance(run, stage)

assert.equal(run.permission, "pending")
assert.throws(() => advance(run, "model"), (error) => error instanceof BrainTransitionError && error.code === "approval-required")
run = setBrainApproval(run, "approved", "Owner approved this bounded run")
run = advance(run, "model", { model: { provider: "test", model: "deterministic-fixture", capabilities: ["structured-output"] } })
assert.throws(() => advance(run, "tool-or-job"), (error) => error instanceof BrainTransitionError && error.code === "job-required")
run = advance(run, "tool-or-job", { job: { id: "job-1", correlationId: run.correlationId, goal: run.request, state: "completed", approval: "approved", steps: [], artifactIds: [] } })
run = advance(run, "evaluate", { evaluation: { evaluator: "fixture", version: "1", passed: true, checks: [{ id: "bounded", passed: true, message: "No unrestricted authority" }] } })
run = advance(run, "result")

assert.equal(run.stage, "result")
assert.equal(run.history.length, 10)
assert.throws(() => advance(run, "request"), (error) => error instanceof BrainTransitionError && error.code === "invalid-stage")
assert.throws(() => createBrainRun({ id: "empty", correlationId: "corr-2", request: "  " }), (error) => error instanceof BrainTransitionError && error.code === "invalid-summary")
console.log("Brain runtime audit passed: ordered stages, explicit approval, bounded jobs, terminal evaluation, safe summaries and invalid transition rejection")
