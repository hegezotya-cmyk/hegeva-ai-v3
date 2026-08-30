import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source = fs.readFileSync(new URL("../lib/foundation/roadmap-foundations.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { createCompanionProjection, createWorkspacePulseProjection, DEFAULT_COMPANION } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)

assert.equal(DEFAULT_COMPANION.mayImpersonateHuman, false)
assert.equal(DEFAULT_COMPANION.mayInferEmotion, false)
for (const scope of ["authenticated-cloud", "local-browser"]) {
  const pulse = createWorkspacePulseProjection({ scope, hasRecords: true, openTasks: 2, missionState: "awaiting-approval" })
  const projection = createCompanionProjection({ pulse, scope, customers: 2, openTasks: 2, documents: 1, suggestions: ["Review priorities", "Plan next steps", "Open planner", "ignored"] })
  assert.equal(projection.scope, scope)
  assert.equal(projection.userControlled, true)
  assert.equal(projection.suggestions.length, 3)
  assert(projection.context.every((entry) => entry.length <= 120))
  assert(projection.context.every((entry) => !/user|email|prompt|id:|token|secret/i.test(entry)))
}

const empty = createCompanionProjection({ pulse: createWorkspacePulseProjection({ scope: "authenticated-cloud", hasRecords: false, openTasks: 0, missionState: "awaiting-approval" }), scope: "authenticated-cloud", customers: 0, openTasks: 0, documents: 0, suggestions: [] })
assert(empty.context.some((entry) => /No workspace data available/.test(entry)))
assert(empty.suggestions.length === 0)

const assistant = fs.readFileSync(new URL("../components/assistant/assistant-chat.tsx", import.meta.url), "utf8")
assert(assistant.includes("createCompanionProjection"))
assert(assistant.includes("onClick={()=>setMessage(suggestion)}"))
assert(!/reserveAIUsage|startX20Action|env\.AI|localStorage\.setItem/.test(assistant))

console.log("Companion layer audit passed: Pulse-only bounded context, scoped state, inert suggestions and no provider or mutation path")
