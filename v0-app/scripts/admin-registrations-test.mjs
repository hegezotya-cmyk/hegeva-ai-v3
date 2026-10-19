import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequestHandler } from '../../src/index.js'

let reads = 0
const db = { prepare(sql) {
  reads++
  assert(!/password|token|session|account/i.test(sql))
  if (/FROM "user" ORDER BY/.test(sql)) return { bind(limit, offset) {
    assert.equal(limit, 51)
    assert.equal(offset, 0)
    return { all: async () => ({ results: [{ id: 'u1', name: 'Test Owner', email: 'owner@example.test', emailVerified: 1, createdAt: '2026-10-17T12:00:00.000Z' }] }) }
  } }
  assert.match(sql, /typeof\(createdAt\)/, 'registration windows must normalize numeric and ISO timestamps')
  return { bind(...values) {
    assert.equal(values.length, 7)
    return { first: async () => ({
      registrationTotal: 12, registrationVerified: 9, registrations7d: 3, registrations30d: 8,
      workspaceUsers: 7, workspaceActive7d: 4, workspaceActive30d: 6,
      firstValueUsers: 5, customerUsers: 4, quoteUsers: 3, invoiceUsers: 2, plannerUsers: 2, messageUsers: 3,
      assistantOperationsMonth: 21, assistantSuccessMonth: 18, assistantFailureMonth: 2,
      assistantTimeoutMonth: 1, assistantActiveUsersMonth: 5, assistantAverageResponseMs: 842,
      subscriptionActive: 2, subscriptionTrialing: 1, subscriptionPastDue: 1,
    }) }
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
assert.match(payload.metrics.generatedAt, /^\d{4}-\d{2}-\d{2}T/)
assert.deepEqual(payload.metrics.registrations, { total: 12, verified: 9, last7Days: 3, last30Days: 8 })
assert.deepEqual(payload.metrics.activation, { workspaceUsers: 7, active7Days: 4, active30Days: 6, firstValueUsers: 5, customerUsers: 4, quoteUsers: 3, invoiceUsers: 2, plannerUsers: 2, messageUsers: 3 })
assert.deepEqual(payload.metrics.assistant, { operationsThisMonth: 21, successfulThisMonth: 18, failedThisMonth: 2, timedOutThisMonth: 1, activeUsersThisMonth: 5, averageResponseMs: 842 })
assert.deepEqual(payload.metrics.subscriptions, { active: 2, trialing: 1, pastDue: 1 })
assert.equal(payload.metrics.windows.timeZone, 'Europe/London')
assert.match(payload.metrics.windows.currentMonthStart, /^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$/)
const pageRows = Array.from({ length: 51 }, (_, index) => ({ id: `u${index}`, name: 'Test', email: `test${index}@example.test`, emailVerified: 0, createdAt: 1792238400000, password: 'must-not-leak' }))
const paginated = await owner.fetch(request(), { ...env, DB: { prepare: sql => /FROM "user" ORDER BY/.test(sql) ? ({ bind: () => ({ all: async () => ({ results: pageRows }) }) }) : ({ bind: () => ({ first: async () => ({}) }) }) } }, {})
const page = await paginated.json()
assert.equal(page.users.length, 50)
assert.equal(page.nextOffset, 50)
assert(page.users.every(user => !('password' in user)))
const unavailable = await owner.fetch(request(), { ...env, DB: { prepare: () => { throw new Error('database unavailable') } } }, {})
assert.equal(unavailable.status, 503)
const pageSource = readFileSync(new URL('../app/admin/registrations/page.tsx', import.meta.url), 'utf8')
const copySource = readFileSync(new URL('../lib/i18n/registrations-copy.ts', import.meta.url), 'utf8')
for (const marker of ['metrics.registrations', 'metrics.activation', 'metrics.assistant', 'metrics.subscriptions', 'metrics.generatedAt']) {
  assert(pageSource.includes(marker), `owner dashboard must render ${marker}`)
}
for (const label of ['metricsTitle', 'registrationTotal', 'workspaceActive7d', 'firstValueUsers', 'customerUsers', 'quoteUsers', 'invoiceUsers', 'plannerUsers', 'messageUsers', 'assistantOperationsMonth', 'subscriptionActive', 'measurementDefinitions']) {
  assert(copySource.includes(label), `owner dashboard copy is missing ${label}`)
}
console.log('Owner registrations test passed: owner-only, read-only, bounded, no sensitive authentication fields')
