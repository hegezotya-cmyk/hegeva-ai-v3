import type { Metadata } from "next"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { headers } from "next/headers"
import { PublicDocumentView } from "@/components/business/public-document-view"
import { isPublicPortalSnapshot } from "@/lib/client-portal-public-types"
import { portalOrigin } from "@/lib/client-portal-origin"
import { fetchPortalSnapshot } from "@/lib/client-portal-service"

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
  if (!base) return <main className="mx-auto max-w-3xl p-8"><h1 className="font-display text-3xl">Portal unavailable</h1><p className="mt-3 text-muted-foreground">This private link is invalid, expired or revoked.</p></main>
  let response: Response
  try {
    const { env } = await getCloudflareContext({ async: true })
    if (!env.HEGEVA_API) throw new Error("Portal API binding unavailable")
    response = await fetchPortalSnapshot(env.HEGEVA_API, process.env.NEXT_PUBLIC_APP_ENV, base, token)
  }
  catch { throw new Error("Portal fetch failed") }
  if (!response.ok) return <main className="mx-auto max-w-3xl p-8"><h1 className="font-display text-3xl">Portal unavailable</h1><p className="mt-3 text-muted-foreground">This private link is invalid, expired or revoked.</p></main>
  let data: unknown
  try { data = await response.json() }
  catch { throw new Error("Portal JSON processing failed") }
  if (isPublicPortalSnapshot(data)) { return <main className="mx-auto max-w-5xl p-4 sm:p-10"><PublicDocumentView snapshot={data} /></main> }
  if (isLegacySnapshot(data)) return <main className="mx-auto max-w-4xl p-6 sm:p-10"><p className="ve-eyebrow">HEGEVA · PRIVATE CLIENT PORTAL</p><h1 className="mt-3 font-display text-4xl">{data.customer?.name || "Customer portal"}</h1><p className="mt-2 text-sm text-muted-foreground">Read-only shared records · no payment or editing</p><section className="mt-8 space-y-4">{data.documents?.map((document, index) => <article key={`${document.reference || "document"}-${index}`} className="rounded-2xl border border-border p-5"><strong>{document.reference || "Document"}</strong><p className="mt-2 text-sm text-muted-foreground">{document.documentType} · {document.issueDate} → {document.dueDate}</p></article>)}</section></main>
  return <main className="mx-auto max-w-3xl p-8"><h1 className="font-display text-3xl">Portal unavailable</h1><p className="mt-3 text-muted-foreground">This private link is invalid, expired or revoked.</p></main>
}
