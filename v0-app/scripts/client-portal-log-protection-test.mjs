import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const config = JSON.parse(await readFile(new URL('../wrangler.staging.jsonc', import.meta.url), 'utf8'))
const api = JSON.parse(await readFile(new URL('../../wrangler.staging.jsonc', import.meta.url), 'utf8'))
assert.equal(config.name, 'hegeva-ai-v3-v0-staging')
assert.equal(config.observability.logs.invocation_logs, false)
assert.equal(config.observability.traces.enabled, false)
assert.equal(api.name, 'hegeva-ai-v3-staging')
assert.equal(api.observability.logs.invocation_logs, false)
assert.equal(api.observability.traces.enabled, false)
const page = await readFile(new URL('../app/portal/[token]/page.tsx', import.meta.url), 'utf8')
assert.doesNotMatch(page, /portalDiagnostic\s*\(/)
assert.doesNotMatch(page, /console\.(?:log|info|warn|error)\s*\(/)
console.log('Staging UI portal logging protection: PASS')
