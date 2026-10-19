const text = (value, maximum = 5000) => typeof value === "string" ? value.trim().slice(0, maximum) : "";

export async function emailContentDigest(action) {
  const canonical = JSON.stringify({ recipient: text(action?.recipient, 200).toLowerCase(), subject: text(action?.subject, 300), body: text(action?.body, 10000), readyVersion: Number(action?.readyVersion) || 0 });
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function canConfirmEmailDelivery(action, digest) {
  return action?.actionType === "email-draft" && action.approvalState === "ready-to-execute" &&
    action.deliveryStatus === "not-sent" && action.executionStatus === "not-executed" &&
    Number.isSafeInteger(action.readyVersion) && action.readyVersion > 0 &&
    /^[a-f0-9]{64}$/.test(String(digest || "")) && text(action.recipient, 200) && text(action.subject, 300) && text(action.body, 10000);
}

export function applyEmailDeliveryState(action, status, { now, actorHash, providerMessageId = null, failureCode = null } = {}) {
  if (!["sending", "sent", "failed", "uncertain"].includes(status) || !text(now, 40) || !text(actorHash, 128)) return null;
  const deliveryStatus = status === "sent" ? "sent" : status === "failed" ? "failed" : "not-sent";
  return { ...action, approvalState: status, workflowStatus: status, deliveryStatus, executionStatus: status === "sent" ? "executed" : "not-executed", updatedAt: now, audit: [...action.audit, { event: status, previousState: action.approvalState, newState: status, occurredAt: now, actorHash, deliveryStatus, executionStatus: status === "sent" ? "executed" : "not-executed", ...(providerMessageId ? { providerMessageId } : {}), ...(failureCode ? { failureCode } : {}) }] };
}
