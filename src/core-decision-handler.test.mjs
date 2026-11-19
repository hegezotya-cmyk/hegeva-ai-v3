import assert from "node:assert/strict";
import test from "node:test";
import { createRequestHandler, emitMonitor } from "./index.js";

test("monitor routes successful, warning, and failure outcomes to appropriate log levels", () => {
  const calls = { info: [], warn: [], error: [] };
  const original = { info: console.info, warn: console.warn, error: console.error };
  console.info = (...args) => calls.info.push(args);
  console.warn = (...args) => calls.warn.push(args);
  console.error = (...args) => calls.error.push(args);
  try {
    emitMonitor("core_v1", "decision_completed", { actionCount: 3 });
    emitMonitor("auth", "rate_limited");
    emitMonitor("core_v1", "handler_failed");
  } finally {
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
  }

  assert.equal(calls.info.length, 1);
  assert.equal(calls.info[0][0], "HEGEVA_MONITOR");
  assert.equal(calls.info[0][1].outcome, "decision_completed");
  assert.equal(calls.info[0][1].actionCount, 3);
  assert.equal(calls.warn.length, 1);
  assert.equal(calls.warn[0][1].outcome, "rate_limited");
  assert.equal(calls.error.length, 1);
  assert.equal(calls.error[0][1].outcome, "handler_failed");
});

import { reserveAssistantCostGuard } from "./assistant-cost-guard.js";


test("Assistant cost guard synchronizes an existing monthly bucket with the configured cap", async () => {
  let batchStatements = [];
  const db = {
    prepare(sql) {
      return {
        bind(...params) {
          return { sql, params };
        },
      };
    },
    async batch(statements) {
      batchStatements = statements;
      return [];
    },
  };
  const env = {
    DB: db,
    AI_GLOBAL_INCLUDED_BUDGET_UNITS: "260",
    AI_GLOBAL_PREPAID_BUDGET_UNITS: "260",
    AI_GLOBAL_EMERGENCY_CAP_UNITS: "260",
    AI_GLOBAL_REQUEST_RESERVATION_UNITS: "26",
  };
  const result = await reserveAssistantCostGuard(env, {
    operationId: "11111111-1111-4111-8111-111111111111",
    period: "2026-11",
    fundingClass: "included",
    now: new Date("2026-11-16T03:00:00.000Z"),
  });

  assert.equal(result.reserved, true);
  const buckets = batchStatements.slice(0, 2);
  assert.equal(buckets.length, 2);
  for (const statement of buckets) {
    assert.match(statement.sql, /ON CONFLICT\(period,budgetClass\) DO UPDATE SET/i);
    assert.match(statement.sql, /limitUnits\s*=\s*excluded\.limitUnits/i);
  }
  assert.deepEqual(buckets.map((statement) => statement.params[2]), [260, 260]);
});

test("Assistant malformed JSON returns its controlled error instead of masking it with an out-of-scope ReferenceError", async () => {
  const handler = createRequestHandler({
    getLoggedInUserFn: async () => ({ id: "synthetic-user" }),
  });
  const logs = [];
  const originalError = console.error;
  console.error = (...args) => logs.push(args);
  try {
    const response = await handler.fetch(
      new Request("https://hegevaai.co.uk/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
      {},
      {},
    );
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      error: "HEGEVA AI is temporarily unavailable.",
    });
  } finally {
    console.error = originalError;
  }
  const logged = JSON.stringify(logs);
  assert.match(logged, /ai_chat_handler_failed/);
  assert.match(logged, /SyntaxError/);
  assert.match(logged, /"phase":"request_json"/);
  assert.doesNotMatch(logged, /isX20Action is not defined/);
});

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


test("Core API keeps D1 goals isolated by authenticated identity", async () => {
  const boundUserIds = [];
  const goalFor = (id, target) => ({
    data: JSON.stringify([{
      id: `synthetic-goal-${id}`,
      createdAt: "2026-11-01T12:00:00.000Z",
      plan: { kind: "local-customers", baseline: 0, target, deadline: "2026-12-31" },
    }]),
  });
  const rows = new Map([
    ["user-a", goalFor("a", 10)],
    ["user-b", goalFor("b", 25)],
  ]);
  const db = {
    prepare(sql) {
      return {
        bind(...params) {
          if (sql.includes("FROM workspace_data")) {
            boundUserIds.push(params[0]);
            return {
              async first() {
                if (params[1] === "goal_mode") return null; // No canonical record: exercise legacy fallback.
                if (params[1] === "goals" || sql.includes("dataType = 'goals'")) {
                  return rows.get(params[0]) ?? null;
                }
                return { data: "[]" };
              },
            };
          }
          return { async first() { return null; }, async all() { return { results: [] }; } };
        },
      };
    },
  };
  const getCore = async (userId) => {
    const handler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: userId }) });
    const response = await handler.fetch(
      new Request("https://hegevaai.co.uk/api/core/decide", { method: "POST", body: "{}" }),
      { DB: db },
      {},
    );
    assert.equal(response.status, 200);
    return response.json();
  };
  const ownerA = await getCore("user-a");
  assert.equal(ownerA.goalMode?.plan?.target, 10);
  assert.equal(ownerA.goalMode?.plan?.kind, "local-customers");
  assert.ok(boundUserIds.length >= 7);
  assert.ok(boundUserIds.every((id) => id === "user-a"));
  boundUserIds.length = 0;
  const ownerB = await getCore("user-b");
  assert.equal(ownerB.goalMode?.plan?.target, 25);
  assert.ok(boundUserIds.every((id) => id === "user-b"));
  assert.notDeepEqual(ownerA.goalMode?.plan, ownerB.goalMode?.plan);
});


test("Core reads canonical goal_mode and never resurrects old goals after clearing them", async () => {
  const reads = [];
  const goalRow = (target) => ({
    data: JSON.stringify([{
      id: `goal-${target}`,
      goal: "Gain local customers",
      steps: ["Prepare campaign"],
      state: "approved",
      createdAt: "2026-11-01T12:00:00.000Z",
      plan: {
        kind: "local-customers", metric: "active-customer-count",
        baseline: 0, target, deadline: "2026-12-31",
        evidence: { customers: 0, leads: 0, unpaidInvoices: 0, unpaidValue: 0, overdueTasks: 0, currency: "GBP" },
        stepKeys: ["defineLocalAudience"],
      },
    }]),
  });
  const records = new Map([
    ["owner-a:goal_mode", goalRow(9)],
    ["owner-a:goals", goalRow(99)],
    ["owner-b:goal_mode", { data: "[]" }],
    ["owner-b:goals", goalRow(99)],
    ["owner-c:goal_mode", { data: "{malformed" }],
    ["owner-c:goals", goalRow(99)],
    ["owner-d:goals", goalRow(99)],
  ]);
  const db = {
    prepare(sql) {
      return {
        bind(...params) {
          if (sql.includes("FROM workspace_data")) {
            reads.push({ userId: params[0], dataType: params[1] });
            return { async first() { if (params[0] === "owner-d" && params[1] === "goal_mode") throw new Error("synthetic canonical read unavailable"); return records.get(`${params[0]}:${params[1]}`) ?? (["goal_mode", "goals"].includes(params[1]) ? null : { data: "[]" }); } };
          }
          return { async first() { return null; }, async all() { return { results: [] }; } };
        },
      };
    },
  };
  const getDecision = async (userId) => {
    const handler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: userId }) });
    const response = await handler.fetch(
      new Request("https://hegevaai.co.uk/api/core/decide", { method: "POST", body: "{}" }),
      { DB: db }, {},
    );
    assert.equal(response.status, 200);
    return response.json();
  };
  const a = await getDecision("owner-a");
  assert.equal(a.goalMode?.plan?.target, 9);
  assert.ok(reads.every((r) => r.userId === "owner-a"));
  assert.ok(!reads.some((r) => r.dataType === "goals"), "legacy goals should be skipped if canonical exists");
  reads.length = 0;
  const b = await getDecision("owner-b");
  assert.equal(b.goalMode, null, "explicitly empty canonical collection must not resurrect legacy data");
  assert.ok(reads.every((r) => r.userId === "owner-b"));
  assert.ok(!reads.some((r) => r.dataType === "goals"));
  reads.length = 0;
  const c = await getDecision("owner-c");
  assert.equal(c.goalMode, null, "malformed canonical JSON must not reveal an old legacy goal");
  assert.ok(!reads.some((r) => r.dataType === "goals"));
  reads.length = 0;
  const d = await getDecision("owner-d");
  assert.equal(d.goalMode, null, "canonical read failure must not resurrect legacy goal");
  assert.ok(!reads.some((r) => r.dataType === "goals"));
});
