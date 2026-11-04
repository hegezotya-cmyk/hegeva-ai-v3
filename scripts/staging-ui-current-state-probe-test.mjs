import assert from "node:assert/strict"
import { inspectStagingUiCurrentState } from "./staging-ui-current-state-probe.mjs"

const newId = "c5fb08c8-fbec-439f-88c2-9cdcc0d75b6f"
const oldId = "cc024394-65dd-4ce0-b5d8-97dd67ae05a4"
const account = "a".repeat(32)
function mock(current, status = 200, latest = newId) {
  const calls = []
  const request = async (url, options) => {
    calls.push({ url, method: options.method, redirect: options.redirect, header: options.headers.Authorization })
    return { status, async json() {
      return url.includes("/versions?")
        ? { success: true, result: { items: [{ id: latest, metadata: { created_on: "2026-11-04T04:47:33Z", author_email: "sensitive@example.com" } }] } }
        : { success: true, result: { deployments: [{ versions: current }] } }
    } }
  }
  return { request, calls }
}
const old = mock([{ version_id: oldId, percentage: 100 }])
const result = await inspectStagingUiCurrentState(account, "test-secret", old.request)
assert.equal(result.verified, true)
assert.equal(result.latestUploadedVersion, newId)
assert.equal(result.latestIsActive, false)
assert.deepEqual(result.currentActiveVersions, [{ version: oldId, percentage: 100 }])
assert.equal(result.latestCreatedAt, "2026-11-04T04:47:33Z")
assert.equal(old.calls.length, 2)
assert.ok(old.calls.every(c => c.method === "GET" && c.redirect === "error"))
assert.ok(old.calls.every(c => c.url.includes("/workers/scripts/hegeva-ai-v3-v0-staging/")))
assert.ok(!JSON.stringify(result).includes("test-secret"))
assert.ok(!JSON.stringify(result).includes("sensitive@example.com"))

const active = mock([{ version_id: newId, percentage: 100 }])
assert.equal((await inspectStagingUiCurrentState(account, "test-secret", active.request)).latestIsActive, true)
const unknown = mock([{ version_id: oldId, percentage: 50 }])
assert.equal((await inspectStagingUiCurrentState(account, "test-secret", unknown.request)).verified, false)
const denied = mock([], 403)
const blocked = await inspectStagingUiCurrentState(account, "test-secret", denied.request)
assert.equal(blocked.verified, false)
assert.equal(blocked.deploymentsReadStatus, 403)
assert.equal(blocked.versionsReadStatus, 403)
assert.ok(denied.calls.every(c => c.method === "GET"))
const offline = await inspectStagingUiCurrentState(account, "test-secret", async () => { throw Error("unavailable") })
assert.equal(offline.verified, false)
assert.equal(offline.latestIsActive, null)
await assert.rejects(() => inspectStagingUiCurrentState("invalid", "secret"))
await assert.rejects(() => inspectStagingUiCurrentState(account, ""))
console.log("Staging UI current state read-only probe: PASS")
