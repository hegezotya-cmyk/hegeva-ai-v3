import assert from "node:assert/strict"
import fs from "node:fs"

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8")
const schema=read("lib/x30/schema.ts")
const renderer=read("components/x30/safe-renderer.tsx")
const fixture=read("lib/x30/fixtures.ts")
const direction=read("lib/x30/domain-visual-intelligence.ts")
assert(schema.includes('X30_SCHEMA_VERSION = "0.1"'),"X30 schema must be versioned")
assert(schema.includes("Unknown component")&&schema.includes("Unsafe prop"),"X30 must reject unknown nodes and props")
assert(!renderer.includes("dangerouslySetInnerHTML")&&!renderer.includes("eval("),"X30 renderer must not execute markup or code")
assert(renderer.includes("validateX30Spec(spec)"),"Renderer must validate before rendering")
for(const entity of ["schedule","pet-list","service-list","metric"]) assert(fixture.includes(`type:\"${entity}\"`),`Fixture missing ${entity}`)
for(const domain of ["pet","finance","restaurant","beauty","trades","tech"]) assert(direction.includes(`${domain}:`),`Domain direction missing ${domain}`)
console.log("X30 Alpha audit passed: versioned schema, domain direction, allowlisted registry, safe props, deterministic fixture and no code execution")
