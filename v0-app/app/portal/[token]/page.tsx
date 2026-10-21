import type { Metadata } from "next"
import { headers } from "next/headers"
import { PublicDocumentView } from "@/components/business/public-document-view"
import { isPublicPortalSnapshot } from "@/lib/client-portal-public-types"
import { portalOrigin } from "@/lib/client-portal-origin"
import { portalDiagnostic } from "@/lib/client-portal-diagnostic"

export const metadata: Metadata = { robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

type LegacySnapshot = { schemaVersion: 1; customer?: { name?: string }; documents?: Array<{ documentType?: string; reference?: string; issueDate?: string; dueDate?: string }> }

function isLegacySnapshot(value: unknown): value is LegacySnapshot {
  return Boolean(value && typeof value === "object" && (value as { schemaVersion?: unknown }).schemaVersion === 1)
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const host = (await headers()).get("host")
  const base = portalOrigin(host)
  const correlationId = crypto.randomUUID()
  const diagnostic = (phase: "origin" | "fetch" | "json" | "validation", status?: number) => portalDiagnostic(process.env.NEXT_PUBLIC_APP_ENV, phase, { host, status, correlationId })
  diagnostic("origin", base ? 200 : 400)
  if (!base) return <main className="mx-auto max-w-3xl p-8"><h1 className="font-display text-3xl">Portal unavailable</h1><p className="mt-3 text-muted-foreground">This private link is invalid, expired or revoked.</p></main>
  let response: Response
  try { response = await fetch(`${base}/api/client-portal/public/${encodeURIComponent(token)}`, { cache: "no-store" }) }
  catch { diagnostic("fetch"); throw new Error("Portal fetch failed") }
  diagnostic("fetch", response.status)
  if (!response.ok) return <main className="mx-auto max-w-3xl p-8"><h1 className="font-display text-3xl">Portal unavailable</h1><p className="mt-3 text-muted-foreground">This private link is invalid, expired or revoked.</p></main>
  let data: unknown
  try { data = await response.json() }
  catch { diagnostic("json"); throw new Error("Portal JSON processing failed") }
  diagnostic("json", 200)
  if (isPublicPortalSnapshot(data)) { diagnostic("validation", 200); return <main className="mx-auto max-w-5xl p-4 sm:p-10"><PublicDocumentView snapshot={data} /></main> }
  if (isLegacySnapshot(data)) return <main className="mx-auto max-w-4xl p-6 sm:p-10"><p className="ve-eyebrow">HEGEVA · PRIVATE CLIENT PORTAL</p><h1 className="mt-3 font-display text-4xl">{data.customer?.name || "Customer portal"}</h1><p className="mt-2 text-sm text-muted-foreground">Read-only shared records · no payment or editing</p><section className="mt-8 space-y-4">{data.documents?.map((document, index) => <article key={`${document.reference || "document"}-${index}`} className="rounded-2xl border border-border p-5"><strong>{document.reference || "Document"}</strong><p className="mt-2 text-sm text-muted-foreground">{document.documentType} · {document.issueDate} → {document.dueDate}</p></article>)}</section></main>
  diagnostic("validation", 400)
  return <main className="mx-auto max-w-3xl p-8"><h1 className="font-display text-3xl">Portal unavailable</h1><p className="mt-3 text-muted-foreground">This private link is invalid, expired or revoked.</p></main>
}
