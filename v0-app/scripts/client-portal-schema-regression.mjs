import assert from 'node:assert/strict'
import { isPublicPortalSnapshot } from '../lib/client-portal-public-types.ts'

// Synthetic values reproduce the field types observed from the staging API.
const snapshot = { schemaVersion: 2, customer: { name: 'Test' }, documents: [{
  documentType: 'quote', reference: 'TEST', issueDate: '2026-10-20', dueDate: '2026-11-03', currency: 'GBP',
  business: { name: 'Test business' }, customer: { name: 'Test' },
  items: [{ description: 'Test service', quantity: 1, unitPrice: 100, lineTotal: 100 }],
  subtotal: 100, vatRate: 20, vatAmount: 20, total: 120,
}] }
assert.equal(isPublicPortalSnapshot(snapshot), true)
for (const field of ['subtotal', 'vatRate', 'vatAmount', 'total']) {
  for (const bad of ['100', -1, null, Infinity]) {
    const input = structuredClone(snapshot); input.documents[0][field] = bad
    assert.equal(isPublicPortalSnapshot(input), false, field)
  }
}
for (const field of ['quantity', 'unitPrice', 'lineTotal']) {
  const input = structuredClone(snapshot); input.documents[0].items[0][field] = '1'
  assert.equal(isPublicPortalSnapshot(input), false, field)
}
for (const field of ['reference', 'issueDate', 'dueDate', 'currency', 'business', 'customer', 'items']) {
  const input = structuredClone(snapshot); delete input.documents[0][field]
  assert.equal(isPublicPortalSnapshot(input), false, field)
}
console.log('Portal schema regression: PASS')
