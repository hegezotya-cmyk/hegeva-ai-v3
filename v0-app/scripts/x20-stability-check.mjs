import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'

const aiSource = fs.readFileSync(new URL('../lib/app-studio-ai.ts', import.meta.url), 'utf8')
const componentSource = fs.readFileSync(new URL('../components/app-studio/build-my-app-x20.tsx', import.meta.url), 'utf8')

const match = aiSource.match(/const X20_SAFE_SCRIPT = `<script[^>]*>([\s\S]*?)<\/script>`/)
assert(match, 'X20_SAFE_SCRIPT was not found')
const runtime = match[1]

class ElementMock {
  constructor(id = '') {
    this.id = id
    this.value = ''
    this.textContent = ''
    this.innerHTML = ''
    this.listeners = new Map()
  }
  addEventListener(type, fn) { this.listeners.set(type, fn) }
  dispatch(type, event = {}) { const fn = this.listeners.get(type); if (fn) fn({ preventDefault() {}, target: this, ...event }) }
  focus() {}
  scrollIntoView() {}
  closest(selector) {
    if (selector === 'button' && this.tagName === 'BUTTON') return this
    if (selector === '[data-del]' && this.dataDel != null) return this
    return null
  }
  contains(node) { return node === this.addButton }
  getAttribute(name) { return name === 'data-del' && this.dataDel != null ? String(this.dataDel) : null }
  hasAttribute(name) { return name === 'data-del' && this.dataDel != null }
}

function makeStorage(seed = {}) {
  const data = new Map(Object.entries(seed))
  return {
    getItem: (k) => data.has(k) ? data.get(k) : null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    dump: () => Object.fromEntries(data),
  }
}

function boot({ storage, windowName = '' } = {}) {
  const form = new ElementMock('hx-form')
  const input = new ElementMock('hx-name')
  const list = new ElementMock('hx-list')
  const count = new ElementMock('hx-count')
  const addButton = new ElementMock()
  addButton.tagName = 'BUTTON'
  addButton.textContent = 'Add'
  form.addButton = addButton

  const elements = { 'hx-form': form, 'hx-name': input, 'hx-list': list, 'hx-count': count }
  const localStorage = storage || makeStorage()
  const windowObj = { name: windowName }
  const document = {
    documentElement: { lang: 'en' },
    getElementById: (id) => elements[id] || null,
    querySelectorAll: (selector) => selector === 'button' ? [addButton] : [],
  }
  const context = vm.createContext({
    window: windowObj,
    document,
    localStorage,
    Element: ElementMock,
    setTimeout: (fn) => fn(),
    console,
  })
  vm.runInContext(runtime, context)
  return { form, input, list, count, addButton, storage: localStorage, windowObj }
}

const first = boot()
assert.equal(first.count.textContent, '0', 'Initial count must be 0')
first.input.value = 'Test Customer'
first.form.dispatch('submit')
assert.equal(first.count.textContent, '1', 'Submit must increment count')
assert.match(first.list.innerHTML, /Test Customer/, 'Added customer must render in list')
assert.deepEqual(JSON.parse(first.storage.getItem('hegeva-x20-items')), ['Test Customer'], 'Added customer must persist')

const del = new ElementMock()
del.dataDel = 0
first.list.dispatch('click', { target: del })
assert.equal(first.count.textContent, '0', 'Delete must decrement count')
assert.deepEqual(JSON.parse(first.storage.getItem('hegeva-x20-items')), [], 'Delete must persist')

first.input.value = 'Reload Customer'
first.form.dispatch('submit')
const reloaded = boot({ storage: first.storage })
assert.equal(reloaded.count.textContent, '1', 'Reload must restore persisted count')
assert.match(reloaded.list.innerHTML, /Reload Customer/, 'Reload must restore persisted list')

const blockedStorage = {
  getItem() { throw new Error('blocked') },
  setItem() { throw new Error('blocked') },
  removeItem() {},
}
const sandbox = boot({ storage: blockedStorage })
sandbox.input.value = 'Sandbox Customer'
sandbox.form.dispatch('submit')
assert.equal(sandbox.count.textContent, '1', 'Sandbox fallback must still add')
assert.match(sandbox.windowObj.name, /^hegeva-x20:/, 'Sandbox fallback must persist to window.name')
const sandboxReload = boot({ storage: blockedStorage, windowName: sandbox.windowObj.name })
assert.equal(sandboxReload.count.textContent, '1', 'Sandbox reload must restore via window.name')

assert(/srcDoc=\{html\}/.test(componentSource), 'Preview must use current verified html state')
assert(/downloadTextFile\("index\.html",\s*html/.test(componentSource), 'Download must use the same verified html state as preview')
assert(/looksLikeHtmlDocument\(next\)/.test(componentSource), 'Final build must be re-verified before save')

console.log('X20 stability check passed: add, count, list, delete, reload, sandbox fallback, preview/download consistency')
