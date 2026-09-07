const SIXTY_SECONDS = 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const ROUTE_POLICIES = Object.freeze({
  "sign-in/email": { limit: 5, windowMs: SIXTY_SECONDS },
  "sign-up/email": { limit: 3, windowMs: ONE_HOUR },
  "forget-password": { limit: 3, windowMs: ONE_HOUR },
  "request-password-reset": { limit: 3, windowMs: ONE_HOUR },
  "reset-password": { limit: 5, windowMs: ONE_HOUR },
  "sign-out": { limit: 30, windowMs: SIXTY_SECONDS },
});

const DEFAULT_POLICY = Object.freeze({ limit: 60, windowMs: SIXTY_SECONDS });

const PRUNE_EVERY = 256;

export function authRoutePolicy(routeKey) {
  return ROUTE_POLICIES[String(routeKey || "")] || DEFAULT_POLICY;
}

export function clientIpKey(request) {
  const connecting =
    typeof request?.headers?.get === "function"
      ? request.headers.get("cf-connecting-ip")
      : null;
  if (typeof connecting === "string" && connecting.trim()) {
    return connecting.trim().slice(0, 64);
  }
  const forwarded =
    typeof request?.headers?.get === "function"
      ? request.headers.get("x-forwarded-for")
      : null;
  if (typeof forwarded === "string" && forwarded.trim()) {
    const first = forwarded.split(",")[0]?.trim?.() || "";
    if (first) return first.slice(0, 64);
  }
  return "unknown";
}

export function createAuthRateLimiter({ now = Date.now } = {}) {
  const buckets = new Map();
  let callsSincePrune = 0;

  function prune(nowValue) {
    if (buckets.size > 0) {
      for (const [key, bucket] of buckets) {
        const policy = ROUTE_POLICIES[bucket.routeKey] || DEFAULT_POLICY;
        if (nowValue - bucket.windowStart >= policy.windowMs) {
          buckets.delete(key);
        }
      }
    }
  }

  return {
    admit(routeKey, clientKey, atNow) {
      const nowValue =
        typeof atNow === "number" ? atNow : now();
      const policy = authRoutePolicy(routeKey);
      const bucketKey = `${routeKey}|${clientKey || "unknown"}`;
      let bucket = buckets.get(bucketKey);

      if (!bucket || nowValue - bucket.windowStart >= policy.windowMs) {
        bucket = { routeKey, windowStart: nowValue, count: 0 };
        buckets.set(bucketKey, bucket);
      }

      if (bucket.count >= policy.limit) {
        const retryAfterMs = policy.windowMs - (nowValue - bucket.windowStart);
        return {
          allowed: false,
          retryAfterMs: Math.max(1, retryAfterMs),
          retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        };
      }

      bucket.count += 1;
      callsSincePrune += 1;
      if (callsSincePrune >= PRUNE_EVERY) {
        callsSincePrune = 0;
        prune(nowValue);
      }
      return { allowed: true, retryAfterMs: 0, retryAfterSeconds: 0 };
    },
  };
}