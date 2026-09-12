import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const files = ["app/enterprise/page.tsx", "components/enterprise/enterprise-hub.tsx", "lib/enterprise.ts"]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
const source = files.join("\n")

for (const token of ["EnterpriseHub", "enterprise_organizations", "useWorkspaceData", "onSubmit", "onClick", "SSO / SAML", "not cloud-synced", "window.confirm", "validateEnterprise", "owner", "admin", "editor", "viewer"]) assert(source.includes(token), `missing ${token}`)
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) assert(source.includes(locale), `missing locale ${locale}`)
assert(!source.includes("fetch(") && !source.includes("/api/"), "enterprise must reuse persistence boundary")
console.log("Enterprise business audit passed")
