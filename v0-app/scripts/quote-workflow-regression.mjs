import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
let syncState = 'checking'
let query = ''
let editorDoc = null
const load = (relative) => {
  const filename = new URL(relative, import.meta.url)
  const source = fs.readFileSync(filename, 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const module = { exports: {} }
  const resolve = (name) => {
    if (name === 'react' && editorDoc && filename.pathname.endsWith('/invoices/page.tsx')) return { ...React, useState: (initial) => React.useState(typeof initial === 'function' ? () => editorDoc : initial) }
    if (name === 'next/navigation') return { useSearchParams: () => new URLSearchParams(query) }
    if (name === 'next/link') return ({ children, href }) => React.createElement('a', { href }, children)
    if (name === '@/components/app-shell') return { AppShell: ({ children }) => children }
    if (name === '@/components/page-header') return { PageHeader: () => null }
    if (name === '@/lib/i18n/provider') return { useI18n: () => ({ locale: 'hu' }) }
    if (name === '@/lib/use-workspace-data') return { useWorkspaceData: (type) => ({ items: [], setItems: () => {}, syncState, cloudEnabled: true, cloudSaveVersion: 0, cloudSavedItems: type === 'invoice_documents' && editorDoc ? [editorDoc] : [] }) }
    if (name.startsWith('@/')) return load(`../${name.slice(2)}.${name.includes('components/') ? 'tsx' : 'ts'}`)
    if (name.startsWith('.')) return load(new URL(`${name}.ts`, filename))
    return require(name)
  }
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: filename.pathname })(resolve, module, module.exports)
  return module.exports
}

test('quote entry opens a quote while invoice entry stays an invoice', () => {
  const { OutcomeLauncher } = load('../components/outcome-launcher.tsx')
  const html = renderToStaticMarkup(React.createElement(OutcomeLauncher))
  const anchors = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gs)]
  const quote = anchors.find(([, , body]) => body.includes('Készíts ajánlatot'))
  const invoice = anchors.find(([, , body]) => body.includes('Készíts számlát'))
  assert.equal(quote?.[1], '/business/invoices?prepare=quote')
  assert.equal(invoice?.[1], '/business/invoices')
})

test('checking cloud data never claims local storage or an empty saved collection', () => {
  syncState = 'checking'
  query = ''
  const Page = load('../app/business/invoices/page.tsx').default
  const html = renderToStaticMarkup(React.createElement(Page))
  assert(!html.includes('Bejelentkezésig ebben a böngészőben tárolva.'), 'loading must not be shown as guest storage')
  assert(!html.includes('Még nincs mentett számla vagy árajánlat.'), 'loading must not look like data loss')
  assert(html.includes('Betöltés'), 'loading must have its own visible status')
})

test('quote deep link selects quote on the first render', () => {
  syncState = 'cloud'
  query = 'prepare=quote'
  const Page = load('../app/business/invoices/page.tsx').default
  const html = renderToStaticMarkup(React.createElement(Page))
  assert.match(html, /<option value="quote" selected="">/)
})

test('manual quote explains the missing CRM customer before preparing email', () => {
  query = ''
  syncState = 'cloud'
  editorDoc = { id: 'q1', type: 'quote', status: 'draft', number: 'QUO-TEST', businessName: 'Painter', businessDetails: '', clientName: 'New customer', clientDetails: 'test@example.com', items: [], notes: '', currency: 'GBP', vatRate: 20, issueDate: '2026-10-17', dueDate: '2026-10-31' }
  const Page = load('../app/business/invoices/page.tsx').default
  const html = renderToStaticMarkup(React.createElement(Page))
  editorDoc = null
  assert(html.includes('CRM'), 'the missing customer requirement must be explained')
  assert.match(html, /href="\/business\/customers"/, 'offer a route to fix the missing customer')
  assert.match(html, /<button[^>]*disabled=""[^>]*>E-mail piszkozat előkészítése<\/button>/)
})

test('cached CRM data cannot authorize an email draft while cloud sync failed', () => {
  const { quoteDraftIssue } = load('../lib/quote-workflow.ts')
  const quote = { id: 'q1', clientName: 'Customer', clientDetails: 'test@example.com' }
  assert.equal(quoteDraftIssue(quote, [{ title: 'Customer' }], 'cloud', true, [quote], 'error'), 'customerSync')
  assert.equal(quoteDraftIssue(quote, [{ title: 'Customer' }], 'cloud', true, [quote], 'saving'), 'customerSync')
  assert.equal(quoteDraftIssue(quote, [{ title: 'Customer' }], 'cloud', true, [quote], 'cloud'), null)
  assert.equal(quoteDraftIssue({ ...quote, clientDetails: '' }, [{ title: 'Customer' }], 'cloud', true, [{ ...quote, clientDetails: '' }], 'cloud'), 'recipient')
  assert.equal(quoteDraftIssue({ ...quote, clientName: 'Edited customer' }, [{ title: 'Customer' }], 'cloud', true, [quote], 'cloud'), 'save')
})
