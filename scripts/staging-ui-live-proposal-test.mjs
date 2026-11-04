import assert from "node:assert/strict"
import { reviewStagingActivation } from "./staging-ui-live-proposal.mjs"
const target = "cc024394-65dd-4ce0-b5d8-97dd67ae05a4"
const other = "49752f6a-12ed-4667-82a5-cf1f8e83d2d2"
const account = "a".repeat(32)
function mockApi(current, status = 200) {
  const calls = []
  const request = async (url, options) => {
    calls.push({ url, method: options.method, redirect: options.redirect })
    return { status, async json() {
      return url.endsWith("/versions/" + target)
        ? { success: true, result: { id: target } }
        : { success: true, result: { deployments: [{ id: "1".repeat(8) + "-1111-1111-1111-" + "1".repeat(12), versions: current }] } }
    } }
  }
  return { request, calls }
}
const ok = mockApi([{ version_id: other, percentage: 100 }])
const result = await reviewStagingActivation(account, "secret", ok.request)
assert.equal(result.executed, false)
assert.equal(result.proposal.action, "PROPOSAL_ONLY_NO_NETWORK")
assert.equal(result.proposal.requiresSeparateExplicitApproval, true)
assert.equal(result.proposal.currentDeploymentMustBeRechecked, true)
assert.equal(result.assessment.readyForReview, true)
assert.equal(ok.calls.length, 2)
assert.ok(ok.calls.every(c => c.method === "GET" && c.redirect === "error"))
assert.ok(ok.calls.every(c => c.url.includes("/workers/scripts/hegeva-ai-v3-v0-staging/")))
assert.ok(!JSON.stringify(result).includes("secret"))
for (const current of [[{ version_id: target, percentage: 100 }], [], [{ version_id: other, percentage: 50 }]]) {
  const unsafe = mockApi(current)
  await assert.rejects(() => reviewStagingActivation(account, "secret", unsafe.request))
  assert.ok(unsafe.calls.every(c => c.method === "GET"))
}
const denied = mockApi([{ version_id: other, percentage: 100 }], 403)
await assert.rejects(() => reviewStagingActivation(account, "secret", denied.request))
assert.ok(denied.calls.every(c => c.method === "GET"))
console.log("Fresh staging deployment proposal test: PASS (read-only, fail-closed, no deployment)")
