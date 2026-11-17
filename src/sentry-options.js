const SAFE_STACK_FRAME_KEYS = ["filename", "abs_path", "function", "lineno", "colno", "in_app", "module", "package"];

function safeStacktrace(stacktrace) {
  if (!stacktrace || !Array.isArray(stacktrace.frames)) return undefined;
  return {
    frames: stacktrace.frames.map((frame) => {
      const safe = {};
      for (const key of SAFE_STACK_FRAME_KEYS) {
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
      type: value.type.slice(0, 120),
      ...(safeStacktrace(value.stacktrace)
        ? { stacktrace: safeStacktrace(value.stacktrace) }
        : {}),
      ...(value.mechanism?.type
        ? { mechanism: { type: String(value.mechanism.type).slice(0, 80) } }
        : {}),
    }));
  if (values.length === 0) return null;

  return {
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: "javascript",
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
