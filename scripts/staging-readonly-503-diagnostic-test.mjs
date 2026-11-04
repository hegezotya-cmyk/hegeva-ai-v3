import assert from 'node:assert/strict'
import { diagnose, TARGET, CHECKS } from './staging-readonly-503-diagnostic.mjs'

const logs = [], requests = []
const sequence = [503, 200, 401]
const fakeFetch = async (url, options) => {
  requests.push({url, options})
  return { status: sequence.shift(), headers: { get: key => key === 'cf-ray' ? 'abc123-LHR' : null }, body: { cancel: async () => {} } }
}
const ok = await diagnose({
  fetchFn: fakeFetch, pause: async () => {}, log: x => logs.push(JSON.parse(x)),
  checks: [CHECKS[0], CHECKS[5]], retries: [0]
})
assert.equal(ok, false, 'An initial 503 is never treated as a PASS')
assert.equal(requests.length, 3)
assert.ok(requests.every(r => r.url.startsWith(TARGET) && r.options.method === 'GET'))
assert.ok(requests.every(r => r.options.redirect === 'manual'))
assert.equal(logs.find(x => x.summary === CHECKS[0].name).recovered_after_503, true)
assert.equal(logs.at(-1).initial_failures, 1)
assert.equal(logs[0].cf_ray, 'abc123-LHR')
assert.ok(!logs.some(x => /token|cookie|authorization|email=/i.test(JSON.stringify(x))))
const clean = []
const pass = await diagnose({
  fetchFn: async () => ({status: 401, headers: {get: () => null}}),
  log: x => clean.push(JSON.parse(x)),
  checks: [CHECKS[5]], retries: [], pause: async () => {}
})
assert.equal(pass, true)
assert.equal(clean.at(-1).result, 'PASS')
await assert.rejects(() => diagnose({checks: [{name: 'unsafe', path: '/api/billing/confirm', expected: 410}]}), /Unapproved check/)
console.log('staging read-only 503 diagnostic self-test PASS')
