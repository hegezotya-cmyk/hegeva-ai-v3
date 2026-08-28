import fs from 'node:fs'
import assert from 'node:assert/strict'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const css = read('app/globals.css')
const engine = read('components/visual-engine.tsx')
const shell = read('components/app-shell.tsx')
const header = read('components/site-header.tsx')
const assistant = read('components/assistant/assistant-chat.tsx')
const command = read('components/command-center/operating-center.tsx')
const home = read('components/home/hero.tsx') + read('components/home/capabilities.tsx')

for (const token of ['--surface-0','--surface-1','--surface-2','--surface-3','--shadow-soft','--shadow-float','--motion-fast','--motion-base','--motion-slow','--violet']) {
  assert(css.includes(token), `Visual Engine token missing: ${token}`)
}
for (const component of ['IntelligenceCard','SignalIcon','SectionHeading','MetricCard','AICore','LiveStatus','BuildProgress','SkeletonSurface']) {
  assert(new RegExp(`export function ${component}\\b`).test(engine), `Reusable visual primitive missing: ${component}`)
}
assert(/prefers-reduced-motion/.test(css), 'Motion system must honor reduced motion')
for (const state of ['understanding','planning','working','checking','repairing','completed','warning','failed']) assert(css.includes(`ve-core-${state}`), `HEGEVA Core state missing: ${state}`)
assert(/:focus-visible/.test(css) && /outline-offset/.test(css), 'Global keyboard focus must remain visible')
assert(/@media \(max-width: 640px\)/.test(css), 'Visual Engine must define narrow-screen behavior')
assert(/z-\[1\]/.test(shell), 'Content must remain above ambient visual layers')
assert(/aria-current/.test(header), 'Primary navigation must expose the active page')
assert(/role="status"/.test(assistant) && /aria-live="polite"/.test(assistant), 'AI processing feedback must be announced accessibly')
assert(/mission-surface/.test(command) && /current-work/.test(command) && /inventory-strip/.test(command), 'Operating Center must retain semantic mission, work and inventory surfaces')
assert(/useWorkspaceData/.test(command) && /cloudEnabled/.test(command), 'Operating Center must use real workspace state with cloud/local provenance')
assert(/href="\/assistant"/.test(command) && /href="\/app-studio\/build-my-app-x20"/.test(command), 'Operating Center must retain read-only Assistant and App Studio navigation')
assert(/control-room-grid/.test(css) && /max-width: 900px/.test(css) && /max-width: 640px/.test(css), 'Operating Center must retain responsive layout contracts')
assert(/AICore/.test(home) && /hero-robot-zone/.test(home) && /hero-environment/.test(home) && /system-portals/.test(home), 'Homepage must use the shared HEGEVA Core and authored cinematic system composition')
assert(!/framer-motion|three|gsap/.test(read('package.json')), 'Visual Engine must not add a heavy animation dependency')

console.log('Visual Engine audit passed: semantic tokens, reusable identity components, responsive motion, accessible status and lightweight architecture')
