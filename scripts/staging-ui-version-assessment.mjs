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
  const items = Array.isArray(deployments.result?.deployments)
    ? deployments.result.deployments
    : Array.isArray(deployments.result) ? deployments.result : []
  const active = deployments.status === 200 && items.some(d => Array.isArray(d?.versions) && d.versions.some(v => v.version_id === version && v.percentage > 0))
  return {
    worker: NAME, version, versionReadStatus: uploaded.status,
    deploymentsReadStatus: deployments.status,
    versionVerified: Boolean(exists), alreadyDeployed: Boolean(active),
    // No activation allowed: this is a read-only assessment, not a release decision.
    readyForReview: Boolean(exists && deployments.status === 200 && !active),
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
