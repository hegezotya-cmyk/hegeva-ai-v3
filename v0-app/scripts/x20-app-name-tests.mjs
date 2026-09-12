import assert from 'node:assert/strict'
import { loadTypeScriptModule } from './x20-test-loader.mjs'

const { extractRequestedAppName } = loadTypeScriptModule(new URL('../lib/app-studio-spec-match.ts', import.meta.url))
const cases = [
  ['Build a pet grooming app called PawFlow for local groomers.', 'PawFlow'],
  ['Create an application named PawFlow that manages pets.', 'PawFlow'],
  ['Please build it PawFlow with appointments.', 'PawFlow'],
  ['Make an app called "PawFlow" with services.', 'PawFlow'],
]
for (const [request, expected] of cases) assert.equal(extractRequestedAppName(request), expected, request)
for (const forbidden of ['it', 'called', 'named', 'build']) assert.doesNotMatch(extractRequestedAppName('Please build it PawFlow with appointments.'), new RegExp(`\\b${forbidden}\\b`, 'i'))
console.log(`X20 app-name parsing passed: ${cases.length} cases`)
