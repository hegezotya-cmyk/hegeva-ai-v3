import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8")
const schema=read("lib/x30/schema.ts")
const renderer=read("components/x30/safe-renderer.tsx")
const fixture=read("lib/x30/fixtures.ts")
const direction=read("lib/x30/domain-visual-intelligence.ts")
const schemaModule=ts.transpileModule(schema,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {validateX30Spec}=await import(`data:text/javascript;base64,${Buffer.from(schemaModule).toString("base64")}`)
assert(schema.includes('X30_SCHEMA_VERSION = "0.1"'),"X30 schema must be versioned")
assert(fs.readFileSync(new URL("../app/app-studio/x30-alpha/page.tsx", import.meta.url), "utf8").includes("deriveWorkspaceVisualDirection"), "X30 workspace preview must derive direction from bounded summaries")
assert(schema.includes("x30.unknown_component")&&schema.includes("x30.unsafe_prop"),"X30 must reject unknown nodes and props")
assert(!renderer.includes("dangerouslySetInnerHTML")&&!renderer.includes("eval("),"X30 renderer must not execute markup or code")
assert(renderer.includes("validateX30Spec(spec)"),"Renderer must validate before rendering")
const validSpec={version:"0.1",id:"demo-app",name:"Demo",direction:{industry:"Professional services",mood:"calm",density:"balanced",primaryWorkflow:"Plan",palette:"studio",surface:"structured",typography:"confident",navigation:"workspace",mobilePriority:"Next",componentPriorities:["workflow"]},nodes:[{id:"hero",type:"hero",props:{title:"Hello"}},{id:"list",type:"schedule",props:{title:"Tasks",items:[{id:"task-a",time:"10:00",pet:"Task"}]}}]}
assert.equal(validateX30Spec(validSpec).ok,true,"valid fixture structure must pass")
const duplicateNodes={...validSpec,nodes:[validSpec.nodes[0],{...validSpec.nodes[1],id:validSpec.nodes[0].id}]}
assert.equal(validateX30Spec(duplicateNodes).ok,false,"duplicate top-level IDs must fail")
const duplicateItems={...validSpec,nodes:validSpec.nodes.map((node)=>node.type==="schedule"?{...node,props:{...node.props,items:[{id:"same",time:"1"},{id:"same",time:"2"}]}}:node)}
assert.equal(validateX30Spec(duplicateItems).ok,false,"duplicate nested IDs must fail")
assert.equal(validateX30Spec({...validSpec,direction:{...validSpec.direction,mood:"unsafe"}}).ok,false,"invalid direction must fail")
assert.equal(validateX30Spec({...validSpec,nodes:[{...validSpec.nodes[0],props:{...validSpec.nodes[0].props,variant:"unsafe"}}]}).ok,false,"invalid variant must fail")
assert.equal(validateX30Spec(JSON.parse('{"version":"0.1","id":"safe-app","name":"Safe","direction":{},"nodes":[{"id":"node","type":"hero","props":{"__proto__":"blocked"}}]}')).ok,false,"unsafe keys must fail")
assert.equal(validateX30Spec({...validSpec,nodes:[{...validSpec.nodes[0],props:{label:"x",value:Infinity}}]}).ok,false,"invalid numbers must fail")
assert.equal(validateX30Spec({...validSpec,nodes:[{...validSpec.nodes[0],props:{...validSpec.nodes[0].props,title:"x".repeat(181)}}]}).ok,false,"excessive strings must fail")
assert.equal(validateX30Spec({...validSpec,version:"0.2"}).ok,false,"unknown schema versions must fail")
assert.equal(validateX30Spec({...validSpec,nodes:[{...validSpec.nodes[0],type:"script"}]}).ok,false,"unknown components must fail")
assert(renderer.includes("text(")&&renderer.includes("Read-only preview")&&!renderer.includes("dangerouslySetInnerHTML")&&!renderer.includes("new Function")&&!renderer.includes("eval("),"renderer must remain inert and text-safe")
for(const entity of ["schedule","pet-list","service-list","metric"]) assert(fixture.includes(`type:\"${entity}\"`),`Fixture missing ${entity}`)
for(const domain of ["pet","finance","restaurant","beauty","trades","tech"]) assert(direction.includes(`${domain}:`),`Domain direction missing ${domain}`)
console.log("X30 Alpha audit passed: versioned schema, domain direction, allowlisted registry, safe props, deterministic fixture and no code execution")
