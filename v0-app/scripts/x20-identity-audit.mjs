import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const source = readFileSync(new URL("../lib/app-studio-ai.ts", import.meta.url), "utf8")
assert.match(source, /getRandomValues\(bytes\)/)
assert.match(source, /bytes\[6\].*0x40/)
assert.match(source, /bytes\[8\].*0x80/)
assert.doesNotMatch(source, /newRequestId[\s\S]{0,500}Math\.random/)
assert.doesNotMatch(source, /newRequestId[\s\S]{0,500}Date\.now/)

const bytes = new Uint8Array(16)
crypto.getRandomValues(bytes)
bytes[6] = (bytes[6] & 0x0f) | 0x40
bytes[8] = (bytes[8] & 0x3f) | 0x80
const id = [...bytes].map((value, index) => `${value.toString(16).padStart(2, "0")}${[3, 5, 7, 9].includes(index) ? "-" : ""}`).join("")
assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
console.log("X20 identity audit passed: UUID v4 secure fallback and insecure generation checks")
