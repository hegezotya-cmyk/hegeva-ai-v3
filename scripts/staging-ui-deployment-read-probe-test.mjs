import assert from "node:assert/strict"
import { probeStagingUiDeploymentRead } from "./staging-ui-deployment-read-probe.mjs"

for (const status of [200, 403, 401]) {
  const calls = []
  const fake = async (url, options) => { calls.push({ url, options }); return { status } }
  const result = await probeStagingUiDeploymentRead("a".repeat(32), "test-secret", fake)
  assert.deepEqual(result, { worker: "hegeva-ai-v3-v0-staging", method: "GET", status })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].options.method, "GET")
  assert.equal(calls[0].options.redirect, "error")
  assert.equal(calls[0].url, "https://api.cloudflare.com/client/v4/accounts/" + "a".repeat(32) + "/workers/scripts/hegeva-ai-v3-v0-staging/deployments?per_page=1")
  assert.ok(!JSON.stringify(result).includes("test-secret"))
}
await assert.rejects(() => probeStagingUiDeploymentRead("invalid", "test-secret"))
await assert.rejects(() => probeStagingUiDeploymentRead("a".repeat(32), ""))
const failed = await probeStagingUiDeploymentRead("a".repeat(32), "test-secret", async () => { throw Error("offline") })
assert.equal(failed.status, null)
console.log("Staging UI read-only deployment permission probe: PASS")
