import { chromium } from "playwright"
import { renderOfficialDocumentPrint, OFFICIAL_GOLD_LOGO_PATH } from "../lib/document-print-brand.ts"

const output = "C:/Users/hegez/.codex/visualizations/2026/09/04/01a06a97-45cd-7821-9da3-48bee903b240"
const logoUrl = `https://hegevaai.co.uk${OFFICIAL_GOLD_LOGO_PATH}`

const previews = [
  {
    name: "invoice",
    type: "INVOICE",
    reference: "INV-2026-001",
    metadata: "Issue date: 14 September 2026 · Due date: 28 September 2026",
    content: `<div class="document-grid"><div><h2>From / Business</h2><p><strong>Harmless Test Services Ltd</strong><br>London, United Kingdom</p></div><div><h2>Bill to / Customer</h2><p><strong>Example Customer</strong><br>Test address only</p></div></div><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody><tr><td>Sample service</td><td>1</td><td>£100.00</td><td>£100.00</td></tr></tbody></table><div class="document-totals"><p><span>Subtotal</span><strong>£100.00</strong></p><p><span>VAT (20%)</span><strong>£20.00</strong></p><p class="grand"><span>Total</span><strong>£120.00</strong></p></div><div class="document-notes">Harmless sample payment note.</div>`,
  },
  {
    name: "quote",
    type: "QUOTE",
    reference: "QUO-2026-001",
    metadata: "Issue date: 14 September 2026 · Valid until: 28 September 2026",
    content: `<div class="document-grid"><div><h2>From / Business</h2><p><strong>Harmless Test Services Ltd</strong><br>London, United Kingdom</p></div><div><h2>Bill to / Customer</h2><p><strong>Example Customer</strong><br>Test address only</p></div></div><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody><tr><td>Sample proposal</td><td>1</td><td>£250.00</td><td>£250.00</td></tr></tbody></table><div class="document-totals"><p><span>Subtotal</span><strong>£250.00</strong></p><p><span>VAT (20%)</span><strong>£50.00</strong></p><p class="grand"><span>Total</span><strong>£300.00</strong></p></div>`,
  },
  {
    name: "contract",
    type: "CONTRACT",
    reference: "Sample service agreement",
    metadata: "Prepared 14 September 2026",
    content: `<div class="document-section"><h2>Parties</h2><p>Harmless Test Services Ltd and Example Customer</p><h2>Scope</h2><p>Sample content only for visual review.</p><h2>Payment terms</h2><p>Existing contract text remains unchanged in the product.</p></div>`,
  },
]

const browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" })
for (const preview of previews) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 1448 }, deviceScaleFactor: 1 })
  await page.setContent(renderOfficialDocumentPrint({ logoUrl, documentType: preview.type, reference: preview.reference, metadata: preview.metadata, content: preview.content, footer: `HEGEVA AI · ${preview.type} · ${preview.reference}` }), { waitUntil: "load" })
  await page.waitForFunction(() => document.images[0]?.complete)
  await page.screenshot({ path: `${output}/hegeva-document-${preview.name}-preview.png`, fullPage: true })
  await page.emulateMedia({ media: "print" })
  await page.pdf({ path: `${output}/hegeva-document-${preview.name}-print-preview.pdf`, format: "A4", printBackground: true, margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" } })
  await page.close()
}
await browser.close()
console.log("Generated official document sample previews")
