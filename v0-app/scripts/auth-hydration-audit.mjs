import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const authPanel = readFileSync(resolve(appRoot, "components/auth/auth-panel.tsx"), "utf8")
const commandCenter = readFileSync(resolve(appRoot, "components/command-center/view.tsx"), "utf8")

assert.match(authPanel, /const \[hydrated, setHydrated\] = useState\(false\)/, "AuthPanel must retain the pending surface until hydration completes")
assert.match(authPanel, /useEffect\(\(\) => \{\s*setHydrated\(true\)\s*\}, \[\]\)/, "AuthPanel must mark hydration only after mount")
assert.match(authPanel, /if \(!hydrated \|\| isPending\)/, "AuthPanel must not render a session-dependent branch during hydration")

assert.match(commandCenter, /const \[hydrated, setHydrated\] = useState\(false\)/, "Command Center must retain a deterministic pre-hydration state")
assert.match(commandCenter, /useEffect\(\(\) => \{\s*setHydrated\(true\)\s*\}, \[\]\)/, "Command Center must mark hydration only after mount")
assert.match(commandCenter, /const displaySession = hydrated && !isPending \? session : null/, "Command Center must suppress session-dependent markup until hydration completes")

console.log("Auth hydration source audit: PASS")
