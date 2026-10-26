import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const workflow = readFileSync(new URL("../.github/workflows/staging-deploy.yml", import.meta.url), "utf8")
const smoke = workflow.match(/- name: Smoke-test staging only\s+([\s\S]*?)(?=\n\s{2}- name:|\n\s{2}[a-z-]+:|$)/)

assert.ok(smoke, "Staging workflow must contain a named smoke-test step")
assert.match(smoke[1], /inputs\.stage == 'deploy-ui'/, "UI deployments must run the staging smoke test")
assert.match(smoke[1], /inputs\.stage == 'deploy-api-no-migrate'/, "Migration-free API deployments must run the staging smoke test")
assert.match(smoke[1], /HEGEVA_BASE_URL="\$STAGING_APP_URL" npm run release:smoke/, "Smoke test must reuse the full guarded route and auth-check suite")
assert.match(smoke[1], /https:\/\/staging\.hegevaai\.co\.uk/, "Smoke test must allow the canonical staging host")
assert.doesNotMatch(smoke[1], /https:\/\/hegevaai\.co\.uk\*/, "Smoke test must not target production")

console.log("Staging deployment smoke gate: PASS")
