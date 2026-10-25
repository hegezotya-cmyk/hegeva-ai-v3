import assert from 'node:assert/strict'
import { createPortalShare, revokePortalShare } from '../src/client-portal.js'

const shares = new Map()
const db = {
  prepare(sql) {
    return {
      bind(...args) {
        return {
          async all() {
            return { results: [
              { dataType: 'customers', data: JSON.stringify([{ id: 'customer-1', title: 'Test customer' }]) },
              { dataType: 'invoice_documents', data: JSON.stringify([{ id: 'document-1', clientName: 'Test customer', type: 'quote', number: 'TEST-1', currency: 'GBP', items: [] }]) }
            ] }
          },
          async run() {
            if (sql.startsWith('INSERT INTO client_portal_shares')) {
              shares.set(args[0], { userId: args[1], revokedAt: null })
              return { meta: { changes: 1 } }
            }
            if (sql.startsWith('UPDATE client_portal_shares SET revokedAt')) {
              const share = shares.get(args[1])
              if (!share || share.userId !== args[2] || share.revokedAt) return { meta: { changes: 0 } }
              share.revokedAt = args[0]
              return { meta: { changes: 1 } }
            }
            throw new Error('Unexpected mutation')
          }
        }
      }
    }
  }
}
const created = await createPortalShare(db, 'owner-1', { customerId: 'customer-1', invoiceIds: ['document-1'], expiresInDays: 7 })
assert.equal(created.status, 201)
assert.match(created.data.id, /^[A-Za-z0-9_-]{1,100}$/)
assert.match(created.data.token, /^[A-Za-z0-9_-]{40,60}$/)
assert.equal((await revokePortalShare(db, 'other-owner', created.data.id)).status, 404)
assert.deepEqual((await revokePortalShare(db, 'owner-1', created.data.id)).data, { revoked: true })
assert.equal((await revokePortalShare(db, 'owner-1', created.data.id)).status, 404)
console.log('Client portal share revocation lifecycle: PASS')