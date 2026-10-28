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
// Inspect actual exported headers, including an accidentally enabled test flag.
const previousEnv = process.env.NODE_ENV
const previousFlag = process.env.HEGEVA_UI_TEST
try {
  process.env.NODE_ENV = "production"
  for (const flag of [undefined, "1"]) {
    if (flag === undefined) delete process.env.HEGEVA_UI_TEST
    else process.env.HEGEVA_UI_TEST = flag
    const { default: nextConfig } = await import(new URL(`../next.config.mjs?csp-audit=${flag ?? "unset"}`, import.meta.url))
    const headers = await nextConfig.headers()
    const csp = headers.flatMap(entry => entry.headers).find(header => header.key === "Content-Security-Policy")
    assert.ok(csp, "Production CSP must exist")
    assert.doesNotMatch(csp.value, /unsafe-eval/, `Production CSP with HEGEVA_UI_TEST=${flag}`)
  }
} finally {
  if (previousEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = previousEnv
  if (previousFlag === undefined) delete process.env.HEGEVA_UI_TEST
  else process.env.HEGEVA_UI_TEST = previousFlag
}
console.log("Customer reengagement safety audit passed: copy-only preview, no transport/storage, account guard, preserved fields and development-only test CSP.")
