import assert from "node:assert/strict"
import fs from "node:fs"

const root = new URL("../../", import.meta.url)
const read = (path) => fs.readFileSync(new URL(path, root), "utf8")

const migration = read("migrations/0025_referral_reward_reviews.sql")
const rewards = read("src/referral-reward-review.js")
const worker = read("src/index.js")
const ledger = read("src/index-ledger.js")
const ui = read("v0-app/components/growth/referral-review.tsx")
const core = read("v0-app/components/command-center/core-decision-surface.tsx")
const analytics = read("v0-app/components/analytics-consent.tsx")
await import("./audit-runtime-register.mjs")
const { evaluateReferralRewardEligibilitySnapshot, reconcileReferralRewardForUser, reverseApprovedReferralRewards } = await import("../../src/referral-reward-review.js")
const { createRequestHandler } = await import("../../src/index.js")
const { DatabaseSync } = await import("node:sqlite")

function d1(database) {
  const prepare = (sql) => {
    let values = []
    const statement = {
      bind(...next) { values = next; return statement },
      async first() { return database.prepare(sql).get(...values) || null },
      async all() { return { results: database.prepare(sql).all(...values) } },
      async run() { const result = database.prepare(sql).run(...values); return { meta: { changes: Number(result.changes) } } },
    }
    return statement
  }
  return { prepare, async batch(statements) { return Promise.all(statements.map((statement) => statement.all())) } }
}

function rewardDatabase() {
  const database = new DatabaseSync(":memory:")
  database.exec(`
    CREATE TABLE workspace_data (userId TEXT NOT NULL, dataType TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(userId,dataType));
    CREATE TABLE user_plans (userId TEXT PRIMARY KEY, plan TEXT NOT NULL);
    CREATE TABLE stripe_customers (userId TEXT PRIMARY KEY, subscriptionStatus TEXT);
    CREATE TABLE stripe_webhook_events (eventId TEXT PRIMARY KEY, userId TEXT, eventType TEXT, outcome TEXT, eventCreatedAt TEXT);
    CREATE TABLE referral_codes (id TEXT PRIMARY KEY, ownerUserId TEXT NOT NULL, status TEXT NOT NULL);
    CREATE TABLE referral_touches (id TEXT PRIMARY KEY, codeId TEXT NOT NULL, occurredAt TEXT NOT NULL);
    CREATE TABLE referral_attributions (id TEXT PRIMARY KEY, codeId TEXT NOT NULL, referredUserId TEXT NOT NULL UNIQUE, firstTouchAt TEXT NOT NULL, attributionState TEXT NOT NULL);
    ${migration}
  `)
  return { database, db: d1(database) }
}

function seedReferral(database, { creator = "creator-1", referred = "referred-1", reviewStatus = null } = {}) {
  const firstTouchAt = "2026-09-01T00:00:00.000Z"
  database.prepare("INSERT INTO referral_codes(id,ownerUserId,status) VALUES(?,?,?)").run("code-1", creator, "active")
  database.prepare("INSERT INTO referral_touches(id,codeId,occurredAt) VALUES(?,?,?)").run("touch-1", "code-1", firstTouchAt)
  database.prepare("INSERT INTO referral_attributions(id,codeId,referredUserId,firstTouchAt,attributionState) VALUES(?,?,?,?,?)").run("attr-1", "code-1", referred, firstTouchAt, "pending")
  if (reviewStatus) database.prepare("INSERT INTO referral_reward_reviews(id,attributionId,creatorUserId,referredUserId,status,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?)").run("review-0001", "attr-1", creator, referred, reviewStatus, firstTouchAt, firstTouchAt)
}

function seedActivation(database, userId) {
  const records = {
    customers: [{ id: "customer-1", name: "Test customer" }],
    invoice_documents: [{ id: "invoice-1", type: "invoice", status: "overdue", amount: 100, dueDate: "2026-08-01" }],
    planner: [], messages: [], expenses: [], goals: [],
  }
  for (const [dataType, data] of Object.entries(records)) database.prepare("INSERT INTO workspace_data(userId,dataType,data) VALUES(?,?,?)").run(userId, dataType, JSON.stringify(data))
}

function seedEntitlement(database, userId) {
  database.prepare("INSERT INTO user_plans(userId,plan) VALUES(?,?)").run(userId, "premium")
  database.prepare("INSERT INTO stripe_customers(userId,subscriptionStatus) VALUES(?,?)").run(userId, "active")
  database.prepare("INSERT INTO stripe_webhook_events(eventId,userId,eventType,outcome,eventCreatedAt) VALUES(?,?,?,?,?)").run("evt-1", userId, "invoice.paid", "applied", "2026-09-02T00:00:00.000Z")
}

const request = (path, method = "GET", body) => new Request(`https://example.test${path}`, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined })

assert.match(migration, /CREATE TABLE IF NOT EXISTS referral_reward_reviews/)
assert.match(migration, /UNIQUE\s*\(attributionId\)|attributionId TEXT NOT NULL UNIQUE/)
for (const status of ["pending", "approved", "rejected", "reversed"]) assert.ok(migration.includes(`'${status}'`))
for (const index of ["creatorUserId", "referredUserId", "status", "createdAt"]) assert.match(migration, new RegExp(`INDEX[\\s\\S]+${index}`, "i"))
for (const forbidden of ["payoutAmount", "creditAmount", "stripePaymentId", "customerEmail"]) assert.equal(migration.includes(forbidden), false)

for (const symbol of ["evaluateReferralRewardEligibility", "reconcileReferralRewardForUser", "reviewReferralReward", "reverseApprovedReferralRewards"]) assert.ok(rewards.includes(`export async function ${symbol}`) || rewards.includes(`export function ${symbol}`), `missing ${symbol}`)
for (const route of ["/api/referrals/activation", "/api/referrals/reward-reviews"]) assert.ok(worker.includes(route), `missing ${route}`)
assert.ok(worker.includes("ADMIN_EMAIL"), "review decisions must use the existing owner authorization boundary")
assert.ok(rewards.includes("creatorUserId === reviewerUserId"), "creators must not approve their own reward")
assert.ok(rewards.includes("ON CONFLICT(attributionId) DO NOTHING"), "pending review creation must be idempotent")
assert.ok(rewards.includes("status = 'approved'"), "reversal must be limited to approved reviews")
assert.ok(ledger.includes("reconcileReferralRewardForUser") && ledger.includes("reverseApprovedReferralRewards"), "verified entitlement lifecycle must reconcile and reverse rewards")
assert.ok(core.includes('fetch("/api/referrals/activation"'), "activation acknowledgement missing")

for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) assert.ok(ui.includes(locale), `missing locale ${locale}`)
for (const state of ["pending", "approved", "rejected", "reversed", "entitlementNotVerified", "noAutomaticReward"]) assert.ok(ui.includes(`${state}:`), `missing localized state ${state}`)
assert.ok(analytics.includes('"referral_reward_reviewed"'), "analytics allowlist missing")
for (const forbidden of ["referral_token", "customer_email", "payment_amount", "workspace_id"]) assert.equal(ui.includes(forbidden), false, `private analytics field ${forbidden}`)

for (const forbiddenAction of ["createPayout", "issueCredit", "sendReferralEmail", "executeReward"]) assert.equal((rewards + worker).includes(forbiddenAction), false, `automatic action ${forbiddenAction}`)

const valid = { attribution:{ attributionId:"attr-1",creatorUserId:"creator-1",referredUserId:"referred-1",codeStatus:"active",attributionState:"pending",firstTouchAt:"2026-09-01T00:00:00.000Z",touchCount:1 },activation:{complete:true},entitlement:{verified:true} }
assert.deepEqual(evaluateReferralRewardEligibilitySnapshot(valid),{eligible:true,reason:"eligible"})
for (const [name,change,reason] of [
  ["revoked",{attribution:{...valid.attribution,codeStatus:"revoked"}},"referral-revoked"],
  ["self",{attribution:{...valid.attribution,referredUserId:"creator-1"}},"self-referral"],
  ["malformed",{attribution:{...valid.attribution,firstTouchAt:"",touchCount:0}},"attribution-invalid"],
  ["activation",{activation:{complete:false}},"activation-incomplete"],
  ["entitlement",{entitlement:{verified:false}},"entitlement-not-verified"],
]) {
  const snapshot={...valid,...change}
  assert.deepEqual(evaluateReferralRewardEligibilitySnapshot(snapshot),{eligible:false,reason},name)
}

// Real request-handler authorization checks.
{
  const { db } = rewardDatabase()
  const anonymous = createRequestHandler({ getLoggedInUserFn: async () => null })
  assert.equal((await anonymous.fetch(request("/api/referrals/reward-reviews"), { DB: db }, {})).status, 401)
  const nonOwner = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "other", email: "other@example.test" }) })
  assert.equal((await nonOwner.fetch(request("/api/referrals/reward-reviews/review-0001", "POST", { decision: "approved" }), { DB: db, ADMIN_EMAIL: "owner@example.test" }, {})).status, 403)
}

// A creator cannot approve their own reward, even if that account is configured as the reviewer.
{
  const { database, db } = rewardDatabase()
  seedReferral(database, { creator: "owner-user", reviewStatus: "pending" })
  const creatorOwner = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "owner-user", email: "owner@example.test" }) })
  assert.equal((await creatorOwner.fetch(request("/api/referrals/reward-reviews/review-0001", "POST", { decision: "approved" }), { DB: db, ADMIN_EMAIL: "owner@example.test" }, {})).status, 403)
}

// Activation and payment can arrive in either order, and reconciliation stays idempotent.
for (const order of ["activation-first", "payment-first"]) {
  const { database, db } = rewardDatabase()
  seedReferral(database)
  if (order === "activation-first") {
    seedActivation(database, "referred-1")
    assert.equal((await reconcileReferralRewardForUser(db, "referred-1")).created, false)
    seedEntitlement(database, "referred-1")
  } else {
    seedEntitlement(database, "referred-1")
    assert.equal((await reconcileReferralRewardForUser(db, "referred-1")).created, false)
    seedActivation(database, "referred-1")
  }
  assert.equal((await reconcileReferralRewardForUser(db, "referred-1")).created, true, order)
  assert.equal((await reconcileReferralRewardForUser(db, "referred-1")).created, false, `${order} duplicate`)
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM referral_reward_reviews").get().count, 1)
}

// Reversal affects an approved review exactly once.
{
  const { database, db } = rewardDatabase()
  seedReferral(database, { reviewStatus: "approved" })
  assert.equal((await reverseApprovedReferralRewards(db, "referred-1")).reversed, 1)
  assert.equal((await reverseApprovedReferralRewards(db, "referred-1")).reversed, 0)
  assert.equal(database.prepare("SELECT status FROM referral_reward_reviews WHERE id=?").get("review-0001").status, "reversed")
}

// Creator reads are deliberately limited to aggregate status and touch count.
{
  const { database, db } = rewardDatabase()
  seedReferral(database, { reviewStatus: "pending" })
  const creator = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "creator-1", email: "creator@example.test" }) })
  const response = await creator.fetch(request("/api/referrals/reward-reviews"), { DB: db, ADMIN_EMAIL: "owner@example.test" }, {})
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.deepEqual(Object.keys(payload), ["items"])
  assert.deepEqual(Object.keys(payload.items[0]).sort(), ["status", "touchCount"])
}

// The reward analytics branch must emit exactly the approved three fields.
assert.match(analytics, /const analyticsParams = detail\.event === "referral_reward_reviewed" \? rewardParams :/)
assert.match(analytics, /window\.gtag\("event", detail\.event, analyticsParams\)/)
assert.match(ui, /params:\{outcome:decision,status:decision,methodologyVersion:"referral-reward-review-v1"\}/)

console.log("Referral reward review V1 audit PASS")
