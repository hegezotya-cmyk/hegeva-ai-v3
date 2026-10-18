export type PaymentFollowUpState = "active" | "promised" | "disputed" | "paused"

export type PaymentFollowUpRecord = {
  id: string
  invoiceId: string
  state: PaymentFollowUpState
  promisedDate?: string
  note?: string
  updatedAt: string
}

export type PaymentFollowUpBlockReason = "promised" | "disputed" | "paused" | null

export function paymentFollowUpBlockReason(
  record: Pick<PaymentFollowUpRecord, "state" | "promisedDate"> | undefined,
  today = new Date().toISOString().slice(0, 10),
): PaymentFollowUpBlockReason {
  if (!record || record.state === "active") return null
  if (record.state === "disputed" || record.state === "paused") return record.state
  if (record.state === "promised" && record.promisedDate && record.promisedDate >= today) return "promised"
  return null
}

