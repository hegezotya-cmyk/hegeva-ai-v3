// Offline staging branch-policy regression: checks can run on PR branches,
// while any credentialed work remains gated by the protected staging environment.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const workflow = readFileSync(new URL("../.github/workflows/staging-deploy.yml", import.meta.url), "utf8")
function job(name, nextName) {
  const match = workflow.match(new RegExp("\\n  " + name + ":\\n([\\s\\S]*?)\\n  " + nextName + ":"))
  assert.ok(match, "Missing or reordered staging " + name + " job")
  return match[1]
}
const verify = job("verify", "preflight")
const preflight = job("preflight", "deploy")
const deploy = job("deploy", "ui-deployment-read-probe")

assert.match(verify, /runs-on: ubuntu-latest/)
assert.doesNotMatch(verify, /environment:\s*staging/, "Offline verification must not depend on staging branch protection")
assert.doesNotMatch(verify, /secrets\./, "Offline verification cannot request deployment secrets")
assert.match(verify, /scripts\/staging-isolation-audit\.mjs/)
assert.match(preflight, /inputs\.stage != 'check'/, "Offline check must skip protected preflight")
assert.match(preflight, /environment: staging/, "Preflight for deployments must retain environment protection")
assert.match(preflight, /secrets\.CLOUDFLARE_STAGING_API_TOKEN/, "Staging credential remains protected")
assert.match(deploy, /needs: \[verify, preflight\]/, "Deploy requires verification and protected preflight")
assert.match(deploy, /environment: staging/, "Deployment must stay protected")
assert.match(deploy, /inputs\.stage != 'check'/, "Check must never deploy")
assert.match(deploy, /npm run staging:ui:deploy/, "Deployment path must not be bypassed")
console.log("Staging check branch isolation: PASS (offline check only; deploy protected)")
