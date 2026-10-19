import type { Metadata } from "next"
import { PublicDocumentView } from "@/components/business/public-document-view"
import { isPublicPortalSnapshot } from "@/lib/client-portal-public-types"

export const metadata: Metadata = { robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

type LegacySnapshot = { schemaVersion: 1; customer?: { name?: string }; documents?: Array<{ documentType?: string; reference?: string; issueDate?: string; dueDate?: string }> }

function isLegacySnapshot(value: unknown): value is LegacySnapshot {
  return Boolean(value && typeof value === "object" && (value as { schemaVersion?: unknown }).schemaVersion === 1)
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://hegevaai.co.uk"
  const response = await fetch(`${base}/api/client-portal/public/${encodeURIComponent(token)}`, { cache: "no-store" })
  if (!response.ok) return <main className="mx-auto max-w-3xl p-8"><h1 className="font-display text-3xl">Portal unavailable</h1><p className="mt-3 text-muted-foreground">This private link is invalid, expired or revoked.</p></main>
  const data: unknown = await response.json()
  if (isPublicPortalSnapshot(data)) return <main className="mx-auto max-w-5xl p-4 sm:p-10"><PublicDocumentView snapshot={data} /></main>
  if (isLegacySnapshot(data)) return <main className="mx-auto max-w-4xl p-6 sm:p-10"><p className="ve-eyebrow">HEGEVA · PRIVATE CLIENT PORTAL</p><h1 className="mt-3 font-display text-4xl">{data.customer?.name || "Customer portal"}</h1><p className="mt-2 text-sm text-muted-foreground">Read-only shared records · no payment or editing</p><section className="mt-8 space-y-4">{data.documents?.map((document, index) => <article key={`${document.reference || "document"}-${index}`} className="rounded-2xl border border-border p-5"><strong>{document.reference || "Document"}</strong><p className="mt-2 text-sm text-muted-foreground">{document.documentType} · {document.issueDate} → {document.dueDate}</p></article>)}</section></main>
  return <main className="mx-auto max-w-3xl p-8"><h1 className="font-display text-3xl">Portal unavailable</h1><p className="mt-3 text-muted-foreground">This private link is invalid, expired or revoked.</p></main>
}
