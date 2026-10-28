import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
const read = path => readFileSync(new URL(path, import.meta.url), "utf8")
const preview = read("../components/business/customer-reengagement-preview.tsx")
const selector = read("../lib/customer-reengagement.ts")
const config = read("../next.config.mjs")
const workspace = read("../components/business/local-workspace.tsx")
assert.doesNotMatch(preview, /\bfetch\s*\(|localStorage|sessionStorage|useWorkspaceData|trackActivationEvent|external-actions|authClient|setItems/)
assert.doesNotMatch(selector, /\bfetch\s*\(|localStorage|lastContact.*createdAt|updatedAt/)
assert.match(preview, /navigator\.clipboard\.writeText/)
assert.match(preview, /generation\.current === current/)
assert.match(workspace, /previewSelection\?\.identity === identity && syncState !== "checking"/)
assert.match(workspace, /\.\.\.existing/)
assert.match(config, /NODE_ENV === "development" && process\.env\.HEGEVA_UI_TEST === "1"/)
// Production must never receive the webpack-only local test CSP exception.
for (const NODE_ENV of ["production", "development"]) for (const flag of [undefined, "1"]) {
  const localTestEval = NODE_ENV === "development" && flag === "1" ? " 'unsafe-eval'" : ""
  assert.equal(localTestEval.includes("unsafe-eval"), NODE_ENV === "development" && flag === "1")
}
console.log("Customer reengagement safety audit passed: copy-only preview, no transport/storage, account guard, preserved fields and development-only test CSP.")
