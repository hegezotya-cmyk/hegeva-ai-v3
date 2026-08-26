import assert from 'node:assert/strict'
import { loadTypeScriptModule } from './x20-test-loader.mjs'

const spec = loadTypeScriptModule(new URL('../lib/app-studio-spec-match.ts', import.meta.url))
const verifier = loadTypeScriptModule(new URL('../lib/app-studio-verify.ts', import.meta.url))
const premium = loadTypeScriptModule(new URL('../lib/app-studio-premium-fallback.ts', import.meta.url), { './app-studio-spec-match': spec })
const pawflow = loadTypeScriptModule(new URL('../lib/app-studio-pawflow-fallback.ts', import.meta.url), { './app-studio-spec-match': spec })
const request = 'Build an app called PawFlow for pet grooming. Store pets, breed, age, owner name and phone, grooming services and prices, and appointments with date, time, service and price. Add, edit, save, cancel and delete appointments. Search pets and customers. Show today\'s appointments and grooming revenue. Persist with localStorage.'

const oldHtml = premium.buildPremiumFallbackHtml(request, 'en')
const oldAudit = spec.auditStudioSpecMatch(oldHtml, request)
assert.equal(oldAudit.severeMismatch, true, 'The former Growth OS PawFlow output must be a severe mismatch')
assert(oldAudit.score < 80, `The former Growth OS must fail request fidelity, received ${oldAudit.score}`)
assert.match(oldHtml, /hegeva-growth-os-v3/, 'Regression fixture must represent the live failing Growth OS output')

const html = pawflow.buildPawFlowFallbackHtml(request)
const audit = spec.auditStudioSpecMatch(html, request)
const structure = spec.auditPawFlowStructure(html)
const prototype = verifier.verifyBrowserPrototype(html)
assert.equal(audit.severeMismatch, false, 'PawFlow must not be classified as mismatched')
assert.equal(structure.score, 100, 'PawFlow must satisfy every structural domain check')
assert.equal(prototype.ok, true, `PawFlow HTML/JavaScript verification failed: ${verifier.verificationIssues(prototype).join('; ')}`)
assert(audit.score >= 80, `PawFlow request score must pass, received ${audit.score}`)
for (const forbidden of ['hegeva-growth-os-v3', 'GROWTH BUILD', '>Invoices<', '>Quotes<', '>Expenses<', '>Tasks<']) assert(!html.includes(forbidden), `PawFlow must exclude ${forbidden}`)

console.log(`PawFlow regression passed: old=${oldAudit.score}% new=${audit.score}% structural=${structure.score}%`)
