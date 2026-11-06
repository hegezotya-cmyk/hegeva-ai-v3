import assert from "node:assert/strict";
import { emitMonitor } from "../src/index.js";

const calls = [];
const original = {
  info: console.info,
  warn: console.warn,
  error: console.error,
};

console.info = (...args) => calls.push({ level: "info", args });
console.warn = (...args) => calls.push({ level: "warn", args });
console.error = (...args) => calls.push({ level: "error", args });

try {
  emitMonitor("core_v1", "decision_completed", {
    actionCount: 3,
    priorityCount: 2,
  });

  assert.deepEqual(calls, [
    {
      level: "info",
      args: [
        "HEGEVA_MONITOR",
        {
          scope: "core_v1",
          outcome: "decision_completed",
          actionCount: 3,
          priorityCount: 2,
        },
      ],
    },
  ]);

  calls.length = 0;
  emitMonitor("stripe_webhook", "signature_invalid");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].level, "error");
  assert.equal(calls[0].args[0], "HEGEVA_MONITOR");
} finally {
  console.info = original.info;
  console.warn = original.warn;
  console.error = original.error;
}

console.log("monitor log severity regression passed");
