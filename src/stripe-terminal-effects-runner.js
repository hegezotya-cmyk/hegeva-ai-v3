import {createStripeTerminalStateChecker} from "./stripe-terminal-effects-state-checker.js";
import {processNextTerminalEffect} from "./stripe-terminal-effects-processor.js";

// Assembly-only draft. This module registers NO Worker scheduled handler.
// Executors MUST be idempotent, and must be independently approved before
// being wired to an actual runtime. The explicit opt-in is for tests only.
export async function runTerminalEffectTestCycle({
  db, paymentMode, secretKey, fetchImpl, now,
  executeIdempotently, enableIsolatedTest = false,
} = {}) {
  if (enableIsolatedTest !== true) return {status:"disabled"};
  if (typeof executeIdempotently !== "function" ||
      typeof fetchImpl !== "function") return {status:"invalid-input"};
  const checkCurrentState=createStripeTerminalStateChecker({
    db,paymentMode,secretKey,fetchImpl,
  });
  return processNextTerminalEffect({
    db,now,checkCurrentState,executeIdempotently,
  });
}
