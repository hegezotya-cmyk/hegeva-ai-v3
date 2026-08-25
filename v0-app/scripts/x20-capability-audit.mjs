import fs from 'node:fs'
import assert from 'node:assert/strict'

const engine = fs.readFileSync(new URL('../lib/app-studio-capability-engine.ts', import.meta.url), 'utf8')
const gate = fs.readFileSync(new URL('../lib/app-studio-capability-gate.ts', import.meta.url), 'utf8')
const page = fs.readFileSync(new URL('../app/app-studio/build-my-app-x20/page.tsx', import.meta.url), 'utf8')
const status = fs.readFileSync(new URL('../components/app-studio/x20-capability-status.tsx', import.meta.url), 'utf8')
const autoRepair = fs.readFileSync(new URL('../components/app-studio/x20-capability-auto-repair.tsx', import.meta.url), 'utf8')

for (const mode of ['starter', 'premium', 'growth']) {
  assert(new RegExp(`\\b${mode}:\\s*\\{`).test(engine), `${mode} capability profile missing`)
}

assert(/minimumQuality:\s*48/.test(engine), 'Starter quality floor must stay explicit')
assert(/minimumQuality:\s*66/.test(engine), 'Premium quality floor must stay explicit')
assert(/minimumQuality:\s*78/.test(engine), 'Growth quality floor must stay explicit')

for (const capability of [
  'local-persistence',
  'responsive',
  'accessible-controls',
  'create',
  'delete',
]) {
  assert(engine.includes(`\"${capability}\"`), `baseline capability missing: ${capability}`)
}

for (const capability of [
  'dashboard',
  'search',
  'edit',
  'status-workflow',
  'advanced-empty-states',
]) {
  assert(engine.includes(`\"${capability}\"`), `premium capability missing: ${capability}`)
}

for (const capability of [
  'filters',
  'calculations',
  'connected-modules',
  'activity-history',
  'cross-module-actions',
]) {
  assert(engine.includes(`\"${capability}\"`), `growth capability missing: ${capability}`)
}

assert(/auditX20Capabilities/.test(engine), 'Capability inspector must expose an audit function')
assert(/buildX20CapabilityPrompt/.test(engine), 'Build-level capability prompt builder missing')
assert(/hasRealEditWorkflow/.test(engine), 'Edit capability must use a dedicated real-workflow detector')
assert(/visibleEditControl/.test(engine), 'Edit detector must require a visible edit control')
assert(/editHandler/.test(engine), 'Edit detector must require a wired edit handler')
assert(/updatesExistingRecord/.test(engine), 'Edit detector must require mutation of an existing record')
assert(/localStorage\.setItem/.test(engine), 'Edit detector must require persisted updated state')
assert(/MANDATORY EDIT CONTRACT/.test(engine), 'Growth prompt must explicitly require a real persisted edit workflow')
assert(/Every capability listed in the REQUIRED capability contract must be implemented/.test(engine), 'Required capabilities must never be silently omitted')

assert(/auditX20Capabilities/.test(gate), 'Capability gate must use the real audit engine')
assert(/evaluateX20BuildCandidate/.test(gate), 'Candidate gate missing')
assert(/buildX20RetryInstruction/.test(gate), 'Capability retry instruction missing')
assert(/chooseX20Candidate/.test(gate), 'Candidate chooser missing')
assert(/qualityOk\s*&&\s*audit\.passed/.test(gate), 'Gate must require quality AND capability pass')
assert(/capabilityScore\s*\*\s*1000\s*\+\s*first\.quality/.test(gate), 'Candidate ranking must prioritize capability coverage')
assert(/EDIT REPAIR IS MANDATORY/.test(gate), 'Repair prompt must explicitly target missing edit capability')
assert(/UPDATE THE SAME EXISTING RECORD/.test(gate), 'Edit repair must require update rather than duplicate create')
assert(/data-edit/.test(gate), 'Edit repair must require a concrete record-bound edit control')

assert(/X20CapabilityStatus/.test(page), 'X20 page must render live capability status')
assert(/X20CapabilityAutoRepair/.test(page), 'X20 page must mount automatic capability repair')
assert(/evaluateX20BuildCandidate/.test(status), 'Live capability panel must use the real capability gate')
assert(/hegeva:x20:studio:build-mode/.test(status), 'Capability panel must follow selected build level')
assert(/hegeva:x20:studio:html/.test(status), 'Capability panel must inspect the current generated app')

assert(/buildX20RetryInstruction/.test(autoRepair), 'Auto repair must build a targeted capability retry instruction')
assert(/chooseX20Candidate/.test(autoRepair), 'Auto repair must compare original and retry candidates')
assert(/evaluateX20BuildCandidate/.test(autoRepair), 'Auto repair must gate the original candidate before retrying')
assert(/REPAIR_KEY/.test(autoRepair), 'Auto repair must guard against repeated retry loops')
assert(/REPAIR_ATTEMPTS_KEY/.test(autoRepair), 'Auto repair must persist retry attempt state')
assert(/MAX_REPAIR_ATTEMPTS\s*=\s*2/.test(autoRepair), 'Auto repair must cap targeted retries at two attempts')
assert(/readAttempts\(key\)/.test(autoRepair), 'Auto repair must read retry attempts per build fingerprint')
assert(/writeAttempts\(key, attempts \+ 1\)/.test(autoRepair), 'Auto repair must increment retry attempts before retrying')
assert(/missingRequired/.test(autoRepair) && /REAL WORKING FLOWS/.test(autoRepair), 'Auto repair must explicitly target missing capabilities')
assert(/If edit is missing/.test(autoRepair), 'Auto repair must explicitly harden missing edit/update capability')
assert(/chosen\.gate\.accepted/.test(autoRepair), 'Auto repair must prefer fully accepted repaired candidates')
assert(/chosen\.gate\.capabilityScore > firstGate\.capabilityScore/.test(autoRepair), 'Auto repair must only accept measurable capability improvement')
assert(/chosen\.gate\.missingRequired\.length < firstGate\.missingRequired\.length/.test(autoRepair), 'Auto repair must accept candidates with fewer missing required capabilities')
assert(/localStorage\.removeItem\(REPAIR_KEY\)/.test(autoRepair), 'Auto repair must unlock retry state after a non-improving attempt')
assert(/looksLikeHtmlDocument\(retryHtml\)/.test(autoRepair), 'Auto repair retry HTML must be verified before selection')
assert(/localStorage\.setItem\(HTML_KEY, chosen\.candidate\.html\)/.test(autoRepair), 'Accepted repaired candidate must replace the saved build')

console.log('X20 capability audit passed: required tiers, strict persisted edit workflow, targeted repair, bounded retries, measurable improvement and live status are wired')
