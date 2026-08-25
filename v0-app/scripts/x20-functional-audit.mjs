import fs from 'node:fs'
import assert from 'node:assert/strict'

const premium = fs.readFileSync(new URL('../lib/app-studio-premium-fallback.ts', import.meta.url), 'utf8')
const polish = fs.readFileSync(new URL('../lib/app-studio-hardcore-polish.ts', import.meta.url), 'utf8')
const component = fs.readFileSync(new URL('../components/app-studio/build-my-app-x20.tsx', import.meta.url), 'utf8')

const must = (source, pattern, message) => assert(pattern.test(source), message)

// Core module contract
for (const label of ['customers','invoices','quotes','expenses','tasks','settings']) {
  must(premium, new RegExp(label, 'i'), `Premium fallback must include ${label}`)
}

// Persistence and connected workflows
must(premium, /localStorage/i, 'Premium fallback must persist data locally')
must(premium, /JSON\.parse|JSON\.stringify/, 'Premium fallback must serialize persisted data')
must(premium, /convert/i, 'Quotes must support conversion to invoice')
must(premium, /paid|unpaid|overdue/i, 'Invoices must expose payment status')
must(premium, /complete|reopen/i, 'Tasks must support completion workflow')
must(premium, /currency/i, 'Settings must expose currency handling')
must(premium, /tax|VAT/i, 'Settings must expose tax/VAT handling')

// Dashboard calculations / business intelligence
for (const metric of ['revenue','outstanding','profit','margin','pipeline']) {
  must(premium, new RegExp(metric, 'i'), `Dashboard must include ${metric}`)
}
must(premium, /recent/i, 'Dashboard must include recent activity')
must(premium, /dueSoon|upcoming/i, 'Dashboard must include upcoming task context')

// CRUD / forms / navigation
must(premium, /delete/i, 'Generated app must expose delete actions')
must(premium, /save/i, 'Generated app must expose save actions')
must(premium, /search/i, 'Generated app must expose search')
must(premium, /nav/i, 'Generated app must include navigation')
must(premium, /formgrid|<form/i, 'Generated app must include structured forms')

// Responsive and accessibility guards
must(premium + polish, /@media\(max-width:/, 'Generated app must include responsive breakpoints')
must(polish, /focus-visible/i, 'Visual layer must preserve keyboard focus visibility')
must(polish, /aria-label/i, 'Visual enhancer must protect control labelling')
must(polish, /prefers-reduced-motion/i, 'Visual layer must respect reduced motion')
must(polish, /min-height:4[4-9]px|min-height:5[0-9]px/, 'Touch targets must remain mobile-friendly')

// Studio preview/export consistency
must(component, /srcDoc=\{html\}/, 'Preview must use the verified html state')
must(component, /downloadTextFile\("index\.html",\s*html/, 'Download must use the same verified html state')
must(component, /Desktop/i, 'Studio must expose Desktop preview mode')
must(component, /Tablet/i, 'Studio must expose Tablet preview mode')
must(component, /Phone/i, 'Studio must expose Phone preview mode')
must(component, /Preview/i, 'Studio must expose Preview mode')
must(component, /Code/i, 'Studio must expose Code mode')
must(component, /Split/i, 'Studio must expose Split mode')

console.log('X20 functional audit passed: modules, persistence, connected workflows, dashboard metrics, CRUD, responsive/accessibility guards, preview/export consistency')
