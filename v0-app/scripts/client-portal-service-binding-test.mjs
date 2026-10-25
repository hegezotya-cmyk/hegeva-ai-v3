import assert from 'node:assert/strict'
import { fetchPortalSnapshot } from '../lib/client-portal-service.ts'

let calls = 0
const binding = { fetch: async (url, init) => {
  calls++
  assert.equal(new URL(url).hostname, 'staging.hegevaai.co.uk')
  assert.equal(init.redirect, 'manual')
  return new Response('{}', { status: 200 })
} }
assert.equal((await fetchPortalSnapshot(binding, 'staging', 'https://staging.hegevaai.co.uk', 'test-token')).status, 200)
await assert.rejects(() => fetchPortalSnapshot(binding, 'staging', 'https://hegevaai.co.uk', 'test-token'))
await assert.rejects(() => fetchPortalSnapshot(binding, 'staging', 'https://evil.example', 'test-token'))
await assert.rejects(() => fetchPortalSnapshot(binding, 'production', 'https://staging.hegevaai.co.uk', 'test-token'))
assert.equal(calls, 1)
console.log('Staging portal service binding isolation: PASS')
