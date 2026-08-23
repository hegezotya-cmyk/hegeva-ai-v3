import hegevaWorker from "./index.js";

function isStripeWebhookSecret(value) {
  return typeof value === "string" && value.startsWith("whsec_");
}

function hexToBytes(hex) {
  if (
    typeof hex !== "string" ||
    hex.length % 2 !== 0 ||
    !/^[0-9a-f]+$/i.test(hex)
  ) {
    return null;
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqualBytes(a, b) {
  if (
    !(a instanceof Uint8Array) ||
    !(b instanceof Uint8Array) ||
    a.length !== b.length
  ) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function parseStripeSignatureHeader(header) {
  const result = { timestamp: null, v1: [] };
  if (typeof header !== "string") return result;

  for (const part of header.split(",")) {
    const [key, value] = part.trim().split("=");
    if (key === "t" && /^\d+$/.test(value || "")) {
      result.timestamp = Number(value);
    }
    if (key === "v1" && value) {
      result.v1.push(value);
    }
  }
  return result;
}

async function verifyStripeWebhookSignature(
  rawBodyBytes,
  signatureHeader,
  webhookSecret,
  toleranceSeconds = 300,
) {
  if (
    !(rawBodyBytes instanceof Uint8Array) ||
    !isStripeWebhookSecret(webhookSecret)
  ) {
    return false;
  }

  const parsed = parseStripeSignatureHeader(signatureHeader);
  if (!Number.isFinite(parsed.timestamp) || parsed.v1.length === 0) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - parsed.timestamp) > toleranceSeconds) {
    return false;
  }

  const encoder = new TextEncoder();
  const prefixBytes = encoder.encode(`${parsed.timestamp}.`);
  const signedPayload = new Uint8Array(prefixBytes.length + rawBodyBytes.length);
  signedPayload.set(prefixBytes, 0);
  signedPayload.set(rawBodyBytes, prefixBytes.length);

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, signedPayload),
  );

  for (const candidateHex of parsed.v1) {
    const candidateBytes = hexToBytes(candidateHex);
    if (candidateBytes && timingSafeEqualBytes(signature, candidateBytes)) {
      return true;
    }
  }

  return false;
}

function stripeEventTimeIso(event) {
  const seconds = Number(event?.created);
  if (Number.isFinite(seconds) && seconds > 0) {
    return new Date(seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

function extractMetadata(eventType, object) {
  if (!object || typeof object !== "object") return {};

  if (
    eventType === "checkout.session.completed" ||
    eventType === "customer.subscription.updated" ||
    eventType === "customer.subscription.deleted"
  ) {
    return object.metadata || {};
  }

  if (
    eventType === "invoice.paid" ||
    eventType === "invoice.payment_failed"
  ) {
    return (
      object.parent?.subscription_details?.metadata ||
      object.subscription_details?.metadata ||
      {}
    );
  }

  return {};
}

async function claimStripeEvent(env, event) {
  const eventId = typeof event?.id === "string" ? event.id.trim() : "";
  const eventType = typeof event?.type === "string" ? event.type.trim() : "";

  if (!eventId || !eventType) {
    return { claimed: false, invalid: true };
  }

  const object = event.data?.object;
  const metadata = extractMetadata(eventType, object);
  const userId =
    typeof metadata?.userId === "string" ? metadata.userId.trim() : null;
  const plan =
    typeof metadata?.hegevaPlan === "string"
      ? metadata.hegevaPlan.trim().toLowerCase()
      : null;
  const eventCreatedAt = stripeEventTimeIso(event);

  const result = await env.DB
    .prepare(`
      INSERT INTO stripe_webhook_events (
        eventId,
        eventType,
        userId,
        plan,
        eventCreatedAt,
        processedAt,
        outcome
      )
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'ignored')
      ON CONFLICT(eventId) DO NOTHING
    `)
    .bind(
      eventId,
      eventType,
      userId,
      plan,
      eventCreatedAt,
      new Date().toISOString(),
    )
    .run();

  const changes = Number(result?.meta?.changes || 0);
  return {
    claimed: changes > 0,
    invalid: false,
    eventId,
    eventType,
    userId,
    plan,
    eventCreatedAt,
  };
}

async function hasNewerAppliedStripeEvent(env, claim) {
  if (!claim?.userId || !claim?.eventCreatedAt) return false;

  const row = await env.DB
    .prepare(`
      SELECT eventId
      FROM stripe_webhook_events
      WHERE userId = ?1
        AND outcome = 'applied'
        AND eventCreatedAt > ?2
      ORDER BY eventCreatedAt DESC
      LIMIT 1
    `)
    .bind(claim.userId, claim.eventCreatedAt)
    .first();

  return Boolean(row?.eventId);
}

async function finalizeStripeEvent(env, eventId, responseData) {
  const outcome =
    responseData?.entitlementChanged === true && responseData?.ignored !== true
      ? "applied"
      : "ignored";

  await env.DB
    .prepare(`
      UPDATE stripe_webhook_events
      SET outcome = ?1,
          processedAt = ?2
      WHERE eventId = ?3
    `)
    .bind(outcome, new Date().toISOString(), eventId)
    .run();
}

async function releaseStripeEvent(env, eventId) {
  await env.DB
    .prepare(`DELETE FROM stripe_webhook_events WHERE eventId = ?1`)
    .bind(eventId)
    .run();
}

async function downgradeTerminalSubscription(env, event, claim) {
  if (
    claim?.eventType !== "customer.subscription.updated" ||
    !claim?.userId
  ) {
    return null;
  }

  const status = String(event?.data?.object?.status || "").toLowerCase();
  const terminal = ["canceled", "unpaid", "incomplete_expired"].includes(status);

  // cancel_at_period_end is intentionally not terminal. The subscriber keeps
  // access until Stripe actually ends the subscription.
  if (!terminal) return null;

  const result = await env.DB
    .prepare(`
      INSERT INTO user_plans (
        userId,
        plan,
        createdAt,
        updatedAt
      )
      VALUES (?1, 'basic', ?2, ?2)
      ON CONFLICT(userId)
      DO UPDATE SET
        plan = 'basic',
        updatedAt = excluded.updatedAt
      WHERE user_plans.updatedAt IS NULL
         OR user_plans.updatedAt <= excluded.updatedAt
    `)
    .bind(claim.userId, claim.eventCreatedAt)
    .run();

  const changed = Number(result?.meta?.changes || 0) > 0;

  return {
    received: true,
    verified: true,
    eventId: claim.eventId,
    eventType: claim.eventType,
    ignored: !changed,
    entitlementChanged: changed,
    resultingPlan: changed ? "basic" : null,
    userMapped: true,
    subscriptionStatus: status,
  };
}

async function handleStripeWebhook(request, env, ctx) {
  const webhookSecret =
    typeof env.STRIPE_WEBHOOK_SECRET === "string"
      ? env.STRIPE_WEBHOOK_SECRET.trim()
      : "";

  if (!isStripeWebhookSecret(webhookSecret)) {
    return hegevaWorker.fetch(request, env, ctx);
  }

  const signatureHeader = request.headers.get("Stripe-Signature");
  if (!signatureHeader) {
    return hegevaWorker.fetch(request, env, ctx);
  }

  let rawBytes;
  let event;

  try {
    rawBytes = new Uint8Array(await request.arrayBuffer());
    const signatureValid = await verifyStripeWebhookSignature(
      rawBytes,
      signatureHeader,
      webhookSecret,
    );

    if (!signatureValid) {
      return Response.json(
        { error: "Invalid Stripe webhook signature." },
        { status: 400 },
      );
    }

    event = JSON.parse(new TextDecoder().decode(rawBytes));
  } catch {
    return Response.json(
      { error: "Invalid Stripe webhook request." },
      { status: 400 },
    );
  }

  let claim;
  try {
    claim = await claimStripeEvent(env, event);
  } catch (error) {
    console.error("HEGEVA Stripe event ledger claim error:", error);
    return Response.json(
      { error: "Stripe webhook event ledger unavailable." },
      { status: 500 },
    );
  }

  if (claim.invalid) {
    const delegatedRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: rawBytes,
    });
    return hegevaWorker.fetch(delegatedRequest, env, ctx);
  }

  if (!claim.claimed) {
    return Response.json({
      received: true,
      verified: true,
      duplicate: true,
      eventId: claim.eventId,
      eventType: claim.eventType,
      entitlementChanged: false,
      ignored: true,
    });
  }

  try {
    if (await hasNewerAppliedStripeEvent(env, claim)) {
      const responseData = {
        received: true,
        verified: true,
        stale: true,
        eventId: claim.eventId,
        eventType: claim.eventType,
        entitlementChanged: false,
        ignored: true,
      };
      await finalizeStripeEvent(env, claim.eventId, responseData);
      return Response.json(responseData);
    }

    const terminalSubscriptionResult =
      await downgradeTerminalSubscription(env, event, claim);

    if (terminalSubscriptionResult) {
      await finalizeStripeEvent(env, claim.eventId, terminalSubscriptionResult);
      return Response.json(terminalSubscriptionResult);
    }
  } catch (error) {
    console.error("HEGEVA Stripe stale/cancellation guard error:", error);
    try {
      await releaseStripeEvent(env, claim.eventId);
    } catch {}
    return Response.json(
      { error: "Stripe webhook guard failed." },
      { status: 500 },
    );
  }

  const delegatedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: rawBytes,
  });

  const response = await hegevaWorker.fetch(delegatedRequest, env, ctx);
  const responseCopy = response.clone();

  if (!response.ok) {
    try {
      await releaseStripeEvent(env, claim.eventId);
    } catch (error) {
      console.error("HEGEVA Stripe event ledger release error:", error);
    }
    return response;
  }

  try {
    const responseData = await responseCopy.json().catch(() => null);
    await finalizeStripeEvent(env, claim.eventId, responseData);
  } catch (error) {
    console.error("HEGEVA Stripe event ledger finalize error:", error);
  }

  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (
      url.pathname === "/api/billing/webhook" &&
      request.method === "POST"
    ) {
      return handleStripeWebhook(request, env, ctx);
    }

    if (
      url.pathname === "/api/billing/confirm" &&
      request.method === "POST"
    ) {
      return Response.json(
        {
          error: "Checkout confirmation no longer grants paid entitlement. Stripe webhooks are the source of truth.",
          code: "webhook_entitlement_required",
        },
        { status: 410 },
      );
    }

    return hegevaWorker.fetch(request, env, ctx);
  },
};
