import fs from 'node:fs'
import assert from 'node:assert/strict'
import { loadTypeScriptModule } from './x20-test-loader.mjs'

const spec = loadTypeScriptModule(new URL('../lib/app-studio-spec-match.ts', import.meta.url))
const ai = fs.readFileSync(new URL('../lib/app-studio-ai.ts', import.meta.url), 'utf8')
const repair = fs.readFileSync(new URL('../components/app-studio/x20-capability-auto-repair.tsx', import.meta.url), 'utf8')
const generic = '<!doctype html><html><head><title>PawFlow</title></head><body><nav>Customers Invoices Quotes Expenses Tasks</nav><form><input aria-label="Search pet"></form><script>localStorage.setItem("hegeva-growth-os-v3","{}");document.querySelector("input").addEventListener("input",()=>{});</script></body></html>'
const request = 'Build a pet grooming app called PawFlow with pets, breeds, owners, services and appointments.'
const audit = spec.auditStudioSpecMatch(generic, request)
assert.equal(audit.severeMismatch, true, 'Generic business entities must be rejected for a specific grooming request')
assert(/passesRequestFidelity/.test(ai) && /verifiedDomainFallback/.test(ai), 'Generation must gate output before fallback/save')
assert(/if \(!fallback\) throw new Error/.test(ai), 'Unknown specific domains must fail instead of receiving Business OS')
assert(/!spec\.severeMismatch/.test(repair), 'Auto repair must not accept a severe structural mismatch')
console.log(`X20 request-fidelity regression passed: generic PawFlow rejected at ${audit.score}%`)
