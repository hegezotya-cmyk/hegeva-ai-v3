import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

export function loadTypeScriptModule(relativeUrl, dependencies = {}) {
  const source = fs.readFileSync(relativeUrl, 'utf8')
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  const require = (id) => {
    if (Object.hasOwn(dependencies, id)) return dependencies[id]
    throw new Error(`Unexpected test dependency: ${id}`)
  }
  const wrapper = vm.runInThisContext(`(function(exports, require, module) {${javascript}\n})`, { filename: relativeUrl.pathname })
  wrapper(module.exports, require, module)
  return module.exports
}
