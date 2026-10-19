export type PublicPortalItem = {
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type PublicPortalDocument = {
  documentType: "invoice" | "quote"
  reference: string
  issueDate: string
  dueDate: string
  currency: string
  business: { name: string }
  customer: { name: string }
  items: PublicPortalItem[]
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
}

export type PublicPortalSnapshot = {
  schemaVersion: 2
  customer: { name: string }
  documents: PublicPortalDocument[]
}

const isText = (value: unknown): value is string => typeof value === "string"
const isAmount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0

export function isPublicPortalSnapshot(value: unknown): value is PublicPortalSnapshot {
  if (!value || typeof value !== "object") return false
  const snapshot = value as Record<string, unknown>
  if (snapshot.schemaVersion !== 2 || !snapshot.customer || !Array.isArray(snapshot.documents)) return false
  const customer = snapshot.customer as Record<string, unknown>
  return isText(customer.name) && snapshot.documents.every((document) => {
    if (!document || typeof document !== "object") return false
    const item = document as Record<string, unknown>
    return (item.documentType === "invoice" || item.documentType === "quote")
      && isText(item.reference)
      && isText(item.issueDate)
      && isText(item.dueDate)
      && isText(item.currency)
      && Boolean(item.business) && isText((item.business as Record<string, unknown>).name)
      && Boolean(item.customer) && isText((item.customer as Record<string, unknown>).name)
      && Array.isArray(item.items)
      && isAmount(item.subtotal)
      && isAmount(item.vatRate)
      && isAmount(item.vatAmount)
      && isAmount(item.total)
      && item.items.every((line) => {
        if (!line || typeof line !== "object") return false
        const publicLine = line as Record<string, unknown>
        return isText(publicLine.description)
          && isAmount(publicLine.quantity)
          && isAmount(publicLine.unitPrice)
          && isAmount(publicLine.lineTotal)
      })
  })
}
