import fs from 'node:fs'
import assert from 'node:assert/strict'

const autoRepair = fs.readFileSync(new URL('../components/app-studio/x20-capability-auto-repair.tsx', import.meta.url), 'utf8')

assert(/MAX_REPAIR_ATTEMPTS\s*=\s*3/.test(autoRepair), 'repair attempts must remain capped at three')
assert(/writeAttempts\(key, usedAttempts\)/.test(autoRepair), 'repair attempt counter must increment')
assert(/localStorage\.removeItem\(REPAIR_KEY\)/.test(autoRepair), 'repair lock must be released after a failed improvement')
assert(/candidateRank\(/.test(autoRepair) && /evaluateX20BuildCandidate/.test(autoRepair), 'capability-aware candidate selection must remain enabled')
assert(/best\.gate\.accepted/.test(autoRepair), 'fully accepted repair must count as a capability improvement')
assert(/retry\.rank > best\.rank/.test(autoRepair), 'repair must improve the ranked candidate before replacement')
assert(/best\.spec\.score >= MIN_REQUEST_MATCH/.test(autoRepair), 'spec-match quality must gate repair completion')
assert(/buildStudioSpecRepairInstruction/.test(autoRepair), 'spec repair must remain request-aware')
assert(/MIN_REQUEST_MATCH\s*=\s*80/.test(autoRepair), 'repair must retain the approved request-match threshold')
assert(/runStudioAI\(/.test(autoRepair), 'repair must use the existing provider path')

console.log('X20 auto-repair smoke passed: bounded retries, lock release, capability guards and spec-aware improvement rules are present')
