export async function probe(account, token, request = fetch) {
  if (!/^[a-f0-9]{32}$/.test(account) || !token) throw new Error('Invalid credentials')
  const base = `https://api.cloudflare.com/client/v4/accounts/${account}/workers`
  const name = 'hegeva-ai-v3-staging'
  const env = 'production'
  const checks = [
    ['bindings', `${base}/services/${name}/environments/${env}/bindings`],
    ['routes', `${base}/services/${name}/environments/${env}/routes?show_zonename=true`],
    ['domains', `${base}/domains/records?page=0&per_page=5&service=${name}&environment=${env}`],
    ['subdomain', `${base}/services/${name}/environments/${env}/subdomain`],
    ['environment', `${base}/services/${name}/environments/${env}`],
    ['schedules', `${base}/scripts/${name}/schedules`],
  ]
  const results = []
  for (const [check, url] of checks) {
    try {
      const response = await request(url, {method:'GET', redirect:'error', headers:{Authorization:`Bearer ${token}`}})
      results.push({check, status:response.status})
    } catch { results.push({check, status:null}) }
  }
  return results
}
