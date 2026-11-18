const SAFE_ERROR_TYPES = new Set([
  "Error",
  "TypeError",
  "ReferenceError",
  "SyntaxError",
  "RangeError",
  "URIError",
  "EvalError",
  "AggregateError",
]);

function safeStacktrace(stacktrace) {
  if (!stacktrace || !Array.isArray(stacktrace.frames)) return undefined;
  return {
    frames: stacktrace.frames.map((frame) => {
      const safe = {};
      if (typeof frame?.filename === "string") {
        safe.filename = frame.filename.split(/[?#]/, 1)[0].slice(0, 240);
      }
      for (const key of ["lineno", "colno", "in_app"]) {
        if (frame?.[key] !== undefined) safe[key] = frame[key];
      }
      return safe;
    }),
  };
}

export function scrubSentryEvent(event) {
  if (!event || !Array.isArray(event.exception?.values)) return null;
  const values = event.exception.values
    .filter((value) => typeof value?.type === "string")
    .map((value) => ({
      type: SAFE_ERROR_TYPES.has(value.type) ? value.type : "Error",
      ...(safeStacktrace(value.stacktrace)
        ? { stacktrace: safeStacktrace(value.stacktrace) }
        : {}),
    }));
  if (values.length === 0) return null;

  return {
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: "javascript",
    environment: typeof event.environment === "string" ? event.environment.slice(0, 32) : "staging",
    level: "error",
    exception: { values },
  };
}

export const sentryOptions = (env = {}) => {
  const isStaging = env?.SENTRY_ENVIRONMENT === "staging";
  const hasDsn = typeof env?.SENTRY_DSN === "string" && env.SENTRY_DSN.trim().length > 0;
  const enabled = isStaging && hasDsn;

  return {
    enabled,
    dsn: enabled ? env.SENTRY_DSN.trim() : undefined,
    environment: "staging",
    sendDefaultPii: false,
    maxBreadcrumbs: 0,
    tracesSampleRate: 0,
    profilesSampleRate: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    beforeSend: scrubSentryEvent,
  };
};

export function captureLoggedException(error, capture) {
  if (typeof capture !== "function") return;
  try {
    capture(error);
  } catch {
    // Monitoring must never interfere with request handling.
  }
}
