import { scanGeneratedProject, type SecurityScanFinding } from "@/lib/app-studio-security-scan"
import { sandboxPreviewDocument } from "@/lib/preview-sandbox"

/**
 * Shared App Studio boundary. The scan is advisory, but high-risk findings
 * are blocked before generated HTML can be previewed or exported.
 */
export function verifyGeneratedHtml(source: string) {
  const result = scanGeneratedProject(source)
  const blocking = result.findings.filter((finding) => finding.severity === "high")
  if (blocking.length) {
    throw new Error(`Generated app blocked by security policy: ${blocking.map((finding) => finding.code).join(", ")}`)
  }
  return result
}

export function preparePreviewHtml(source: string) {
  verifyGeneratedHtml(source)
  return sandboxPreviewDocument(source)
}

export function blockingFindings(source: string): SecurityScanFinding[] {
  return scanGeneratedProject(source).findings.filter((finding) => finding.severity === "high")
}
