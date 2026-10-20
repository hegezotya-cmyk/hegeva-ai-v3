const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync('lib/auth-client.ts', 'utf8')
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText
function origin(env, window) {
  let options
  const context = {exports: {}, process: {env: {NEXT_PUBLIC_APP_ENV: env}}, require: () => ({createAuthClient: value => {options = value; return {}}})}
  if (window) context.window = window
  vm.runInNewContext(compiled, context)
  return options.baseURL
}
assert.equal(origin('staging', {location: {origin: 'https://staging.hegevaai.co.uk'}}), 'https://staging.hegevaai.co.uk')
assert.equal(origin('staging'), 'https://staging.hegevaai.co.uk')
assert.equal(origin('production', {location: {origin: 'https://hegevaai.co.uk'}}), 'https://hegevaai.co.uk')
console.log('Staging and production auth origins verified')
