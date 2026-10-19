import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const files = ["app/enterprise/page.tsx", "components/enterprise/enterprise-completion.tsx", "lib/enterprise.ts"]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
const source = files.join("\n")

for (const token of ["EnterpriseCompletion", "enterprise_organizations", "appendEnterpriseAudit", "exportEnterpriseCompliance", "ENTERPRISE_PERMISSIONS", "invitations", "ssoStatus", "SSO / SAML", "owner", "admin", "editor", "viewer", "not cloud-synced", "role=\"status\""]) assert(source.includes(token), `missing ${token}`)
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) assert(source.includes(locale), `missing locale ${locale}`)
assert(!source.includes("fetch(") && !source.includes("/api/"), "enterprise must reuse workspace persistence")
assert(source.includes("rawSecretsIncluded:false"), "compliance export must redact secrets")
assert(source.includes("ssoStatus:\"unavailable\""), "SSO must fail closed")
console.log("Enterprise completion audit passed")
