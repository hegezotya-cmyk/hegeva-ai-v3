const API_ROOT = "https://api.cloudflare.com/client/v4"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const WORKERS = {
  api: { script: "hegeva-ai-v3-staging", rollbackVersionId: "3fdeef54-c692-425f-9408-40e0dcbffc2d" },
  ui: { script: "hegeva-ai-v3-v0-staging", rollbackVersionId: "d42743d3-d554-4314-9134-f1f0dd50848d" },
}

function validateCredentials(account, token) {
  if (!/^[a-f0-9]{32}$/.test(account) || !token) throw new Error("Invalid credentials")
}

function safeError(status) {
  if (status === 403) return "forbidden"
  if (status === 404) return "not_found"
  if (status === 429) return "rate_limited"
  if (status === null) return "network_error"
  return `http_${status}`
}

async function readOnlyJson(request, url, token) {
  try {
    const response = await request(url, {
      method: "GET",
      redirect: "error",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status !== 200) return { ok: false, error: safeError(response.status) }
    try {
      return { ok: true, body: await response.json() }
    } catch {
      return { ok: false, error: "invalid_json" }
    }
  } catch {
    return { ok: false, error: "network_error" }
  }
}

function trafficFor(deployment) {
  if (!deployment || !UUID.test(deployment.id) || !Array.isArray(deployment.versions) || deployment.versions.length === 0) return null
  const traffic = deployment.versions.map(({ version_id: versionId, percentage }) => ({ versionId, percentage }))
  if (!traffic.every(({ versionId, percentage }) => UUID.test(versionId) && Number.isFinite(percentage) && percentage > 0 && percentage <= 100)) return null
  const total = traffic.reduce((sum, { percentage }) => sum + percentage, 0)
  return Math.abs(total - 100) < 0.0001 ? traffic : null
}

async function inspectWorker(account, token, worker, request) {
  const base = `${API_ROOT}/accounts/${account}/workers/scripts/${worker.script}`
  const report = {
    activeDeploymentId: null,
    traffic: [],
    activeVersionIds: [],
    rollbackVersionId: worker.rollbackVersionId,
    rollbackVersionAvailable: false,
  }
  const deployments = await readOnlyJson(request, `${base}/deployments?per_page=1`, token)
  if (!deployments.ok) return { ...report, error: deployments.error }

  const deployment = deployments.body?.result?.deployments?.[0]
  const traffic = trafficFor(deployment)
  if (!traffic) return { ...report, error: "invalid_deployment_response" }
  report.activeDeploymentId = deployment.id
  report.traffic = traffic
  report.activeVersionIds = traffic.map(({ versionId }) => versionId)

  const versionIds = [...new Set([...report.activeVersionIds, worker.rollbackVersionId])]
  const versions = await Promise.all(versionIds.map(async (versionId) => ({
    versionId,
    result: await readOnlyJson(request, `${base}/versions/${versionId}`, token),
  })))
  const failed = versions.find(({ versionId, result }) => !result.ok || result.body?.result?.id !== versionId)
  if (failed) return { ...report, error: failed.result.ok ? "invalid_version_response" : failed.result.error }
  return { ...report, rollbackVersionAvailable: true }
}

export async function inspectStagingWorkers(account, token, request = fetch) {
  validateCredentials(account, token)
  const workers = Object.fromEntries(await Promise.all(Object.entries(WORKERS).map(async ([key, worker]) => [key, await inspectWorker(account, token, worker, request)])))
  const verified = Object.values(workers).every((worker) => !worker.error && worker.rollbackVersionAvailable)
  return { result: verified ? "ROLLBACK_VERIFIED" : "ROLLBACK_NOT_VERIFIED_DEPLOY_BLOCKED", workers }
}

const CONFIGURATION_CHECKS = [
  ["bindings", "/workers/services/hegeva-ai-v3-staging/environments/production/bindings"],
  ["routes", "/workers/services/hegeva-ai-v3-staging/environments/production/routes?show_zonename=true"],
  ["domains", "/workers/domains/records?page=0&per_page=5&service=hegeva-ai-v3-staging&environment=production"],
  ["subdomain", "/workers/services/hegeva-ai-v3-staging/environments/production/subdomain"],
  ["environment", "/workers/services/hegeva-ai-v3-staging/environments/production"],
  ["schedules", "/workers/scripts/hegeva-ai-v3-staging/schedules"],
]

export async function inspectStagingConfigurationAccess(account, token, request = fetch) {
  validateCredentials(account, token)
  const checks = await Promise.all(CONFIGURATION_CHECKS.map(async ([check, path]) => {
    const result = await readOnlyJson(request, `${API_ROOT}/accounts/${account}${path}`, token)
    return result.ok ? { check, status: 200 } : { check, status: null, error: result.error }
  }))
  return {
    result: checks.every(({ status }) => status === 200) ? "CONFIGURATION_ACCESS_VERIFIED" : "CONFIGURATION_ACCESS_BLOCKED",
    checks,
  }
}

export async function inspectStagingReadiness(account, token, request = fetch) {
  const [rollback, configuration] = await Promise.all([
    inspectStagingWorkers(account, token, request),
    inspectStagingConfigurationAccess(account, token, request),
  ])
  return {
    result: rollback.result === "ROLLBACK_VERIFIED" && configuration.result === "CONFIGURATION_ACCESS_VERIFIED"
      ? "STAGING_READINESS_VERIFIED"
      : "STAGING_READINESS_NOT_VERIFIED_DEPLOY_BLOCKED",
    rollback,
    configuration,
  }
}

// Compatibility export for callers that need only configuration access checks.
export async function probe(account, token, request = fetch) {
  return (await inspectStagingConfigurationAccess(account, token, request)).checks
}
