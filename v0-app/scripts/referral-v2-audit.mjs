import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const migration = read("../../migrations/0031_referral_rewards.sql");
const reward = read("../../src/referral-reward-review.js");
const attribution = read("../../src/referral-attribution.js");
const worker = read("../../src/index.js");
const consent = read("../components/analytics-consent.tsx");
const ui = read("../components/growth/referral-review.tsx");

for (const field of ["referral_rewards", "attributionId", "referrerUserId", "referredUserId", "eligibilityReason", "eligibleAt", "approvedAt", "approvedBy", "executedAt"]) {
  assert(migration.includes(field), `migration missing ${field}`);
}
for (const status of ["PENDING", "ELIGIBLE", "APPROVED", "REJECTED", "EXECUTED"]) {
  assert(migration.includes(`'${status}'`), `migration missing ${status} status`);
}
assert(migration.includes("UNIQUE") && migration.includes("referral_rewards_status_idx"), "reward uniqueness/indexes missing");
assert(reward.includes("serverActivationState") && reward.includes("stripe_webhook_events"), "qualification must use server activation and verified webhook entitlement");
assert(reward.includes("ON CONFLICT(attributionId) DO UPDATE SET") && reward.includes("status IN ('PENDING','ELIGIBLE')"), "reconciliation update must be status guarded");
assert(reward.includes("status='REJECTED'") && reward.includes("status IN ('ELIGIBLE','APPROVED')"), "entitlement invalidation reversal missing");
assert(!/status\s*=\s*['\"]EXECUTED['\"]/.test(reward), "automatic code must not transition to EXECUTED");
assert(!/INSERT INTO referral_rewards[^;]*EXECUTED/i.test(reward), "automatic code must not insert EXECUTED");
assert(attribution.includes("code.ownerUserId===referredUserId"), "self-referral guard missing");
assert(attribution.includes("referredUserId TEXT NOT NULL UNIQUE") || fs.readFileSync(new URL("../../migrations/0024_referrals.sql", import.meta.url), "utf8").includes("referredUserId TEXT NOT NULL UNIQUE"), "duplicate attribution constraint missing");
for (const route of ["/api/referrals/activation", "/api/referrals/reward-reviews"]) assert(worker.includes(route), `route missing ${route}`);
for (const event of ["referral_link_copy", "referral_paid_qualified"]) assert(consent.includes(event), `consent event missing ${event}`);
assert(ui.includes("total") && ui.includes("paid") && ui.includes("eligible"), "account aggregate summary missing");
for (const forbidden of ["email", "workspaceId", "referralCode", "paymentId"]) {
  assert(!new RegExp(`params:\\s*\\{[^}]*${forbidden}`, "i").test(ui), `PII-like analytics field ${forbidden} found`);
}
console.log("Referral V2 audit passed: server-authoritative paid qualification, status-guarded idempotency, privacy-safe summaries, and no automatic EXECUTED path");
