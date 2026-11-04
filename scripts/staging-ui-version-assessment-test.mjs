import assert from "node:assert/strict"
import { assessStagingUiVersion } from "./staging-ui-version-assessment.mjs"
const id = "cc024394-65dd-4ce0-b5d8-97dd67ae05a4"
const account = "a".repeat(32)
const calls = []
const mock = async (url, options) => {
  calls.push({ url, options })
  return { status: 200, async json() {
    return url.endsWith("/versions/" + id)
      ? { success: true, result: { id } }
      : { success: true, result: { deployments: [{ versions: [{ version_id: "49752f6a-12ed-4667-82a5-cf1f8e83d2d2", percentage: 100 }] }] } }
  } }
}
const a = await assessStagingUiVersion(account, "secret", id, mock)
assert.equal(a.versionVerified, true)
assert.equal(a.readyForReview, true)
assert.equal(a.currentDeploymentVerified, true)
assert.equal(a.alreadyDeployed, false)
assert.equal(calls.length, 2)
assert.ok(calls.every(c => c.options.method === "GET" && c.options.redirect === "error"))
assert.ok(calls.every(c => c.url.includes("/workers/scripts/hegeva-ai-v3-v0-staging/")))
assert.ok(!JSON.stringify(a).includes("secret"))
assert.ok(!JSON.stringify(a).includes("49752f6a"))
const active = await assessStagingUiVersion(account, "secret", id, async (url) => ({
  status: 200, async json() {
    return url.endsWith("/versions/" + id)
      ? { success: true, result: { id } }
      : { success: true, result: { deployments: [{ versions: [{ version_id: id, percentage: 100 }] }] } }
  },
}))
assert.equal(active.alreadyDeployed, true)
assert.equal(active.readyForReview, false)

// An older historical deployment must not be confused with the active version.
const historical = await assessStagingUiVersion(account, "secret", id, async (url) => ({
  status: 200, async json() {
    return url.endsWith("/versions/" + id)
      ? { success: true, result: { id } }
      : { success: true, result: { deployments: [
          { versions: [{ version_id: "49752f6a-12ed-4667-82a5-cf1f8e83d2d2", percentage: 100 }] },
          { versions: [{ version_id: id, percentage: 100 }] },
        ] } }
  },
}))
assert.equal(historical.currentDeploymentVerified, true)
assert.equal(historical.alreadyDeployed, false)
assert.equal(historical.readyForReview, true)

// Absent or malformed current deployment cannot authorize a proposal.
for (const deployments of [[], [{ versions: [] }], [{ versions: [{ version_id: id, percentage: 50 }] }]]) {
  const uncertain = await assessStagingUiVersion(account, "secret", id, async (url) => ({
    status: 200, async json() {
      return url.endsWith("/versions/" + id)
        ? { success: true, result: { id } }
        : { success: true, result: { deployments } }
    },
  }))
  assert.equal(uncertain.currentDeploymentVerified, false)
  assert.equal(uncertain.readyForReview, false)
}

const forbidden = await assessStagingUiVersion(account, "secret", id, async () => ({ status: 403 }))
assert.equal(forbidden.readyForReview, false)
assert.equal(forbidden.versionVerified, false)
await assert.rejects(() => assessStagingUiVersion(account, "secret", "invalid", mock))
await assert.rejects(() => assessStagingUiVersion("invalid", "secret", id, mock))
console.log("Staging UI version assessment offline tests: PASS")
