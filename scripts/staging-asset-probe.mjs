// Local draft: creates an upload session only; it never uploads or deploys assets.
export async function probe(account, token, request = fetch) {
  if (!/^[a-f0-9]{32}$/.test(account) || !token) throw new Error('Invalid credentials')
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/hegeva-ai-v3-v0-staging/assets-upload-session`
  try {
    const response = await request(url, {
      method: 'POST', redirect: 'error',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ manifest: { '/hegeva-staging-probe.txt': { hash: 'c160df79571160d749e2e8881fce87b8', size: 21 } } }),
    })
    if (!response.ok) return { status: response.status, result: 'BLOCKED' }
    const data = await response.json()
    const valid = data?.success === true && typeof data?.result?.jwt === 'string' && data.result.jwt.length > 0 && Array.isArray(data.result.buckets)
    return { status: response.status, result: valid ? 'SESSION_CREATED' : 'BLOCKED' }
  } catch {
    return { status: null, result: 'BLOCKED' }
  }
}
