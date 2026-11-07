// Dedicated synthetic staging Worker. Never import from production entrypoints.
import { runStagingScheduledTestCron } from "./staging-scheduled-test-cron-handler.js";
export { StagingTestGuardDurableObject } from "./staging-scheduled-test-guard-do.js";

export default {
  async fetch() {
    return new Response("not-found", { status: 404, headers: { "cache-control": "no-store" } });
  },
  scheduled(event, env, ctx) {
    const work = runStagingScheduledTestCron(event, env).then(result => {
      console.info("HEGEVA_SYNTHETIC_CRON", JSON.stringify(result));
      return result;
    }).catch(() => {
      const result = { status: "blocked", scenarios: [] };
      console.info("HEGEVA_SYNTHETIC_CRON", JSON.stringify(result));
      return result;
    });
    ctx.waitUntil(work);
  },
};
