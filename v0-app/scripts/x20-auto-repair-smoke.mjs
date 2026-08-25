import fs from 'node:fs'
import assert from 'node:assert/strict'

const autoRepair = fs.readFileSync(new URL('../components/app-studio/x20-capability-auto-repair.tsx', import.meta.url), 'utf8')

assert(/MAX_REPAIR_ATTEMPTS\s*=\s*2/.test(autoRepair), 'repair attempts must remain capped')
assert(/writeAttempts\(key, attempts \+ 1\)/.test(autoRepair), 'repair attempt counter must increment')
assert(/localStorage\.removeItem\(REPAIR_KEY\)/.test(autoRepair), 'repair lock must be released after a failed improvement')
assert(/chooseX20Candidate\(/.test(autoRepair), 'capability-aware candidate selection must remain enabled')
assert(/retryGate\.accepted/.test(autoRepair), 'fully accepted repair must count as a capability improvement')
assert(/retryGate\.capabilityScore > firstGate\.capabilityScore/.test(autoRepair), 'capability score must improve before capability-based replacement')
assert(/retryGate\.missingRequired\.length < firstGate\.missingRequired\.length/.test(autoRepair), 'missing capability count must improve before capability-based replacement')
assert(/specImproved/.test(autoRepair), 'spec-match improvement must be considered during repair selection')
assert(/retryMatch\.score >= firstMatch\.score \+ 10/.test(autoRepair), 'spec repair must require a meaningful request-match gain')
assert(/retryIsSafe/.test(autoRepair), 'spec repair must not accept a major capability regression')
assert(/If edit is missing/.test(autoRepair), 'edit capability must receive an explicit targeted repair instruction')

console.log('X20 auto-repair smoke passed: bounded retries, lock release, capability guards and spec-aware improvement rules are present')
