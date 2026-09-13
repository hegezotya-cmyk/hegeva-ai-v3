import assert from "node:assert/strict"
import { activationIdentity, activationStorageKey, canCompleteActivation, hasAcknowledgedRecord } from "../lib/activation-measurement.ts"
import { createCoreRequestCoordinator } from "../lib/core-request-coordinator.ts"

const accountA = activationIdentity("opaque-account-a")!
const accountB = activationIdentity("opaque-account-b")!
const event = "first_customer_created" as const
const store = new Set<string>()
const emitOnce = (identity: string) => {
  const key = activationStorageKey(event, identity)!
  if (store.has(key)) return false
  store.add(key)
  return true
}

assert.equal(hasAcknowledgedRecord({ cloudSaveVersion: 0, afterVersion: 0, cloudSavedItems: [{ id: "customer-1" }], recordId: "customer-1" }), false, "local state alone must not emit")
assert.equal(hasAcknowledgedRecord({ cloudSaveVersion: 1, afterVersion: 0, cloudSavedItems: [], recordId: "customer-1" }), false, "failed or wrong acknowledged save must not emit")
assert.equal(hasAcknowledgedRecord({ cloudSaveVersion: 1, afterVersion: 0, cloudSavedItems: [{ id: "customer-1" }], recordId: "customer-1" }), true, "acknowledged matching cloud save may emit")
assert.equal(emitOnce(accountA), true, "account A first milestone emits")
assert.equal(emitOnce(accountA), false, "account A remains deduped across a new session")
assert.equal(emitOnce(accountB), true, "account B has an independent browser namespace")
assert.equal(emitOnce(accountA), false, "switching back to account A remains deduped")

const current = { workspaceIdentity: accountA, coreIdentity: accountA, customerCloud: true, documentCloud: true, hasCustomer: true, hasQuoteOrInvoice: true, coreReady: true, coreHasRecords: true, hasUsablePriority: true, coreRevision: 4, requiredCoreRevision: 4 }
assert.equal(canCompleteActivation({ ...current, coreRevision: 3 }), false, "stale Core cannot complete activation")
assert.equal(canCompleteActivation({ ...current, coreReady: false }), false, "loading Core cannot complete activation")
assert.equal(canCompleteActivation({ ...current, coreIdentity: accountB }), false, "another account's Core cannot complete activation")
assert.equal(canCompleteActivation({ ...current, customerCloud: false }), false, "local fallback cannot complete activation")
assert.equal(canCompleteActivation(current), true, "current ready Core with persisted records completes activation")
assert.equal(activationStorageKey(event, accountA)?.includes("opaque-account-a"), true, "identity remains local storage namespace only")

let calls = 0
const coordinator = createCoreRequestCoordinator<string>()
let resolveFirst!: (value: string) => void
let resolveSecond!: (value: string) => void
const first = coordinator.request(accountA, () => { calls += 1; return new Promise((resolve) => { resolveFirst = resolve }) })
const shared = coordinator.request(accountA, async () => { calls += 1; return "unexpected" })
assert.equal(calls, 1, "simultaneous consumers share one underlying Core request")
const newer = coordinator.request(accountA, () => { calls += 1; return new Promise((resolve) => { resolveSecond = resolve }) }, true)
assert.equal(calls, 2, "one invalidation creates one newer Core generation")
resolveSecond("fresh")
assert.equal((await newer).accepted, true, "newer Core response is accepted")
resolveFirst("stale")
assert.equal((await first).accepted, false, "older Core response is ignored")
assert.equal((await shared).accepted, false, "shared older request is also stale")
const accountBRequest = coordinator.request(accountB, async () => "account-b")
assert.equal((await accountBRequest).accepted, true, "another account receives an isolated Core request")
console.log("Activation runtime regression tests passed")
