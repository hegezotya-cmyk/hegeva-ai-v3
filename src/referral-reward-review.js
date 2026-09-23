import { runCoreV1Decision } from "./core-v1-decision.js";

const PAID_PLANS = new Set(["premium", "pro"]);
const ACTIVE_SUBSCRIPTIONS = new Set(["active"]);

function parseArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isRealRecord(record) {
  if (!record || typeof record !== "object" || record.demo === true || record.sample === true) return false;
  const id = String(record.id || "").toLowerCase();
  return Boolean(id) && !id.includes("demo") && !id.includes("sample");
}

async function readWorkspace(db, userId) {
  const types = ["customers", "invoice_documents", "planner", "messages", "documents", "expenses", "goals"];
  const batches = await db.batch(types.map((type) => db.prepare("SELECT data FROM workspace_data WHERE userId=?1 AND dataType=?2 LIMIT 1").bind(userId, type)));
  return Object.fromEntries(types.map((type, index) => [type, parseArray(batches[index]?.results?.[0]?.data)]));
}

export async function serverActivationState(db, userId) {
  const stored = await readWorkspace(db, userId);
  const customers = stored.customers.filter(isRealRecord);
  const invoices = stored.invoice_documents.filter(isRealRecord);
  const hasDocument = invoices.some((item) => item.type === "quote" || item.type === "invoice");
  if (!customers.length || !hasDocument) return { complete: false, reason: "activation-incomplete" };
  const result = runCoreV1Decision({ customers, invoices, tasks: stored.planner, messages: stored.messages, documents: stored.documents, expenses: stored.expenses, goals: stored.goals }, true, "en");
  const complete = result.metadata?.scope === "authenticated-cloud" && result.coreSignals?.hasRecords === true && Array.isArray(result.corePriorities) && result.corePriorities.length > 0;
  return { complete, reason: complete ? "verified" : "activation-incomplete" };
}

async function entitlementState(db, userId) {
  const [plan, customer, event] = await Promise.all([
    db.prepare("SELECT plan FROM user_plans WHERE userId=?1 LIMIT 1").bind(userId).first(),
    db.prepare("SELECT subscriptionStatus FROM stripe_customers WHERE userId=?1 LIMIT 1").bind(userId).first(),
    db.prepare("SELECT eventId FROM stripe_webhook_events WHERE userId=?1 AND outcome='applied' AND eventType IN ('checkout.session.completed','invoice.paid') ORDER BY eventCreatedAt DESC LIMIT 1").bind(userId).first(),
  ]);
  const verified = PAID_PLANS.has(plan?.plan) && ACTIVE_SUBSCRIPTIONS.has(String(customer?.subscriptionStatus || "").toLowerCase()) && Boolean(event?.eventId);
  return { verified, plan: verified ? plan.plan : null };
}

export function evaluateReferralRewardEligibilitySnapshot({ attribution, activation, entitlement }) {
  if (!attribution) return { eligible: false, reason: "attribution-missing" };
  if (attribution.creatorUserId === attribution.referredUserId) return { eligible: false, reason: "self-referral" };
  if (attribution.codeStatus !== "active") return { eligible: false, reason: "referral-revoked" };
  if (attribution.attributionState !== "pending" || !attribution.firstTouchAt || Number(attribution.touchCount || 0) < 1) return { eligible: false, reason: "attribution-invalid" };
  if (!activation?.complete) return { eligible: false, reason: "activation-incomplete" };
  if (!entitlement?.verified) return { eligible: false, reason: "entitlement-not-verified" };
  return { eligible: true, reason: "eligible" };
}

export async function evaluateReferralRewardEligibility(db, referredUserId) {
  const attribution = await db.prepare(`
    SELECT a.id AS attributionId,a.referredUserId,a.firstTouchAt,a.attributionState,
           c.ownerUserId AS creatorUserId,c.status AS codeStatus,
           (SELECT COUNT(*) FROM referral_touches t WHERE t.codeId=a.codeId AND t.occurredAt<=a.firstTouchAt) AS touchCount
    FROM referral_attributions a
    JOIN referral_codes c ON c.id=a.codeId
    WHERE a.referredUserId=?1 LIMIT 1
  `).bind(referredUserId).first();
  if (!attribution) return { eligible: false, reason: "attribution-missing" };
  const activation = await serverActivationState(db, referredUserId);
  const entitlement = await entitlementState(db, referredUserId);
  return { ...evaluateReferralRewardEligibilitySnapshot({ attribution, activation, entitlement }), attribution, activation, entitlement };
}

export async function reconcileReferralRewardForUser(db, referredUserId, now = new Date().toISOString()) {
  const eligibility = await evaluateReferralRewardEligibility(db, referredUserId);
  if (!eligibility.eligible) return { created: false, reason: eligibility.reason };
  const { attributionId, creatorUserId } = eligibility.attribution;
  const result = await db.prepare(`
    INSERT INTO referral_reward_reviews(id,attributionId,creatorUserId,referredUserId,status,createdAt,updatedAt)
    VALUES(?1,?2,?3,?4,'pending',?5,?5)
    ON CONFLICT(attributionId) DO NOTHING
  `).bind(crypto.randomUUID(), attributionId, creatorUserId, referredUserId, now).run();
  return { created: Number(result?.meta?.changes || 0) === 1, reason: "eligible" };
}

export async function reverseApprovedReferralRewards(db, referredUserId, reason = "entitlement-invalid", actorHash = "system", now = new Date().toISOString()) {
  const result = await db.prepare(`
    UPDATE referral_reward_reviews SET status='reversed',reviewedBy=?1,reviewedAt=?2,decisionReason=?3,updatedAt=?2
    WHERE referredUserId=?4 AND status = 'approved'
  `).bind(actorHash, now, reason, referredUserId).run();
  return { reversed: Number(result?.meta?.changes || 0) };
}

export async function listReferralRewardReviews(db, userId, isOwnerReviewer = false) {
  const where = isOwnerReviewer ? "1=1" : "r.creatorUserId=?1";
  const statement = db.prepare(`
    SELECT r.id,r.status,r.createdAt,r.creatorUserId,
           (SELECT COUNT(*) FROM referral_touches t WHERE t.codeId=a.codeId) AS touchCount
    FROM referral_reward_reviews r JOIN referral_attributions a ON a.id=r.attributionId
    WHERE ${where} ORDER BY r.createdAt DESC LIMIT 100
  `);
  const result = await (isOwnerReviewer ? statement.all() : statement.bind(userId).all());
  return (result.results || []).map((row) => {
    const aggregate = { status: row.status, touchCount: Number(row.touchCount || 0) };
    return isOwnerReviewer ? { ...aggregate, id: row.id, canReview: row.creatorUserId !== userId } : aggregate;
  });
}

export async function reviewReferralReward(db, { reviewId, reviewerUserId, decision, reason, actorHash }) {
  if (!new Set(["approved", "rejected"]).has(decision)) return { status: 400, error: "Invalid review decision." };
  const current = await db.prepare("SELECT id,creatorUserId,referredUserId,status FROM referral_reward_reviews WHERE id=?1 LIMIT 1").bind(reviewId).first();
  if (!current) return { status: 404, error: "Review unavailable." };
  if (current.creatorUserId === reviewerUserId) return { status: 403, error: "Creators cannot review their own reward." };
  if (current.status === decision) return { status: 200, data: { status: decision, unchanged: true } };
  if (current.status !== "pending") return { status: 409, error: "Review is no longer pending." };
  if (decision === "approved") {
    const eligibility = await evaluateReferralRewardEligibility(db, current.referredUserId);
    if (!eligibility.eligible) return { status: 409, error: "Reward eligibility is no longer verified." };
  }
  const now = new Date().toISOString();
  const updated = await db.prepare("UPDATE referral_reward_reviews SET status=?1,reviewedBy=?2,reviewedAt=?3,decisionReason=?4,updatedAt=?3 WHERE id=?5 AND status='pending'").bind(decision, actorHash, now, reason, reviewId).run();
  if (Number(updated?.meta?.changes || 0) !== 1) return { status: 409, error: "Review changed; reload and try again." };
  return { status: 200, data: { status: decision, reviewedAt: now } };
}
