import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const brand = read("lib/document-print-brand.ts")
const invoice = read("app/business/invoices/page.tsx")
const studio = read("components/business/document-studio.tsx")

assert(brand.includes("hegeva-logo-gold-official.png"), "official gold logo must be the only document brand asset")
assert(brand.includes("HEGEVA_DOCUMENT_PRINT"), "shared print brand must provide the document shell")
assert(brand.includes("@page"), "shared print brand must define A4 print output")
assert(brand.includes("document-totals"), "shared print brand must protect totals from page splits")
assert(brand.includes("break-inside: avoid"), "shared print brand must protect key sections from page splits")
assert(invoice.includes("renderOfficialDocumentPrint"), "invoice and quote print must use the shared document brand")
assert(studio.includes("renderOfficialDocumentPrint"), "contract, receipt and tax summary print must use the shared document brand")
assert(!invoice.includes("hegeva-logo.png"), "invoice output must not use a legacy logo")
assert(!studio.includes("hegeva-winged-logo.png"), "studio output must not use a legacy logo")

console.log("Official document branding regression audit passed")
