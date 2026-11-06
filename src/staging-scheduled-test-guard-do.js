// Local/staging-test harness only. Never import from production Worker entrypoints.
import { DurableObject } from "cloudflare:workers";
import { createPersistentStagingTestGuard } from "./staging-scheduled-test-guard.js";

export class StagingTestGuardDurableObject extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.guard = createPersistentStagingTestGuard({
      store: { transaction: callback => ctx.storage.transaction(callback) },
    });
  }
  acquire(input) { return this.guard.acquire(input); }
  release(input) { return this.guard.release(input); }
  clearExpired(input) { return this.guard.clearExpired(input); }
  fencedWrite(input) { return this.guard.fencedWrite(input); }
}
