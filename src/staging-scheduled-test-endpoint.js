// Staging-test-only HTTP adapter. Intentionally not imported by Worker entrypoints.
// It exposes no SQL, IDs, callbacks or Stripe operations.
import { STAGING_SCHEDULED_TEST_CONTROL_FLAG, isStagingScheduledTestControlEnabled } from "./staging-scheduled-test-control.js";

const MAX_BODY_BYTES = 512;
const json = (body, status) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

export function createStagingScheduledTestEndpoint({ controller, env = {} } = {}) {
  const enabled = isStagingScheduledTestControlEnabled(env);
  const secretConfigured = typeof env.STAGING_SCHEDULED_TEST_AUTH_SECRET === "string" && env.STAGING_SCHEDULED_TEST_AUTH_SECRET.length >= 32;
  return async request => {
    if (enabled !== true || secretConfigured !== true || typeof controller !== "function") return json({ status: "denied", code: "disabled" }, 404);
    if (request.method !== "POST") return json({ status: "denied", code: "method-not-allowed" }, 405);
    if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") return json({ status: "denied", code: "invalid-content-type" }, 415);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ status: "denied", code: "body-too-large" }, 413);
    const authorization = request.headers.get("authorization") || "";
    if (!authorization.startsWith("Bearer ")) return json({ status: "denied", code: "unauthorized" }, 401);
    let body;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ status: "denied", code: "body-too-large" }, 413);
      body = JSON.parse(raw);
    } catch { return json({ status: "denied", code: "malformed-json" }, 400); }
    const keys = body && typeof body === "object" && !Array.isArray(body) ? Object.keys(body).sort() : [];
    if (keys.join(",") !== "scenario" || typeof body.scenario !== "string") return json({ status: "denied", code: "invalid-request" }, 400);
    const result = await controller({ authorization: authorization.slice(7), scenario: body.scenario });
    return json({ status: result?.status || "blocked", code: result?.code || "scenario-invalid-result", cleanupVerified: result?.cleanupVerified === true }, result?.status === "completed" ? 200 : 409);
  };
}

export { STAGING_SCHEDULED_TEST_CONTROL_FLAG };
