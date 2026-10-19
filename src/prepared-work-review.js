const ROLES = new Set(["Sales", "Finance", "Marketing", "Support"]);
const STATUSES = new Set(["awaiting-review", "approved", "cancelled", "completed-locally"]);

function text(value, maximum = 500) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function validDelegation(value) {
  return value && typeof value === "object" && ROLES.has(value.role) && text(value.label, 120) &&
    text(value.title, 240) && text(value.content, 4000) && Array.isArray(value.sourceIds) &&
    value.sourceIds.length > 0 && value.sourceIds.every((id) => text(id, 128)) &&
    text(value.targetType, 80) && text(value.targetHref, 240).startsWith("/") &&
    text(value.rationale, 160) && Number.isFinite(Date.parse(value.preparedAt));
}

function actionKey(delegation) {
  return `${delegation.role}:${delegation.targetType}:${delegation.rationale}:${[...delegation.sourceIds].sort().join(",")}`;
}

function validRecord(value) {
  return validDelegation(value) && text(value.id, 300) && text(value.actionKey, 600) &&
    STATUSES.has(value.status) && value.preparationStatus === "prepared" &&
    value.deliveryStatus === "not-sent" && value.executionStatus === "not-executed" &&
    Number.isFinite(Date.parse(value.createdAt)) && Number.isFinite(Date.parse(value.updatedAt)) &&
    Array.isArray(value.audit);
}

export function synchronizePreparedWork(existing, delegations, now) {
  if (!Array.isArray(existing) || existing.some((record) => !validRecord(record))) {
    return { ok: false, reason: "invalid-persisted-record" };
  }
  const records = existing;
  if (!Number.isFinite(Date.parse(now)) || !Array.isArray(delegations)) return { ok: false, reason: "invalid-request" };
  const keys = new Set(records.map((record) => record.actionKey));
  const additions = delegations.filter(validDelegation).flatMap((delegation) => {
    const key = actionKey(delegation);
    if (keys.has(key)) return [];
    keys.add(key);
    return [{
      id: `prepared-work:${key}`,
      actionKey: key,
      role: delegation.role,
      label: text(delegation.label, 120),
      title: text(delegation.title, 240),
      content: text(delegation.content, 4000),
      sourceIds: [...delegation.sourceIds],
      targetType: text(delegation.targetType, 80),
      targetHref: text(delegation.targetHref, 240),
      rationale: text(delegation.rationale, 160),
      preparedAt: delegation.preparedAt,
      status: "awaiting-review",
      preparationStatus: "prepared",
      deliveryStatus: "not-sent",
      executionStatus: "not-executed",
      createdAt: now,
      updatedAt: now,
      audit: [{ event: "prepared", previousState: "prepared", newState: "awaiting-review", occurredAt: now }],
    }];
  });
  return { ok: true, created: additions.length, records: [...additions, ...records] };
}

export function transitionPreparedWork(records, actionId, transition, { actorHash, now }) {
  if (!Array.isArray(records) || !text(actionId, 300) || !text(actorHash, 128) || !Number.isFinite(Date.parse(now))) return { ok: false, reason: "invalid-request" };
  const index = records.findIndex((record) => record?.id === actionId);
  if (index < 0 || !validRecord(records[index])) return { ok: false, reason: "not-found" };
  const current = records[index];
  const nextStatus = transition === "approve" && current.status === "awaiting-review" ? "approved"
    : transition === "cancel" && ["awaiting-review", "approved"].includes(current.status) ? "cancelled"
    : transition === "complete-locally" && current.status === "approved" ? "completed-locally" : "";
  if (!nextStatus) return { ok: false, reason: "invalid-transition" };
  const next = { ...current, status: nextStatus, updatedAt: now, audit: [...current.audit, { event: nextStatus, previousState: current.status, newState: nextStatus, occurredAt: now, actorHash: text(actorHash, 128) }] };
  const nextRecords = records.map((record, recordIndex) => recordIndex === index ? next : record);
  return { ok: true, record: next, records: nextRecords };
}
