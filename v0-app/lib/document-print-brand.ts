export const OFFICIAL_GOLD_LOGO_PATH = "/hegeva-logo-gold-official.png"

type OfficialDocumentPrint = {
  logoUrl: string
  documentType: string
  reference?: string
  metadata?: string
  content: string
  footer?: string
}

const HEGEVA_DOCUMENT_PRINT = `
  @page { size: A4 portrait; margin: 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #17201c; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; }
  .document-page { max-width: 900px; margin: 0 auto; }
  .document-brand-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 86px; padding: 16px 20px; color: #fff; background: #070908; border-bottom: 3px solid #c99a34; break-inside: avoid; page-break-inside: avoid; }
  .document-brand-logo { display: block; width: 210px; max-width: 54%; height: auto; object-fit: contain; }
  .document-brand-identity { min-width: 0; text-align: right; }
  .document-brand-type { margin: 0; color: #f4c45d; font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
  .document-brand-reference { margin: 5px 0 0; color: #fff; font-size: 18px; font-weight: 700; overflow-wrap: anywhere; }
  .document-brand-meta { margin: 3px 0 0; color: #d5dbd5; font-size: 10px; }
  .document-body { padding-top: 26px; }
  .document-section { break-inside: avoid; page-break-inside: avoid; }
  .document-footer { margin-top: 34px; padding-top: 12px; border-top: 1px solid #d9ddd9; color: #5c665f; font-size: 9px; }
  table { width: 100%; border-collapse: collapse; margin-top: 26px; }
  th, td { padding: 10px; border-bottom: 1px solid #d8ddd8; text-align: left; vertical-align: top; }
  th { color: #26352d; background: #f1f4f1; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
  .document-totals { width: min(100%, 320px); margin: 26px 0 0 auto; break-inside: avoid; page-break-inside: avoid; }
  .document-totals p { display: flex; justify-content: space-between; gap: 16px; margin: 0; padding: 5px 0; }
  .document-totals .grand { margin-top: 8px; padding-top: 11px; border-top: 2px solid #17201c; font-size: 15px; font-weight: 700; }
  .document-notes { margin-top: 30px; white-space: pre-wrap; break-inside: avoid; page-break-inside: avoid; }
  .document-grid { display: flex; justify-content: space-between; gap: 30px; margin-top: 24px; break-inside: avoid; page-break-inside: avoid; }
  .document-grid > * { flex: 1 1 0; min-width: 0; }
  .document-grid h2 { margin: 0 0 7px; color: #26352d; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; }
  .document-grid p { margin: 0; white-space: pre-wrap; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .document-page { max-width: none; } }
  @media (max-width: 560px) { .document-brand-header { align-items: flex-start; flex-direction: column; } .document-brand-logo { width: 190px; max-width: 100%; } .document-brand-identity { text-align: left; } .document-grid { display: block; } .document-grid > * + * { margin-top: 20px; } th, td { padding: 8px 6px; font-size: 9px; } }
`

export function renderOfficialDocumentPrint({ logoUrl, documentType, reference, metadata, content, footer = "HEGEVA AI" }: OfficialDocumentPrint) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${documentType}${reference ? ` · ${reference}` : ""}</title><style>${HEGEVA_DOCUMENT_PRINT}</style></head><body><main class="document-page"><header class="document-brand-header"><img class="document-brand-logo" src="${logoUrl}" alt="HEGEVA AI"><div class="document-brand-identity"><p class="document-brand-type">${documentType}</p>${reference ? `<p class="document-brand-reference">${reference}</p>` : ""}${metadata ? `<p class="document-brand-meta">${metadata}</p>` : ""}</div></header><section class="document-body">${content}</section><footer class="document-footer">${footer}</footer></main></body></html>`
}
