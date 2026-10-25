export async function fetchPortalSnapshot(binding: { fetch: (url: string, init: RequestInit) => Promise<Response> }, environment: string | undefined, base: string | null, token: string): Promise<Response> {
  const allowed = environment === 'staging' ? 'https://staging.hegevaai.co.uk' : 'https://hegevaai.co.uk'
  if (base !== allowed) {
    throw new Error('Portal origin unavailable')
  }
  return binding.fetch(`${base}/api/client-portal/public/${encodeURIComponent(token)}`, { method: 'GET', redirect: 'manual' })
}
