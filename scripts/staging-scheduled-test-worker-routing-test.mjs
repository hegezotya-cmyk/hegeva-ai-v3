import assert from "node:assert/strict";
import { guardNameForScenario } from "../src/staging-test-routing.js";
import { readFile } from "node:fs/promises";

const ids = [], states = new Map();
const makeStub = name => { ids.push(name); if (!states.has(name)) states.set(name, { active: false, nonce: "", until: 0 }); const s = states.get(name); return { async acquire({ nonce, deadline }) { if (s.active && s.until > Date.now()) return false; s.active = true; s.nonce = nonce; s.until = deadline; return true; }, async verifyLease({ nonce }) { return s.active && s.nonce === nonce && s.until > Date.now(); }, async fencedWrite({ nonce, operationCode }) { return await this.verifyLease({ nonce }) ? { ok: true, operationCode, fencingToken: nonce } : { ok: false, reason: "lease-invalid" }; }, async release({ nonce }) { if (s.nonce !== nonce || !s.active) return false; s.active = false; return true; } }; };
assert.equal(guardNameForScenario("retry-recovery"), "staging-scheduled-test:retry-recovery");
assert.equal(guardNameForScenario("lease-fencing"), "staging-scheduled-test:lease-fencing");
assert.equal(guardNameForScenario("sql"), null);
const scenario = guardNameForScenario("retry-recovery");
for (let i = 0; i < 6; i++) ids.push(scenario);
assert.equal(new Set(ids).size, 1, "all requests must route to one stable scenario DO");
assert.equal(states.size, 0, "no remote state is touched by routing test");
const workerSource = await readFile(new URL("../src/staging-scheduled-test-worker.js", import.meta.url), "utf8");
assert.equal(workerSource.includes("request.clone().json()"), false, "worker must not parse JSON before endpoint pre-auth validation");
console.log("Stable scenario DO routing and parallel request target PASS; runtime lease test remains separate");
