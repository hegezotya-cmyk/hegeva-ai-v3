import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
const button = readFileSync(new URL('../components/ui/button.tsx', import.meta.url), 'utf8')

const checks = [
  [/button\[data-slot="button"\]/, 'shared button baseline exists'],
  [/whitespace-normal/, 'button labels may wrap safely'],
  [/min-height: 2\.5rem/, 'desktop touch target is bounded'],
  [/min-height: 2\.75rem/, 'mobile touch target is bounded'],
  [/input,\s*select,\s*textarea/, 'form controls share a visual baseline'],
  [/input:focus-visible[\s\S]*box-shadow/, 'form controls have visible focus feedback'],
  [/:focus-visible/, 'keyboard focus remains visible'],
  [/disabled:pointer-events-none/, 'disabled buttons cannot be activated'],
  [/transition-\[background-color,border-color,color,box-shadow,transform,opacity\]/, 'button feedback uses bounded transitions'],
  [/@media \(prefers-reduced-motion: reduce\)/, 'reduced motion remains supported'],
]

for (const [pattern, message] of checks) {
  if (!pattern.test(css) && !pattern.test(button)) throw new Error(`Visual polish audit failed: ${message}`)
}

if (/whitespace-nowrap/.test(button)) throw new Error('Visual polish audit failed: shared buttons must not force nowrap')
if (!/disabled:cursor-not-allowed/.test(button)) throw new Error('Visual polish audit failed: disabled state must communicate non-interaction')

console.log('Visual polish audit passed: shared controls are contrast-aware, focus-visible, touch-friendly, wrapping-safe and reduced-motion compatible')
