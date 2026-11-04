import assert from 'node:assert/strict'
import { safeAnalyticsParams } from '../lib/analytics-event-params.mjs'

assert.deepEqual(safeAnalyticsParams({ business_type: 'plumber', score: 62, sent: false }), { business_type: 'plumber', score: 62, sent: false })
assert.deepEqual(safeAnalyticsParams({ email: 'private@example.invalid', page_location: 'https://example.com/?email=private', page_path: '/customer/private', campaign_source: 'private', business_type: 'private@example.invalid', cta: 'private', amount: 1200 }), {})
assert.deepEqual(safeAnalyticsParams({ destination: '/login', cta: 'challenge_signup', score: Infinity, priority: -1 }), { destination: '/login', cta: 'challenge_signup' })
assert.deepEqual(safeAnalyticsParams(null), {})
console.log('Analytics event parameters: PASS (closed values, no PII or GA context override)')
