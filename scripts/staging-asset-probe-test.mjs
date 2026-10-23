import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { probe } from './staging-asset-probe.mjs'
let calls = 0
const request = async (url, options) => {
  calls++
  assert.match(url, /^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/[a-f0-9]{32}\/workers\/scripts\/hegeva-ai-v3-v0-staging\/assets-upload-session$/)
  assert.equal(options.method, 'POST')
  assert.equal(options.redirect, 'error')
  assert.deepEqual(JSON.parse(options.body), { manifest: { '/hegeva-staging-probe.txt': {hash: 'c160df79571160d749e2e8881fce87b8', size: 21} } })
  return { status: 403, ok: false }
}
assert.deepEqual(await probe('a'.repeat(32), 'test-secret', request), { status: 403, result: 'BLOCKED' })
await assert.rejects(() => probe('invalid', 'test-secret', request))
assert.equal(calls, 1)
assert.deepEqual(await probe('a'.repeat(32), 'test-secret', async () => ({ok: true, status: 200, json: async () => ({ success: true, result: {jwt: 'sensitive', buckets: [[]]} })})), { status: 200, result: 'SESSION_CREATED' })
assert.deepEqual(await probe('a'.repeat(32), 'test-secret', async () => ({ok: true, status: 200, json: async () => ({ success: false })})), { status: 200, result: 'BLOCKED' })
assert.deepEqual(await probe('a'.repeat(32), 'test-secret', async () => { throw new Error('test-secret') }), {status: null, result: 'BLOCKED'})
const workflow = readFileSync(new URL('../.github/workflows/staging-deploy.yml', import.meta.url), 'utf8')
assert.match(workflow, /asset-probe:\s*\n\s*if: \$\{\{ inputs\.stage == 'asset-probe' \}\}/)
assert.match(workflow, /inputs\.stage != 'check' && inputs\.stage != 'asset-probe'/)
assert.match(workflow, /asset-probe:[\s\S]*?environment: staging/)
console.log('Probe safety tests: PASS')
