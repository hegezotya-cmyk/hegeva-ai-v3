// Inspect current vs latest staging Worker versions after a partial Wrangler deploy.
// Strictly GET-only; no Worker activation, uploads, tokens or response bodies in output.
const NAME = "hegeva-ai-v3-v0-staging"
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function inspectStagingUiCurrentState(account, token, request = fetch) {
  if (!/^[0-9a-f]{32}$/.test(account) || typeof token !== "string" || !token.trim()) throw Error("Missing staging credentials")
  const base = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${NAME}`
  async function get(path) {
    try {
      const response = await request(base + path, { method: "GET", redirect: "error", headers: { Authorization: `Bearer ${token}` } })
      if (response.status !== 200) return { status: response.status, data: null }
      const body = await response.json()
      return { status: 200, data: body?.success === true ? body.result : null }
    } catch { return { status: null, data: null } }
  }
  const [deployments, versions] = await Promise.all([
    get("/deployments?per_page=1"),
    get("/versions?per_page=1"),
  ])
  const current = deployments.data?.deployments?.[0]?.versions
  const latest = versions.data?.items?.[0]
  const active = Array.isArray(current) && current.length > 0 &&
    current.every(v => ID.test(v?.version_id || "") && Number.isFinite(v.percentage) && v.percentage > 0 && v.percentage <= 100) &&
    Math.abs(current.reduce((sum, v) => sum + v.percentage, 0) - 100) < 0.000001
    ? current.map(v => ({ version: v.version_id, percentage: v.percentage })) : null
  const latestId = ID.test(latest?.id || "") ? latest.id : null
  return {
    worker: NAME, operation: "READ_ONLY",
    deploymentsReadStatus: deployments.status, versionsReadStatus: versions.status,
    latestUploadedVersion: latestId,
    latestCreatedAt: typeof latest?.metadata?.created_on === "string" ? latest.metadata.created_on : null,
    currentActiveVersions: active,
    latestIsActive: latestId && active ? active.some(v => v.version === latestId) : null,
    verified: deployments.status === 200 && versions.status === 200 && !!latestId && !!active,
  }
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const result = await inspectStagingUiCurrentState(process.env.CLOUDFLARE_ACCOUNT_ID || "", process.env.CLOUDFLARE_API_TOKEN || "")
  console.log(JSON.stringify(result))
  if (!result.verified) process.exitCode = 1
}
