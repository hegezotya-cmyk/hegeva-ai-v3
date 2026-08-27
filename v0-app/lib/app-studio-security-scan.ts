export type SecurityScanFinding = { code: string; severity: "warning" | "high"; detail: string }
export type SecurityScanResult = { ok: boolean; findings: SecurityScanFinding[] }

const rules: Array<[string, RegExp, SecurityScanFinding["severity"], string]> = [
  ["dynamic-code", /\beval\s*\(|new\s+Function\s*\(/i, "high", "Dynamic code execution pattern detected."],
  ["credential-capture", /(password|token|secret)[^\n]{0,80}(fetch|XMLHttpRequest|sendBeacon)/i, "high", "Potential credential transmission pattern detected."],
  ["remote-script", /<script[^>]+src=["']https?:\/\//i, "warning", "Remote script dependency detected."],
  ["top-navigation", /(window\.top|parent\.location|top\.location)\s*=/i, "high", "Top-level navigation attempt detected."],
  ["unsafe-postmessage", /postMessage\s*\([^,]+,\s*["']\*["']/i, "high", "Wildcard postMessage target detected."],
]

/** Static advisory scan; it does not certify generated code as safe. */
export function scanGeneratedProject(source: string): SecurityScanResult {
  const findings = rules.filter(([, pattern]) => pattern.test(source)).map(([code, , severity, detail]) => ({ code, severity, detail }))
  return { ok: findings.length === 0, findings }
}
