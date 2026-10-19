export type ActivationEvent = "get_started_viewed" | "first_customer_created" | "first_quote_created" | "first_invoice_created" | "first_core_priority_seen" | "checkout_started" | "activation_completed"

// Used only to namespace browser storage; it never enters an analytics payload.
export function activationIdentity(userId?: string | null) { return userId ? `user:${userId}` : null }
export function activationStorageKey(event: ActivationEvent, identity?: string | null) { return identity ? `hegeva:activation-event:v2:${identity}:${event}` : null }

export function hasAcknowledgedRecord<T extends { id: string }>({ cloudSaveVersion, afterVersion, cloudSavedItems, recordId }: { cloudSaveVersion: number; afterVersion: number; cloudSavedItems: T[]; recordId: string }) {
  return cloudSaveVersion > afterVersion && cloudSavedItems.some((item) => item.id === recordId)
}

export function canCompleteActivation({ workspaceIdentity, coreIdentity, customerCloud, documentCloud, hasCustomer, hasQuoteOrInvoice, coreReady, coreHasRecords, hasUsablePriority, coreRevision, requiredCoreRevision }: { workspaceIdentity: string | null; coreIdentity: string | null; customerCloud: boolean; documentCloud: boolean; hasCustomer: boolean; hasQuoteOrInvoice: boolean; coreReady: boolean; coreHasRecords: boolean; hasUsablePriority: boolean; coreRevision: number; requiredCoreRevision: number }) {
  return Boolean(workspaceIdentity) && workspaceIdentity === coreIdentity && customerCloud && documentCloud && hasCustomer && hasQuoteOrInvoice && coreReady && coreHasRecords && hasUsablePriority && coreRevision >= requiredCoreRevision
}
