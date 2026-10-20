import assert from 'node:assert/strict'
import { portalOrigin } from '../lib/client-portal-origin.ts'

assert.equal(portalOrigin('staging.hegevaai.co.uk'), 'https://staging.hegevaai.co.uk')
assert.equal(portalOrigin('hegevaai.co.uk'), 'https://hegevaai.co.uk')
assert.equal(portalOrigin('www.hegevaai.co.uk'), 'https://hegevaai.co.uk')
assert.equal(portalOrigin('evil.example'), null)
assert.equal(portalOrigin('staging.hegevaai.co.uk.evil.example'), null)
console.log('Client portal origin isolation: PASS')
