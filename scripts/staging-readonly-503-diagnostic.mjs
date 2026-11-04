// Staging-only, GET-only diagnostic. Never turns an initial 503 into a PASS.
import { pathToFileURL } from 'node:url'

export const TARGET = 'https://staging.hegevaai.co.uk'
export const CHECKS = Object.freeze([
  { name: 'invoices', path: '/business/invoices', expected: 200 },
  { name: 'tools', path: '/business/tools', expected: 200 },
  { name: 'contact', path: '/contact', expected: 200 },
  { name: 'reset-password', path: '/reset-password', expected: 200 },
  { name: 'email-status', path: '/api/system/email-status', expected: 200 },
  { name: 'billing-auth', path: '/api/billing/status', expected: 401 },
  { name: 'workspace-customers-auth', path: '/api/workspace/customers', expected: 401 },
  { name: 'contact-method', path: '/api/contact', expected: 405 },
])

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const safeRay = value => /^[a-zA-Z0-9-]{1,100}$/.test(value || '') ? value : null

export async function diagnose({ fetchFn = fetch, pause = sleep, log = console.log, checks = CHECKS, retries = [500, 1500], timeoutMs = 10000 } = {}) {
  let initialFailures = 0
  for (const check of checks) {
    if (!CHECKS.some(x => x.path === check.path && x.expected === check.expected)) throw new Error('Unapproved check')
    const samples = []
    for (let attempt = 0; attempt <= retries.length; attempt++) {
      if (attempt > 0) await pause(retries[attempt - 1])
      const started = performance.now()
      const at = new Date().toISOString()
      let status = null
      let ray = null
      let error = null
      try {
        const response = await fetchFn(TARGET + check.path, {
          method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(timeoutMs),
          headers: { 'user-agent': 'HEGEVA-staging-readonly-diagnostic/1.0', 'cache-control': 'no-cache' }
        })
        status = response.status
        ray = safeRay(response.headers?.get('cf-ray'))
        await response.body?.cancel?.().catch?.(() => {})
      } catch {
        error = 'request_failure'
      }
      const sample = { name: check.name, path: check.path, attempt: attempt + 1, at, duration_ms: Math.round(performance.now() - started), status, cf_ray: ray, error }
      samples.push(sample)
      log(JSON.stringify(sample))
      // Retry only intermittent 503 responses, not auth failures or other unexpected status codes.
      if (status !== 503) break
    }
    const initialPassed = samples[0].status === check.expected
    if (!initialPassed) initialFailures++
    log(JSON.stringify({ summary: check.name, initial: samples[0].status, expected: check.expected, initial_pass: initialPassed, recovered_after_503: !initialPassed && samples[0].status === 503 && samples.at(-1).status === check.expected }))
  }
  log(JSON.stringify({ result: initialFailures === 0 ? 'PASS' : 'FAIL', initial_failures: initialFailures, total: checks.length, note: 'A recovered 503 remains an initial failure.' }))
  return initialFailures === 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ok = await diagnose()
  if (!ok) process.exitCode = 1
}
