// Read-only, staging-only Stripe entitlement snapshot.
// Default is dry-run. To read staging D1, explicitly pass --execute.
// No SQL writes, no production config, no raw user/customer/subscription IDs printed.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const configPath = new URL('../wrangler.staging.jsonc', import.meta.url);
const config = readFileSync(configPath, 'utf8');
assert.match(config, /"name": "hegeva-ai-v3-staging"/);
assert.match(config, /"database_name": "hegeva-ai-staging-db"/);
assert.match(config, /"PAYMENT_MODE": "test"/);
assert.doesNotMatch(config, /"PAYMENT_MODE": "live"/);
assert.doesNotMatch(config, /"database_name": "hegeva-ai-db"/);
const execute = process.argv.includes('--execute');
const sql = Object.freeze({
  identities: 'SELECT userId, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, updatedAt FROM stripe_customers',
  plans: 'SELECT userId, plan FROM user_plans',
  events: "SELECT userId, eventType, outcome FROM stripe_webhook_events WHERE userId IS NOT NULL",
});
if (!execute) {
  console.log('DRY RUN. Read-only staging D1 audit prepared. Add --execute only with a scoped staging D1 READ token.');
  console.log('Tables: stripe_customers, user_plans, stripe_webhook_events; no customer data queried yet.');
  process.exit(0);
}
assert(process.env.CLOUDFLARE_API_TOKEN, 'A staging-only D1 READ token is required');
assert(process.env.CLOUDFLARE_ACCOUNT_ID, 'CLOUDFLARE_ACCOUNT_ID is required');
const hash = value => createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
function queryReadOnly(query) {
  assert.match(query, /^SELECT /);
  assert.doesNotMatch(query, /\b(INSERT|UPDATE|DELETE|DROP|ALTER|REPLACE|PRAGMA|CREATE)\b/i);
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  let raw;
  try {
    raw = execFileSync(command, [
      'wrangler', 'd1', 'execute', 'hegeva-ai-staging-db',
      '--remote', '--config', 'wrangler.staging.jsonc', '--json', '--command', query,
    ], { cwd: new URL('..', import.meta.url), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    // Never print raw CLI stdout/stderr: they may include identifiers.
    throw new Error('Staging D1 read failed: check scoped READ permission and Wrangler CLI flags.');
  }
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Unexpected Wrangler JSON response; no data printed.'); }
  const blocks = Array.isArray(parsed) ? parsed : [parsed];
  const records = blocks.flatMap(block => Array.isArray(block?.results) ? block.results : []);
  if (!blocks.every(block => block?.success !== false)) throw new Error('Staging D1 reported unsuccessful read.');
  return records;
}
const identities = queryReadOnly(sql.identities);
const plans = queryReadOnly(sql.plans);
const events = queryReadOnly(sql.events);
const byUser = new Map();
const rowFor = id => {
  if (!byUser.has(id)) byUser.set(id, { stripeCustomers: [], stripeSubscriptions: [], status: [], plan: null, applied: 0, ignored: 0 });
  return byUser.get(id);
};
for (const x of identities) {
  const rec = rowFor(x.userId);
  if (x.stripeCustomerId) rec.stripeCustomers.push(x.stripeCustomerId);
  if (x.stripeSubscriptionId) rec.stripeSubscriptions.push(x.stripeSubscriptionId);
  rec.status.push(x.subscriptionStatus || 'missing');
}
for (const x of plans) rowFor(x.userId).plan = x.plan;
for (const x of events) {
  const rec = rowFor(x.userId);
  if (x.outcome === 'applied') rec.applied++;
  if (x.outcome === 'ignored') rec.ignored++;
}
console.log(JSON.stringify({
  environment: 'staging-only', mode: 'read-only', database: 'hegeva-ai-staging-db',
  counts: { identityRows: identities.length, planRows: plans.length, webhookEventRows: events.length },
  users: [...byUser].map(([id, rec]) => ({
    userHash: hash(id), customerCountInD1: rec.stripeCustomers.length,
    subscriptionCountInD1: rec.stripeSubscriptions.length,
    subscriptionStatuses: rec.status, plan: rec.plan,
    appliedWebhookCount: rec.applied, ignoredWebhookCount: rec.ignored,
    // SHA-256 prefixes enable private comparison to sandbox TEST records without revealing IDs.
    customerHashes: rec.stripeCustomers.map(hash),
    subscriptionHashes: rec.stripeSubscriptions.map(hash),
  })).sort((a,b) => a.userHash.localeCompare(b.userHash)),
}, null, 2));
