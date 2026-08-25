import fs from 'node:fs'
import assert from 'node:assert/strict'

const autoRepair = fs.readFileSync(new URL('../components/app-studio/x20-capability-auto-repair.tsx', import.meta.url), 'utf8')

assert(/MAX_REPAIR_ATTEMPTS\s*=\s*2/.test(autoRepair), 'repair attempts must remain capped')
assert(/writeAttempts\(key, attempts \+ 1\)/.test(autoRepair), 'repair attempt counter must increment')
assert(/localStorage\.removeItem\(REPAIR_KEY\)/.test(autoRepair), 'repair lock must be released after a failed improvement')
assert(/chosen\.gate\.accepted/.test(autoRepair), 'fully accepted repair must be preferred')
assert(/chosen\.gate\.capabilityScore > firstGate\.capabilityScore/.test(autoRepair), 'capability score must improve before replacement')
assert(/chosen\.gate\.missingRequired\.length < firstGate\.missingRequired\.length/.test(autoRepair), 'missing capability count must improve before replacement')
assert(/If edit is missing/.test(autoRepair), 'edit capability must receive an explicit targeted repair instruction')

console.log('X20 auto-repair smoke passed: bounded retries, lock release and measurable improvement guards are present')
