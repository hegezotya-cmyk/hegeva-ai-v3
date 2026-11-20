const WEBHOOK_PATH = "/__hegeva/isolated/stripe-test-webhook";
const MAX_BYTES = 65536;

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== WEBHOOK_PATH) {
      return new Response(null, { status: 404 });
    }
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { Allow: "POST" } });
    }
    if (env.RELAY_ENABLED !== "true") {
      return new Response(null, { status: 503 });
    }
    const signature = request.headers.get("stripe-signature");
    if (!signature || !request.body) return new Response(null, { status: 400 });
    if (Number(request.headers.get("content-length")) > MAX_BYTES) {
      return new Response(null, { status: 413 });
    }

    const reader = request.body.getReader();
    const payload = new Uint8Array(MAX_BYTES);
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (size + value.byteLength > MAX_BYTES) {
          await reader.cancel().catch(() => {});
          return new Response(null, { status: 413 });
        }
        payload.set(value, size);
        size += value.byteLength;
      }
    } catch {
      return new Response(null, { status: 400 });
    } finally {
      reader.releaseLock();
    }

    try {
      const result = await env.ISOLATED_WEBHOOK.fetch(
        new Request("https://isolated-webhook.invalid" + WEBHOOK_PATH, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "stripe-signature": signature,
          },
          body: payload.subarray(0, size),
          redirect: "manual",
        }),
      );
      const status = result.status === 200 ? 200
        : [400, 409, 413, 503].includes(result.status) ? result.status : 502;
      return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
    } catch {
      return new Response(null, { status: 502 });
    }
  },
};
