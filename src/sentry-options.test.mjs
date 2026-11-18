import test from "node:test";
import assert from "node:assert/strict";
import { captureLoggedException, sentryOptions, scrubSentryEvent } from "./sentry-options.js";

test("Sentry is disabled unless staging and a DSN are both configured", () => {
  assert.equal(sentryOptions({ SENTRY_DSN: "https://example.invalid/1" }).enabled, false);
  assert.equal(sentryOptions({ SENTRY_ENVIRONMENT: "production", SENTRY_DSN: "x" }).enabled, false);
  assert.equal(sentryOptions({ SENTRY_ENVIRONMENT: "staging" }).enabled, false);
  assert.equal(sentryOptions({ SENTRY_ENVIRONMENT: "staging", SENTRY_DSN: "x" }).enabled, true);
});

test("Sentry event scrubber drops business, request, identity, and message content", () => {
  const safe = scrubSentryEvent({
    event_id: "abc",
    timestamp: 1,
    message: "customer prompt and email",
    request: { url: "/?token=secret", headers: { authorization: "secret" } },
    user: { email: "person@example.com" },
    extra: { prompt: "private" },
    exception: { values: [{
      type: "TypeError",
      value: "contains customer data",
      stacktrace: { frames: [{ filename: "src/index.js?private=1", lineno: 10, function: "dynamic-user-name", vars: { prompt: "private" } }] },
    }] },
  });
  assert.deepEqual(safe, {
    event_id: "abc",
    timestamp: 1,
    platform: "javascript",
    environment: "staging",
    level: "error",
    exception: { values: [{
      type: "TypeError",
      stacktrace: { frames: [{ filename: "src/index.js", lineno: 10 }] },
    }] },
  });
});

test("unrecognized exception names cannot carry arbitrary text to Sentry", () => {
  const safe = scrubSentryEvent({ exception: { values: [{ type: "private customer name: Alice", value: "secret" }] } });
  assert.equal(safe.exception.values[0].type, "Error");
});

test("logged exceptions are forwarded safely without affecting the handler", () => {
  const failure = new TypeError("sensitive value");
  let captured;
  captureLoggedException(failure, (error) => { captured = error; });
  assert.equal(captured, failure);
  assert.doesNotThrow(() => captureLoggedException(failure, () => { throw new Error("monitoring failure"); }));
});
