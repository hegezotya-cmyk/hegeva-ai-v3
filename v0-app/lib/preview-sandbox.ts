const PREVIEW_CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'; navigate-to 'none'"

/** Adds a restrictive policy without granting preview content HEGEVA-origin access. */
export function sandboxPreviewDocument(html: string) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`
  const existing = /<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/i
  if (existing.test(html)) return html.replace(existing, meta)
  return /<head(?:\s[^>]*)?>/i.test(html) ? html.replace(/<head(?:\s[^>]*)?>/i, (tag) => `${tag}\n${meta}`) : `${meta}\n${html}`
}
