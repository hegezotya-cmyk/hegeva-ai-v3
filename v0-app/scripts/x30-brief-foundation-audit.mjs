import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const root = new URL("../", import.meta.url)
const read = (file) => fs.readFileSync(new URL(file, root), "utf8")
const source = read("lib/x30/structured-brief.ts")
const page = read("app/app-studio/x30-alpha/page.tsx")
const schemaSource = read("lib/x30/schema.ts")
const load = (text) => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64")}`)
const brief = await load(source)
const schema = await load(schemaSource)

const base = { schemaVersion: "0.1", projectName: "Project Cedar Brief", domain: "professional-services", targetUsers: "Cedar operators", primaryGoal: "Coordinate Cedar follow-ups", requiredPages: ["Cedar overview", "Cedar contacts"], requiredCapabilities: ["records", "search", "filter", "create", "edit", "delete", "responsive", "local-persistence", "schedule"], visualDirection: "professional", language: "en", dataSensitivity: "internal", deploymentIntent: "preview-only", reviewState: "ready-for-review", approvalState: "not-requested", executionState: "not-started" }
assert.equal(brief.validateX30Brief(base).ok, true, "valid brief must validate")
const valid = brief.validateX30Brief(base).brief
const mapped = brief.mapX30BriefToSpec(valid, { eyebrow: "Workspace", title: "Structured preview", description: "Read-only", customers: "Customers", documents: "Documents", expenses: "Expenses", invoices: "Invoices", records: "Records", schedule: "Schedule", noValue: "—", plannerItem: "Planner item" }, { customers: 2, documents: 1, expenses: 3, invoices: 1, planner: 2 })
assert.equal(schema.validateX30Spec(mapped).ok, true, "mapped brief must pass X30AppSpec validation")
const mappedText = JSON.stringify(mapped)
for (const value of [base.projectName, base.targetUsers, base.primaryGoal, ...base.requiredPages]) assert(!mappedText.includes(value), "raw brief text must not enter the spec")
assert(mapped.nodes.every((node) => /^brief-/.test(node.id)), "mapped IDs must be deterministic presentation IDs")
assert.equal(brief.validateX30Brief({ ...base, domain: "unknown" }).ok, false, "unknown domains must fail closed")
assert.equal(brief.validateX30Brief({ ...base, requiredCapabilities: ["records", "records"] }).ok, false, "duplicate capabilities must fail")
assert.equal(brief.validateX30Brief(JSON.parse('{"__proto__":{},"schemaVersion":"0.1"}')).ok, false, "unsafe keys must fail")
assert.equal(brief.validateX30Brief({ ...base, projectName: 42 }).ok, false, "invalid types must fail")
assert.equal(brief.validateX30Brief({ ...base, projectName: "x".repeat(81) }).ok, false, "character bounds must fail")
assert.equal(brief.validateX30Brief({ ...base, projectName: "ű".repeat(80), primaryGoal: "goal" }).ok, true, "bounded unicode names remain valid")
assert(brief.X30_BRIEF_DOMAINS.length === 8 && brief.X30_BRIEF_CAPABILITIES.length === 12 && brief.X30_BRIEF_VISUAL_DIRECTIONS.length === 6, "all allowlists must remain explicit")
for (const locale of ["en", "hu", "de", "fr", "es"]) assert(page.includes(` ${locale}:{`), `page must retain ${locale} locale copy`)
for (const marker of ["Edit brief", "Review brief", "Approve preview", "Return to draft", "Execution not started", "not cloud-synced", "SafeX30Renderer", "type=\"button\""]) assert(page.includes(marker), `missing safe review marker: ${marker}`)
assert(!page.includes("fetch(") && !page.includes("server action") && !page.includes("localStorage"), "brief flow must have no provider, server or persistence path")
console.log("X30 Brief foundation audit passed: bounded v0.1 contract, deterministic safe mapping, review state and no-provider boundaries")
