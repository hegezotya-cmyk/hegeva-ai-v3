import assert from "node:assert/strict";
import test from "node:test";
import { createRequestHandler } from "./index.js";

test("Core API normalizes malformed per-user D1 JSON without cross-user reads", async () => {
  const userId = "synthetic-user";
  const bindingsSeen = [];
  const db = {
    prepare(sql) {
      return {
        async run() { return { success: true, meta: { changes: 0 } }; },
        bind(...params) {
          if (sql.includes("FROM workspace_data")) {
            bindingsSeen.push(params[0]);
            return {
              async first() {
                const type = params[1];
                if (type === "customers") return { data: JSON.stringify({ malformed: true }) };
                if (type === "invoice_documents") return { data: "{" };
                return { data: "[]" };
              },
              async all() { return { results: [] }; },
            };
          }
          return { async first() { return null; }, async all() { return { results: [] }; }, async run() { return { success: true, meta: { changes: 0 } }; } };
        },
      };
    },
  };
  const handler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: userId }) });
  const response = await handler.fetch(
    new Request("https://hegevaai.co.uk/api/core/decide", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }),
    { DB: db },
    {},
  );
  assert.equal(response.status, 200);
  assert.ok(bindingsSeen.length >= 6);
  assert.ok(bindingsSeen.every((id) => id === userId));
});

test("missing session remains 401 and does not read workspace data", async () => {
  let reads = 0;
  const handler = createRequestHandler({
    getLoggedInUserFn: async () => null,
  });
  const response = await handler.fetch(
    new Request("https://hegevaai.co.uk/api/core/decide", { method: "POST", body: "{}" }),
    { DB: { prepare() { reads += 1; throw new Error("should not read"); } } },
    {},
  );
  assert.equal(response.status, 401);
  assert.equal(reads, 0);
});

test("session exceptions are labeled by phase without logging exception contents", async () => {
  const handler = createRequestHandler({
    getLoggedInUserFn: async () => { throw new TypeError("private cookie or token fixture"); },
  });
  const lines = [];
  const original = console.error;
  console.error = (...args) => lines.push(args);
  try {
    const response = await handler.fetch(
      new Request("https://hegevaai.co.uk/api/core/decide", { method: "POST", body: "{}" }),
      { DB: { prepare() { throw new Error("should not access DB"); } } },
      {},
    );
    assert.equal(response.status, 503);
  } finally {
    console.error = original;
  }
  const logText = JSON.stringify(lines);
  assert.match(logText, /core_v1_decide_failed/);
  assert.match(logText, /authentication/);
  assert.match(logText, /TypeError/);
  assert.doesNotMatch(logText, /private cookie or token fixture/);
});
