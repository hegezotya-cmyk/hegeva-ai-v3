const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const root = path.resolve(__dirname, '..')
let sessionState, locale = 'en', workspaceMounts = 0
function load(relative) {
  const filename = path.join(root, relative)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  const localRequire = id => {
    if (id === '@/lib/auth-client') return { useSession: () => sessionState }
    if (id === '@/lib/i18n/provider') return { useI18n: () => ({ locale }) }
    if (id === '@/lib/use-workspace-data') return { useWorkspaceData: () => { workspaceMounts++; return { items: [], setItems() {}, cloudEnabled: true } } }
    if (id === '@/components/app-shell') return { AppShell: ({children}) => React.createElement('div', null, children) }
    if (id === '@/components/page-header') return { PageHeader: ({title,subtitle}) => React.createElement('header', null, React.createElement('h1', null, title), React.createElement('p', null, subtitle)) }
    if (id === '@/components/visual-engine') return { IntelligenceCard: ({children}) => React.createElement('section', null, children) }
    if (id.startsWith('@/')) return load(id.slice(2) + (id === '@/lib/enterprise' ? '.ts' : '.tsx'))
    return require(id)
  }
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, console }, { filename })
  return module.exports
}
const Page = load('app/enterprise/page.tsx').default
for (locale of ['en','hu','de','fr','es']) {
  for (sessionState of [{data:null,isPending:false},{data:null,isPending:true},{data:{user:{id:'fixture'}},isPending:true}]) {
    workspaceMounts = 0
    const html = renderToStaticMarkup(React.createElement(Page))
    assert.equal(workspaceMounts, 0, 'guest or unresolved session must not mount Enterprise workspace persistence')
    assert.doesNotMatch(html, /<input|<select/, 'guest or unresolved session must not expose configuration controls')
    if (!sessionState.isPending) {
      assert.match(html, /href="\/contact"/)
      assert.match(html, /href="\/pricing"/)
    }
  }
  sessionState = {data:{user:{id:'fixture'}},isPending:false}
  workspaceMounts = 0
  const html = renderToStaticMarkup(React.createElement(Page))
  assert.equal(workspaceMounts, 1, 'signed-in Enterprise must retain its workspace component')
  assert.match(html, /<input/)
  assert.match(html, /<select/)
}
console.log('PASS: Enterprise guest/loading isolation and signed-in controls in five locales')
