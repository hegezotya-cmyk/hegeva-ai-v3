import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/hubspot-isolated-worker.js";
test("isolated HubSpot Worker has no scheduled, queue or tail entrypoint", () => {
  assert.deepEqual(Object.keys(worker), ["fetch"]);
});
test("isolated HubSpot Worker never exposes HTTP endpoints", async () => {
  for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    const response = await worker.fetch(new Request("https://synthetic.invalid/api/hubspot", { method }));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});
