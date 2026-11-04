import assert from "node:assert/strict"
import { inspectStagingConfigurationAccess, inspectStagingWorkers } from "./staging-metadata-probe.mjs"

const account = "a".repeat(32)
const apiCurrent = "11111111-1111-4111-8111-111111111111"
const uiCurrent = "22222222-2222-4222-8222-222222222222"
const apiRollback = "3fdeef54-c692-425f-9408-40e0dcbffc2d"
const uiRollback = "d42743d3-d554-4314-9134-f1f0dd50848d"

function response(status, body) {
  return { status, async json() { return body } }
}

function requestFor({ apiDeployments, uiDeployments, versions = {}, status = 200 }) {
  const calls = []
  const request = async (url, options) => {
    calls.push({ url, options })
    if (status !== 200) return response(status, { success: false, errors: [{ code: status, message: "redacted" }] })
    const worker = url.includes("hegeva-ai-v3-v0-staging") ? "ui" : "api"
    if (url.endsWith("/deployments?per_page=1")) return response(200, { success: true, result: { deployments: worker === "api" ? apiDeployments : uiDeployments } })
    const version = url.match(/\/versions\/([0-9a-f-]+)$/i)?.[1]
    return response(200, { success: versions[version] !== false, result: versions[version] === false ? null : { id: version } })
  }
  return { request, calls }
}

const valid = (deploymentId, versionId) => [{ id: deploymentId, versions: [{ version_id: versionId, percentage: 100 }] }]
const good = requestFor({
  apiDeployments: valid("aaaaaaa1-1111-4111-8111-111111111111", apiCurrent),
  uiDeployments: valid("bbbbbbb2-2222-4222-8222-222222222222", uiCurrent),
  versions: { [apiCurrent]: true, [uiCurrent]: true, [apiRollback]: true, [uiRollback]: true },
})
const report = await inspectStagingWorkers(account, "secret", good.request)
assert.equal(report.result, "ROLLBACK_VERIFIED")
assert.equal(report.workers.api.activeDeploymentId, "aaaaaaa1-1111-4111-8111-111111111111")
assert.deepEqual(report.workers.ui.traffic, [{ versionId: uiCurrent, percentage: 100 }])
assert.equal(report.workers.api.rollbackVersionAvailable, true)
assert.ok(good.calls.every(({ options }) => options.method === "GET" && options.redirect === "error"))
assert.ok(!JSON.stringify(report).includes("secret"))

const split = requestFor({
  apiDeployments: valid("aaaaaaa1-1111-4111-8111-111111111111", apiCurrent),
  uiDeployments: [{ id: "bbbbbbb2-2222-4222-8222-222222222222", versions: [{ version_id: uiCurrent, percentage: 60 }, { version_id: apiCurrent, percentage: 40 }] }],
  versions: { [apiCurrent]: true, [uiCurrent]: true, [apiRollback]: true, [uiRollback]: true },
})
assert.equal((await inspectStagingWorkers(account, "secret", split.request)).workers.ui.traffic[0].percentage, 60)

const missingRollback = requestFor({
  apiDeployments: valid("aaaaaaa1-1111-4111-8111-111111111111", apiCurrent),
  uiDeployments: valid("bbbbbbb2-2222-4222-8222-222222222222", uiCurrent),
  versions: { [apiCurrent]: true, [uiCurrent]: true, [apiRollback]: false, [uiRollback]: true },
})
assert.equal((await inspectStagingWorkers(account, "secret", missingRollback.request)).result, "ROLLBACK_NOT_VERIFIED_DEPLOY_BLOCKED")

const malformed = requestFor({ apiDeployments: [], uiDeployments: valid("bbbbbbb2-2222-4222-8222-222222222222", uiCurrent) })
assert.equal((await inspectStagingWorkers(account, "secret", malformed.request)).result, "ROLLBACK_NOT_VERIFIED_DEPLOY_BLOCKED")

const denied = requestFor({ apiDeployments: [], uiDeployments: [], status: 403 })
const deniedReport = await inspectStagingWorkers(account, "secret", denied.request)
assert.equal(deniedReport.result, "ROLLBACK_NOT_VERIFIED_DEPLOY_BLOCKED")
assert.equal(deniedReport.workers.api.error, "forbidden")

for (const [status, expected] of [[404, "not_found"], [429, "rate_limited"]]) {
  const unavailable = requestFor({ apiDeployments: [], uiDeployments: [], status })
  assert.equal((await inspectStagingWorkers(account, "secret", unavailable.request)).workers.api.error, expected)
}

const offline = await inspectStagingWorkers(account, "secret", async () => { throw new Error("network unavailable") })
assert.equal(offline.workers.api.error, "network_error")

const configuration = await inspectStagingConfigurationAccess(account, "secret", async (url) => {
  if (url.includes("/routes")) return response(403, { success: false })
  return response(200, { success: true })
})
assert.equal(configuration.result, "CONFIGURATION_ACCESS_BLOCKED")
assert.equal(configuration.checks.find(({ check }) => check === "routes").error, "forbidden")
assert.ok(!JSON.stringify(configuration).includes("secret"))

await assert.rejects(() => inspectStagingWorkers("bad", "secret", good.request))
console.log("Staging metadata probe tests PASS: active versions, traffic split, rollback availability and errors")
