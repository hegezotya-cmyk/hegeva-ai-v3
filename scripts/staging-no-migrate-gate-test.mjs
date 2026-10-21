import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/staging-deploy.yml', import.meta.url), 'utf8')
assert.match(workflow, /options: \[[^\]]*deploy-api-no-migrate/)
assert.match(workflow, /needs: \[verify, preflight\]/)
assert.match(workflow, /environment: staging/)
const migration = workflow.match(/- run: npm run staging:db:migrate\s+if: \$\{\{ ([^}]+) \}\}/)
assert.ok(migration, 'Migration step must retain a conditional guard')
assert.doesNotMatch(migration[1], /deploy-api-no-migrate/)
const deploy = workflow.match(/- run: npm run staging:api:deploy\s+if: \$\{\{ ([^}]+) \}\}/)
assert.ok(deploy, 'API deployment must retain a conditional guard')
assert.match(deploy[1], /inputs\.stage == 'deploy-api-no-migrate'/)
console.log('Staging no-migration deployment gate: PASS')
