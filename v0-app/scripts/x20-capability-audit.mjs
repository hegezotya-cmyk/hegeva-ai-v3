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
assert(/auditX20Capabilities/.test(gate), 'Capability gate must use the real audit engine')
assert(/evaluateX20BuildCandidate/.test(gate), 'Candidate gate missing')
assert(/buildX20RetryInstruction/.test(gate), 'Capability retry instruction missing')
assert(/chooseX20Candidate/.test(gate), 'Candidate chooser missing')
assert(/qualityOk\s*&&\s*audit\.passed/.test(gate), 'Gate must require quality AND capability pass')
assert(/capabilityScore\s*\*\s*1000\s*\+\s*first\.quality/.test(gate), 'Candidate ranking must prioritize capability coverage')

assert(/X20CapabilityStatus/.test(page), 'X20 page must render live capability status')
assert(/X20CapabilityAutoRepair/.test(page), 'X20 page must mount automatic capability repair')
assert(/evaluateX20BuildCandidate/.test(status), 'Live capability panel must use the real capability gate')
assert(/hegeva:x20:studio:build-mode/.test(status), 'Capability panel must follow selected build level')
assert(/hegeva:x20:studio:html/.test(status), 'Capability panel must inspect the current generated app')

assert(/buildX20RetryInstruction/.test(autoRepair), 'Auto repair must build a targeted capability retry instruction')
assert(/chooseX20Candidate/.test(autoRepair), 'Auto repair must compare original and retry candidates')
assert(/evaluateX20BuildCandidate/.test(autoRepair), 'Auto repair must gate the original candidate before retrying')
assert(/REPAIR_KEY/.test(autoRepair), 'Auto repair must guard against repeated retry loops')
assert(/looksLikeHtmlDocument\(retryHtml\)/.test(autoRepair), 'Auto repair retry HTML must be verified before selection')
assert(/localStorage\.setItem\(HTML_KEY, chosen\.candidate\.html\)/.test(autoRepair), 'Accepted repaired candidate must replace the saved build')

console.log('X20 capability audit passed: tier contracts, quality floors, real audit gate, targeted retry, candidate ranking, live status and automatic repair are wired')
