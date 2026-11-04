// Read-only check of deployment API access for the isolated staging UI Worker.
// Does not upload, activate or change a Worker version.
export async function probeStagingUiDeploymentRead(account, token, request = fetch) {
  if (!/^[a-f0-9]{32}$/.test(account) || typeof token !== "string" || !token.trim()) {
    throw new Error("Missing staging API credentials")
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/hegeva-ai-v3-v0-staging/deployments?per_page=1`
  try {
    const response = await request(url, {
      method: "GET",
      redirect: "error",
      headers: { Authorization: `Bearer ${token}` },
    })
    return { worker: "hegeva-ai-v3-v0-staging", method: "GET", status: response.status }
  } catch {
    return { worker: "hegeva-ai-v3-v0-staging", method: "GET", status: null }
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const result = await probeStagingUiDeploymentRead(
    process.env.CLOUDFLARE_ACCOUNT_ID || "",
    process.env.CLOUDFLARE_API_TOKEN || "",
  )
  console.log(JSON.stringify(result))
  if (result.status !== 200) process.exitCode = 1
}
