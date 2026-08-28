import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
const source = fs.readFileSync(new URL("../lib/security-guard.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { evaluateSecurityGuard } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const base = { action: "run-tool", category: "execute", userId: "u1", workspaceId: "w1", permission: "tool:run", risk: "high" }
assert.equal(evaluateSecurityGuard(base).outcome, "approval-required")
assert.equal(evaluateSecurityGuard({ ...base, approved: true }).outcome, "allow")
assert.equal(evaluateSecurityGuard({ ...base, userId: undefined, approved: true }).reasonCode, "ownership-scope-required")
assert.equal(evaluateSecurityGuard({ ...base, approved: false }).outcome, "deny")
console.log("Security Guard audit passed")
