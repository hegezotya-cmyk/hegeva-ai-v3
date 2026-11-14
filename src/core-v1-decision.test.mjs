import assert from "node:assert/strict";
import test from "node:test";
import { runCoreV1Decision } from "./core-v1-decision.js";

const emptyWorkspace = {
  customers: [],
  invoices: [],
  tasks: [],
  messages: [],
  documents: [],
  expenses: [],
};

test("missing workspace and empty D1 results produce an empty Core decision", () => {
  assert.doesNotThrow(() => runCoreV1Decision(undefined, true));
  assert.doesNotThrow(() => runCoreV1Decision({}, true));
  assert.doesNotThrow(() => runCoreV1Decision(emptyWorkspace, true));
});

test("invalid JSON fallback to empty arrays is safe", () => {
  let parsed = [];
  try { parsed = JSON.parse("{invalid"); } catch { parsed = []; }
  assert.doesNotThrow(() => runCoreV1Decision({ ...emptyWorkspace, customers: parsed }, true));
});

test("valid JSON with non-array collections is ignored safely", () => {
  const malformed = JSON.parse('{"customers":{"unexpected":"object"},"invoices":"not-an-array"}');
  const result = runCoreV1Decision({ ...emptyWorkspace, ...malformed }, true);
  assert.equal(result.coreSignals._context.customers, 0);
});

test("null, primitive and malformed nested records cannot crash Core", () => {
  const result = runCoreV1Decision({
    ...emptyWorkspace,
    customers: [null, 4, "bad", { customerStatus: "lead" }],
    invoices: [{ type: "invoice", items: { bad: true } }, { type: "invoice", items: [null, 4] }],
    messages: [{ sourceId: "fixture", content: { bad: true }, workflowStatus: "draft" }],
    businessKnowledge: { items: { bad: true } },
  }, true);
  assert.equal(result.coreSignals._context.customers, 1);
  assert.ok(result.coreDecision);
});
