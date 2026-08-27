import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const loadTypeScriptModule = async (path) => {
  const compiled = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
}

const schemaSource = read("lib/x30/schema.ts")
const fixtureSource = read("lib/x30/fixtures.ts")
const directionSource = read("lib/x30/domain-visual-intelligence.ts")
const { validateX30Spec } = await loadTypeScriptModule("lib/x30/schema.ts")
const { inferVisualDirection } = await loadTypeScriptModule("lib/x30/domain-visual-intelligence.ts")
const direction = inferVisualDirection("premium pet grooming booking studio")
const valid = { version:"0.1", id:"pawflow-alpha", name:"PawFlow", direction, nodes:[{ id:"welcome", type:"hero", props:{ title:"Welcome" } }] }

assert.equal(validateX30Spec(valid).ok, true, "valid deterministic specification")
assert.equal(validateX30Spec({...valid,nodes:[...valid.nodes,{...valid.nodes[0]}]}).ok, false, "duplicate node ids")
assert.equal(validateX30Spec({...valid,nodes:[{id:"bad",type:"script",props:{}}]}).ok, false, "unknown nodes")
assert.equal(validateX30Spec({...valid,nodes:[{id:"bad",type:"hero",props:{onClick:"execute"}}]}).ok, false, "unsafe props")
assert.equal(validateX30Spec({...valid,nodes:[{id:"bad",type:"hero",props:{title:()=>"execute"}}]}).ok, false, "non-JSON props")
assert(schemaSource.includes('X30_SCHEMA_VERSION = "0.1"'), "versioned schema")
for (const entity of ["schedule","pet-list","service-list","metric"]) assert(fixtureSource.includes(`type:"${entity}"`), `fixture missing ${entity}`)
for (const domain of ["pet","finance","restaurant","beauty","trades","tech"]) assert(directionSource.includes(`${domain}:`), `domain direction missing ${domain}`)
assert(!/eval\(|Function\(|dangerouslySetInnerHTML|fetch\(|localStorage|indexedDB/.test(schemaSource + directionSource), "X30 core must remain data-only")
console.log("X30 core audit passed: versioned bounded schema, domain direction, allowlisted nodes/props, deterministic fixture and no execution or persistence authority")
