const GOVERNED_ACTION_TYPES = new Set(["email-draft"])

function text(value, maximum = 500) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : ""
}

function validAuditEntry(value) {
  return value && typeof value === "object" && text(value.event, 50) && text(value.previousState, 50) && text(value.newState, 50) && text(value.occurredAt, 40)
}

export function isGovernedExternalAction(action) {
  return Boolean(
    action &&
    typeof action === "object" &&
    GOVERNED_ACTION_TYPES.has(action.actionType) &&
    text(action.id, 100) &&
    text(action.actionKey, 200) &&
    action.deliveryStatus === "not-sent" &&
    action.executionStatus === "not-executed" &&
    ["awaiting-approval", "approved"].includes(action.approvalState) &&
    Array.isArray(action.audit) && action.audit.every(validAuditEntry),
  )
}

export function approveGovernedExternalAction(action, { actorHash, now }) {
  if (!isGovernedExternalAction(action) || !text(actorHash, 128) || !Number.isFinite(Date.parse(now))) {
    return { ok: false, reason: "invalid-action" }
  }
  if (action.approvalState === "approved") return { ok: true, idempotent: true, action }
  if (action.approvalState !== "awaiting-approval") return { ok: false, reason: "invalid-transition" }

  const approvalVersion = Number.isSafeInteger(action.approvalVersion) && action.approvalVersion >= 0 ? action.approvalVersion + 1 : 1
  const auditEntry = {
    event: "approved",
    actionType: action.actionType,
    target: text(action.recipient, 200),
    previousState: "awaiting-approval",
    newState: "approved",
    occurredAt: now,
    actorHash: text(actorHash, 128),
    deliveryStatus: "not-sent",
    executionStatus: "not-executed",
  }
  return {
    ok: true,
    idempotent: false,
    action: {
      ...action,
      approvalState: "approved",
      workflowStatus: "approved",
      approvedAt: now,
      approvedByActorHash: text(actorHash, 128),
      approvalVersion,
      audit: [...action.audit, auditEntry],
      updatedAt: now,
    },
  }
}
