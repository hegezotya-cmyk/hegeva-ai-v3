import assert from 'node:assert/strict'
import { createRequestHandler } from '../../src/index.js'

let reads = 0
const db = { prepare(sql) {
  reads++
  assert(!/password|token|session|account/i.test(sql))
  return { bind(limit, offset) {
    assert.equal(limit, 51)
    assert.equal(offset, 0)
    return { all: async () => ({ results: [{ id: 'u1', name: 'Test Owner', email: 'owner@example.test', emailVerified: 1, createdAt: '2026-10-17T12:00:00.000Z' }] }) }
  } }
} }
const env = { ADMIN_EMAIL: 'owner@example.test', DB: db, ASSETS: { fetch: async () => new Response('not found', { status: 404 }) } }
const request = (suffix = '', method = 'GET') => new Request(`https://hegevaai.co.uk/api/admin/registrations${suffix}`, { method })
for (const user of [null, { id: 'other', email: 'other@example.test' }]) {
  const handler = createRequestHandler({ getLoggedInUserFn: async () => user })
  assert.equal((await handler.fetch(request(), env, {})).status, 403)
}
assert.equal(reads, 0, 'non-owner requests must not read the user table')
const owner = createRequestHandler({ getLoggedInUserFn: async () => ({ id: 'owner', email: 'OWNER@example.test' }) })
assert.equal((await owner.fetch(request(), { ...env, ADMIN_EMAIL: '' }, {})).status, 403)
assert.equal((await owner.fetch(request('', 'POST'), env, {})).status, 405)
assert.equal((await owner.fetch(request('?offset=-1'), env, {})).status, 400)
assert.equal(reads, 0)
const response = await owner.fetch(request(), env, {})
assert.equal(response.status, 200)
assert.match(response.headers.get('Cache-Control'), /no-store/)
const payload = await response.json()
assert.deepEqual(payload.users, [{ id: 'u1', name: 'Test Owner', email: 'owner@example.test', emailVerified: true, createdAt: '2026-10-17T12:00:00.000Z' }])
assert.equal(payload.nextOffset, null)
const pageRows = Array.from({ length: 51 }, (_, index) => ({ id: `u${index}`, name: 'Test', email: `test${index}@example.test`, emailVerified: 0, createdAt: 1792238400000, password: 'must-not-leak' }))
const paginated = await owner.fetch(request(), { ...env, DB: { prepare: () => ({ bind: () => ({ all: async () => ({ results: pageRows }) }) }) } }, {})
const page = await paginated.json()
assert.equal(page.users.length, 50)
assert.equal(page.nextOffset, 50)
assert(page.users.every(user => !('password' in user)))
const unavailable = await owner.fetch(request(), { ...env, DB: { prepare: () => { throw new Error('database unavailable') } } }, {})
assert.equal(unavailable.status, 503)
console.log('Owner registrations test passed: owner-only, read-only, bounded, no sensitive authentication fields')
