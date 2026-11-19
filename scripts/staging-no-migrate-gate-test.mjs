import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/staging-deploy.yml', import.meta.url), 'utf8')
assert.match(workflow, /options: \[[^\]]*deploy-api-no-migrate/)
assert.match(workflow, /needs: \[verify, preflight\]/)
assert.match(workflow, /environment: staging/)
const migration = workflow.match(/- run: npm run staging:db:migrate\s+if: \$\{\{ ([^}]+) \}\}/)
assert.ok(migration, 'Migration step must retain a conditional guard')
assert.doesNotMatch(migration[1], /deploy-api-no-migrate/)
const deploy = workflow.match(/- name: Deploy exact source-mapped staging bundle\s+if: \$\{\{ ([^}]+) \}\}/)
assert.ok(deploy, 'Source-mapped API deployment must retain a conditional guard')
assert.match(deploy[1], /inputs\.stage == 'deploy-api-no-migrate'/)

const stagingConfig = JSON.parse(readFileSync(new URL('../wrangler.staging.jsonc', import.meta.url), 'utf8'))
assert.equal(stagingConfig.name, 'hegeva-ai-v3-staging')
assert.deepEqual(stagingConfig.triggers?.crons, [], 'Staging deploy must explicitly remove stale remote Cron Triggers')
console.log('Staging no-migration deployment gate and explicit empty Cron config: PASS')
