import test from "node:test";
import assert from "node:assert/strict";
import { materializeIsolatedSyntheticConfig } from "./staging-synthetic-account-config.mjs";

const accountIds = {
  production: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  staging: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  synthetic: "cccccccccccccccccccccccccccccccc",
};
const dbIds = {
  production: "11111111-1111-4111-8111-111111111111",
  staging: "22222222-2222-4222-8222-222222222222",
  existingSynthetic: "33333333-3333-4333-8333-333333333333",
  newSynthetic: "44444444-4444-4444-8444-444444444444",
};
const templateConfig = () => ({
  name: "hegeva-ai-v3-staging-scheduled-test",
  workers_dev: false,
  vars: { PAYMENT_MODE: "test", STAGING_SCHEDULED_TEST_ENABLED: "false" },
  triggers: { crons: ["*/1 * * * *"] },
  d1_databases: [{
    binding: "SYNTHETIC_TEST_DB",
    database_name: "hegeva-ai-v3-staging-scheduled-test-db",
    database_id: dbIds.existingSynthetic,
    migrations_dir: "./migrations/staging-scheduled-test",
  }],
  durable_objects: { bindings: [{ name: "GUARD", class_name: "StagingTestGuardDurableObject" }] },
});
const productionConfig = { d1_databases: [{ database_id: dbIds.production }] };
const stagingConfig = { d1_databases: [{ database_id: dbIds.staging }] };
const validArgs = () => ({
  templateConfig: templateConfig(),
  productionConfig,
  stagingConfig,
  productionAccountId: accountIds.production,
  stagingAccountId: accountIds.staging,
  syntheticAccountId: accountIds.synthetic,
  syntheticD1Id: dbIds.newSynthetic,
});

test("materializes only a distinct synthetic-account D1 target while preserving fail-closed worker config", () => {
  const original = templateConfig();
  const result = materializeIsolatedSyntheticConfig({ ...validArgs(), templateConfig: original });

  assert.equal(result.d1_databases[0].database_id, dbIds.newSynthetic);
  assert.equal(result.name, "hegeva-ai-v3-staging-scheduled-test");
  assert.equal(result.vars.PAYMENT_MODE, "test");
  assert.equal(result.vars.STAGING_SCHEDULED_TEST_ENABLED, "false");
  assert.equal(result.workers_dev, false);
  assert.deepEqual(original, templateConfig(), "input template is not mutated");
});

test("rejects a synthetic account matching production or staging", () => {
  assert.throws(() => materializeIsolatedSyntheticConfig({ ...validArgs(), syntheticAccountId: accountIds.production }), /must differ from production and staging/);
  assert.throws(() => materializeIsolatedSyntheticConfig({ ...validArgs(), syntheticAccountId: accountIds.staging }), /must differ from production and staging/);
});

test("rejects a synthetic D1 ID matching production, staging, or the old shared-account fixture", () => {
  assert.throws(() => materializeIsolatedSyntheticConfig({ ...validArgs(), syntheticD1Id: dbIds.production }), /must be a new isolated D1 database/);
  assert.throws(() => materializeIsolatedSyntheticConfig({ ...validArgs(), syntheticD1Id: dbIds.staging }), /must be a new isolated D1 database/);
  assert.throws(() => materializeIsolatedSyntheticConfig({ ...validArgs(), syntheticD1Id: dbIds.existingSynthetic }), /must be a new isolated D1 database/);
});

test("rejects malformed account and database identifiers", () => {
  assert.throws(() => materializeIsolatedSyntheticConfig({ ...validArgs(), syntheticAccountId: "not-an-account" }), /valid 32-character account ID/);
  assert.throws(() => materializeIsolatedSyntheticConfig({ ...validArgs(), syntheticD1Id: "not-a-database-id" }), /valid D1 database UUID/);
});

test("removes the scheduled trigger when generating a disabled cleanup config", () => {
  const result = materializeIsolatedSyntheticConfig({ ...validArgs(), cronEnabled: false });
  assert.equal(result.vars.STAGING_SCHEDULED_TEST_ENABLED, "false");
  assert.deepEqual(result.triggers, {});
});

test("requires and preserves the isolated Cron trigger only when explicitly enabled", () => {
  const result = materializeIsolatedSyntheticConfig({ ...validArgs(), cronEnabled: true });
  assert.equal(result.vars.STAGING_SCHEDULED_TEST_ENABLED, "true");
  assert.deepEqual(result.triggers.crons, ["*/1 * * * *"]);
});
