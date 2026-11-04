import assert from "node:assert/strict"
import fs from "node:fs"

const source = fs.readFileSync(new URL("../lib/auth-client.ts", import.meta.url), "utf8")
assert.match(source, /typeof window !== "undefined"\s*\? window\.location\.origin/)
assert.match(source, /NEXT_PUBLIC_APP_ENV === "staging"\s*\? "https:\/\/staging\.hegevaai\.co\.uk"/)
console.log("Auth origin test: PASS (browser requests remain on current first-party origin)")
