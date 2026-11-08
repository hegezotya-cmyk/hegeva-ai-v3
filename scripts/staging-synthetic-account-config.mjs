import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/i;
const D1_ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const EXPECTED_WORKER = "hegeva-ai-v3-staging-scheduled-test";
const EXPECTED_DATABASE = "hegeva-ai-v3-staging-scheduled-test-db";

function requireAccountId(value, name) {
  if (typeof value !== "string" || !ACCOUNT_ID_PATTERN.test(value)) {
    throw new Error(`${name} must be a valid 32-character account ID`);
  }
}

function requireD1Id(value) {
  if (typeof value !== "string" || !D1_ID_PATTERN.test(value)) {
    throw new Error("synthetic D1 target must be a valid D1 database UUID");
  }
}

function firstD1Id(config, name) {
  const id = config?.d1_databases?.[0]?.database_id;
  requireD1Id(id);
  return id.toLowerCase();
}

export function materializeIsolatedSyntheticConfig({
  templateConfig,
  productionConfig,
  stagingConfig,
  productionAccountId,
  stagingAccountId,
  syntheticAccountId,
  syntheticD1Id,
}) {
  requireAccountId(productionAccountId, "production account ID");
  requireAccountId(stagingAccountId, "staging account ID");
  requireAccountId(syntheticAccountId, "synthetic account ID");
  requireD1Id(syntheticD1Id);

  const syntheticAccount = syntheticAccountId.toLowerCase();
  if (syntheticAccount === productionAccountId.toLowerCase() ||
      syntheticAccount === stagingAccountId.toLowerCase()) {
    throw new Error("synthetic account must differ from production and staging");
  }

  if (templateConfig?.name !== EXPECTED_WORKER ||
      templateConfig?.workers_dev !== false ||
      templateConfig?.vars?.PAYMENT_MODE !== "test" ||
      templateConfig?.vars?.STAGING_SCHEDULED_TEST_ENABLED !== "false" ||
      templateConfig?.d1_databases?.length !== 1 ||
      templateConfig.d1_databases[0]?.binding !== "SYNTHETIC_TEST_DB" ||
      templateConfig.d1_databases[0]?.database_name !== EXPECTED_DATABASE ||
      templateConfig?.durable_objects?.bindings?.length !== 1 ||
      templateConfig.durable_objects.bindings[0]?.name !== "GUARD" ||
      templateConfig?.services?.length) {
    throw new Error("synthetic Worker template is not the expected isolated TEST-only configuration");
  }

  const protectedDatabaseIds = new Set([
    firstD1Id(productionConfig, "production"),
    firstD1Id(stagingConfig, "staging"),
    firstD1Id(templateConfig, "existing synthetic"),
  ]);
  if (protectedDatabaseIds.has(syntheticD1Id.toLowerCase())) {
    throw new Error("synthetic D1 target must be a new isolated D1 database");
  }

  const output = JSON.parse(JSON.stringify(templateConfig));
  output.d1_databases[0].database_id = syntheticD1Id;
  return output;
}

async function main() {
  const [templateText, productionText, stagingText] = await Promise.all([
    readFile("wrangler.staging-scheduled-test.jsonc", "utf8"),
    readFile("wrangler.jsonc", "utf8"),
    readFile("wrangler.staging.jsonc", "utf8"),
  ]);
  const config = materializeIsolatedSyntheticConfig({
    templateConfig: JSON.parse(templateText),
    productionConfig: JSON.parse(productionText),
    stagingConfig: JSON.parse(stagingText),
    productionAccountId: process.env.CLOUDFLARE_PRODUCTION_ACCOUNT_ID,
    stagingAccountId: process.env.CLOUDFLARE_STAGING_ACCOUNT_ID,
    syntheticAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    syntheticD1Id: process.env.STAGING_SCHEDULED_TEST_D1_ID,
  });
  await writeFile("wrangler.staging-scheduled-test.generated.jsonc", `${JSON.stringify(config, null, 2)}\n`);
  console.log("PASS: generated synthetic Worker config targets a separate account and a new D1 database; PAYMENT_MODE=test and controls default off.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
