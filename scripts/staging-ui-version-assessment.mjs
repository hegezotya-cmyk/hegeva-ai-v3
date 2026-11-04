// Read-only release assessment for the HEGEVA staging UI Worker.
// Never activates or uploads versions. Avoid printing Cloudflare token or response bodies.
const NAME = "hegeva-ai-v3-v0-staging"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function assessStagingUiVersion(account, token, version, request = fetch) {
  if (!/^[0-9a-f]{32}$/.test(account) || typeof token !== "string" || !token.trim()) throw Error("Invalid staging credentials")
  if (!UUID.test(version)) throw Error("Invalid Worker version ID")
  const base = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${NAME}`
  const get = async (path) => {
    try {
      const response = await request(base + path, {
        method: "GET", redirect: "error",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status !== 200) return { status: response.status, result: null }
      const body = await response.json()
      return { status: response.status, result: body?.success === true ? body.result : null }
    } catch { return { status: null, result: null } }
  }
  const [uploaded, deployments] = await Promise.all([
    get(`/versions/${version}`),
    get("/deployments?per_page=5"),
  ])
  const exists = uploaded.status === 200 && uploaded.result?.id === version
  // Cloudflare lists the CURRENT traffic-serving deployment first; older entries
  // are history and must not be treated as active.
  const items = deployments.result?.deployments
  const current = Array.isArray(items) ? items[0] : null
  const versions = current?.versions
  const validCurrent = deployments.status === 200 && Array.isArray(versions) &&
    versions.length > 0 && versions.every(v =>
      UUID.test(v?.version_id || "") && Number.isFinite(v?.percentage) &&
      v.percentage > 0 && v.percentage <= 100
    ) && Math.abs(versions.reduce((sum, v) => sum + v.percentage, 0) - 100) < 0.000001
  const active = validCurrent && versions.some(v => v.version_id === version)
  return {
    worker: NAME, version, versionReadStatus: uploaded.status,
    deploymentsReadStatus: deployments.status,
    versionVerified: Boolean(exists), currentDeploymentVerified: Boolean(validCurrent),
    alreadyDeployed: Boolean(active),
    // Incomplete/malformed deployment data is NOT proof of inactivity.
    readyForReview: Boolean(exists && validCurrent && !active),
  }
}

const isCli = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href
if (isCli) {
  const result = await assessStagingUiVersion(
    process.env.CLOUDFLARE_ACCOUNT_ID || "",
    process.env.CLOUDFLARE_API_TOKEN || "",
    process.env.HEGEVA_STAGING_VERSION_ID || "",
  )
  console.log(JSON.stringify(result))
  if (!result.versionVerified || result.deploymentsReadStatus !== 200) process.exitCode = 1
}
