// TEST-ONLY harness for a NEW disposable D1 in a SEPARATE Cloudflare account.
// No production/shared staging Worker import, grant path, cron, referral, or outbox.
// Never deploy until the target D1 identity, test signing secret and rollback
// have been verified. This worker intentionally CANNOT grant entitlements.
import { dispositionForDeletedTestUser } from "./stripe-deleted-user-webhook-disposition.js";

const ACCOUNT = "ab362645fc03b7e63a26fd8e46e631b6";
const DATABASE = "84f4c3b0-c175-4458-bad1-e3f826d6ea96";
const STRIPE_SANDBOX_ACCOUNT = "acct_1U4YkdHH1vUED8ZN";
const TEST_ORIGIN = "https://staging.hegevaai.co.uk";
const PATH = "/__hegeva/isolated/stripe-test-webhook";
const LIMIT = 65536;
const MAX_AGE_SECONDS = 300;
const decoder = new TextEncoder();

function respond(status, body) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

function scopedToDisposableDatabase(env) {
  return env?.HEGEVA_ISOLATED_STRIPE_TEST_ENABLED === "true" &&
    env?.PAYMENT_MODE === "test" &&
    env?.ISOLATED_TEST_ACCOUNT_ID === ACCOUNT &&
    env?.ISOLATED_TEST_D1_ID === DATABASE &&
    // An incorrect or absent Stripe account variable cannot silently widen
    // the accepted signed event scope (top-level event.account is optional).
    env?.STRIPE_TEST_ACCOUNT_ID === STRIPE_SANDBOX_ACCOUNT &&
    env?.DB && typeof env.DB.prepare === "function";
}

async function verifySignature(rawBody, header, secret, nowMs) {
  if (typeof secret !== "string" || !secret.startsWith("whsec_")) {
    throw new Error("test-webhook-secret-unavailable");
  }
  if (!header || typeof header !== "string") return false;
  const fields = header.split(",").map(v => v.trim());
  const stamps = fields.filter(v => /^t=[0-9]+$/.test(v)).map(v => v.slice(2));
  const signatures = fields.filter(v => /^v1=[0-9a-fA-F]{64}$/.test(v)).map(v => v.slice(3));
  if (stamps.length !== 1 || signatures.length === 0) return false;
  const stamp = Number(stamps[0]);
  if (!Number.isSafeInteger(stamp) || !Number.isFinite(nowMs) ||
      Math.abs(Math.floor(nowMs / 1000) - stamp) > MAX_AGE_SECONDS) return false;
  const key = await crypto.subtle.importKey(
    "raw", decoder.encode(secret), { name: "HMAC", hash: "SHA-256" },
    false, ["verify"]);
  const payload = decoder.encode(stamps[0] + "." + rawBody);
  // WebCrypto verify() performs the comparison without leaking matches.
  for (const signature of signatures) {
    const bytes = Uint8Array.from(signature.match(/../g), pair => parseInt(pair, 16));
    if (await crypto.subtle.verify("HMAC", key, bytes, payload)) return true;
  }
  return false;
}

async function assertDisposableBinding(db) {
  const row = await db.prepare(
    "SELECT accountId,databaseId,version FROM hegeva_isolated_webhook_test_identity WHERE singleton=1"
  ).first();
  if (row?.accountId !== ACCOUNT || row?.databaseId !== DATABASE ||
      row?.version !== "v1") throw new Error("isolated-test-db-binding-mismatch");
}

// Exported for offline contract testing. Never uses a Stripe API key.
export async function handleIsolatedStripeWebhook(request, env, nowMs = Date.now()) {
  const url = new URL(request.url);
  if (url.pathname !== PATH) return respond(404, { error: "not-found" });
  if (!scopedToDisposableDatabase(env)) return respond(503, { error: "isolated-test-disabled" });
  if (request.method !== "POST") return respond(405, { error: "method-not-allowed" });
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > LIMIT) return respond(413, { error: "payload-too-large" });
  let raw;
  try {
    raw = await request.text();
    if (decoder.encode(raw).length > LIMIT) return respond(413, { error: "payload-too-large" });
    if (!await verifySignature(raw, request.headers.get("stripe-signature"),
      env.STRIPE_TEST_WEBHOOK_SIGNING_SECRET, nowMs)) {
      return respond(400, { error: "invalid-signature" });
    }
  } catch {
    return respond(503, { error: "signature-verification-unavailable" });
  }
  let event;
  try { event = JSON.parse(raw); }
  catch { return respond(400, { error: "invalid-json" }); }
  if (event?.object !== "event" || event?.livemode !== false ||
      (event.account && event.account !== env.STRIPE_TEST_ACCOUNT_ID)) {
    return respond(400, { error: "invalid-test-event-context" });
  }
  try {
    await assertDisposableBinding(env.DB);
    const disposition = await dispositionForDeletedTestUser({
      db: env.DB, event, paymentMode: "test", publicAppUrl: TEST_ORIGIN,
    });
    // Deliberately no legacy webhook fallthrough and no entitlement changes.
    if (!disposition.handled) {
      return respond(409, { error: "not-a-deleted-user-test-event" });
    }
    return respond(200, {
      received: true, ignored: disposition.ignored,
      duplicate: disposition.duplicate, entitlementChanged: false,
      syntheticTestOnly: true,
    });
  } catch {
    return respond(503, { error: "isolated-test-reconciliation-blocked" });
  }
}

export default {
  async fetch(request, env) {
    return handleIsolatedStripeWebhook(request, env);
  },
};
