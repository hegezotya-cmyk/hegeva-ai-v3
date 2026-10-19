import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source = fs.readFileSync(new URL("../lib/x30/domain-visual-intelligence.ts", import.meta.url), "utf8")
const page = fs.readFileSync(new URL("../app/app-studio/x30-alpha/page.tsx", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
const { deriveWorkspaceVisualDirection } = await import(moduleUrl)

const empty = deriveWorkspaceVisualDirection({ customerCount: 0, documentCount: 0, expenseCount: 0, invoiceCount: 0, plannerCount: 0 })
const finance = deriveWorkspaceVisualDirection({ customerCount: 1, documentCount: 0, expenseCount: 3, invoiceCount: 4, plannerCount: 0 })
const planner = deriveWorkspaceVisualDirection({ customerCount: 1, documentCount: 0, expenseCount: 0, invoiceCount: 0, plannerCount: 3 })
assert.equal(empty.industry, "Professional services", "empty/ambiguous summaries must use the safe neutral direction")
assert.equal(finance.industry, "Financial services", "finance-shaped aggregate data must map deterministically")
assert.equal(planner.industry, "Professional services", "ambiguous planner-only data must use the safe neutral direction")
assert.deepEqual(finance, deriveWorkspaceVisualDirection({ customerCount: 1, documentCount: 0, expenseCount: 3, invoiceCount: 4, plannerCount: 0 }), "mapping must be deterministic")
assert.equal(deriveWorkspaceVisualDirection({ customerCount: -1, documentCount: Number.NaN, expenseCount: 1e9, invoiceCount: 0, plannerCount: 0 }).industry, "Professional services", "invalid or unbounded counts must fall back safely")
assert(page.includes("deriveWorkspaceVisualDirection"), "X30 page must use the workspace projection")
assert(page.includes("cloud ? c.cloud : c.local") && page.includes("c.empty"), "cloud/local and empty states must remain explicit")
assert(!/setItems\(|reserveAIUsage|startX20Action|AI\.run|localStorage\.setItem/.test(page) && page.includes('fetch("/api/x30/generate"'), "X30 page must use only the explicit preview request without mutation paths")
assert(source.includes("WorkspaceVisualSummary") && source.includes("boundedCount"), "domain projection must consume bounded aggregate summaries")
assert(!source.includes("email") && !source.includes("userId") && !source.includes("prompt"), "domain projection must not consume identity or private content")

console.log("X30 Domain Intelligence audit passed: bounded deterministic workspace mapping, provenance separation and no side effects")
