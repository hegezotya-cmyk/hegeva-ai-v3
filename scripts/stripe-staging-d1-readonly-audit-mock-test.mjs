// No Cloudflare or Stripe access: fake the Wrangler subprocess in a temp directory.
// Validate --execute JSON parsing, fixed SELECT-only queries, and redacted output.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'hegeva-d1-audit-mock-'));
try {
  const mock=join(dir,'npx');
  const script=join(dir,'mock-wrangler.mjs');
  writeFileSync(mock,'#!/bin/sh\nexec node "'+script+'" "$@"\n');
  chmodSync(mock,0o755);
  writeFileSync(script,`const args=process.argv.slice(2);
const fail=msg=>{console.error(msg);process.exit(12);};
if(args.slice(0,4).join(' ')!=='wrangler d1 execute hegeva-ai-staging-db') fail('Incorrect staging DB command');
for(const flag of ['--remote','--config','--json','--command']) if(!args.includes(flag)) fail('Missing '+flag);
if(args[args.indexOf('--config')+1]!=='wrangler.staging.jsonc') fail('Incorrect config');
const sql=args[args.indexOf('--command')+1];
if(!sql.startsWith('SELECT ') || /\\b(UPDATE|INSERT|DELETE|DROP|CREATE|ALTER|REPLACE|PRAGMA)\\b/i.test(sql)) fail('Unsafe SQL');
if(process.env.MOCK_WRANGLER_FAIL==='1') { console.error('secret customer cus_private_fixture token fixture-read-only-token'); process.exit(12); }
if(process.env.MOCK_WRANGLER_BAD_JSON==='1') { console.log('secret customer cus_private_fixture garbage JSON'); process.exit(0); }
if(process.env.MOCK_WRANGLER_EMPTY==='1') { console.log('[]'); process.exit(0); }
if(process.env.MOCK_WRANGLER_MISSING_RESULTS==='1') { console.log(JSON.stringify([{success:true}])); process.exit(0); }
if(process.env.MOCK_WRANGLER_FAILED==='1') { console.log(JSON.stringify([{success:false,results:[]}])); process.exit(0); }
let results;
if(sql.includes('FROM stripe_customers')) results=[{userId:'private-test-uid',stripeCustomerId:'cus_private_fixture',stripeSubscriptionId:'sub_private_fixture',subscriptionStatus:'active',updatedAt:'2026-11-04T00:00:00Z'}];
else if(sql.includes('FROM user_plans')) results=[{userId:'private-test-uid',plan:'premium'}];
else if(sql.includes('FROM stripe_webhook_events')) results=[{userId:'private-test-uid',eventType:'checkout.session.completed',outcome:'applied'}];
else fail('Unexpected SQL');
console.log(JSON.stringify([{results,success:true}]));
`);
  const file=fileURLToPath(new URL('./stripe-staging-d1-readonly-audit.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[file,'--execute'],{encoding:'utf8',env:{
    ...process.env,PATH:dir+':'+process.env.PATH,CLOUDFLARE_API_TOKEN:'fixture-read-only-token',CLOUDFLARE_ACCOUNT_ID:'fixture-account'
  }});
  assert.equal(result.status,0,'mocked read-only execute should succeed: '+result.stderr);
  const data=JSON.parse(result.stdout);
  assert.equal(data.environment,'staging-only');
  assert.equal(data.mode,'read-only');
  assert.equal(data.counts.identityRows,1);
  assert.equal(data.counts.planRows,1);
  assert.equal(data.counts.webhookEventRows,1);
  assert.equal(data.users.length,1);
  assert.equal(data.users[0].plan,'premium');
  assert.equal(data.users[0].appliedWebhookCount,1);
  for (const raw of ['private-test-uid','cus_private_fixture','sub_private_fixture','fixture-read-only-token']) {
    assert(!result.stdout.includes(raw),'No raw IDs or token may appear');
  }
  const withoutToken=spawnSync(process.execPath,[file,'--execute'],{encoding:'utf8',env:{
    ...process.env,PATH:dir+':'+process.env.PATH,CLOUDFLARE_API_TOKEN:'',CLOUDFLARE_ACCOUNT_ID:''
  }});
  assert.notEqual(withoutToken.status,0,'--execute must fail without scoped credentials');
  const denied=spawnSync(process.execPath,[file,'--execute'],{encoding:'utf8',env:{
    ...process.env,PATH:dir+':'+process.env.PATH,CLOUDFLARE_API_TOKEN:'fixture-read-only-token',
    CLOUDFLARE_ACCOUNT_ID:'fixture-account',MOCK_WRANGLER_FAIL:'1'
  }});
  assert.notEqual(denied.status,0,'failed D1 query must fail closed');
  const badJson=spawnSync(process.execPath,[file,'--execute'],{encoding:'utf8',env:{
    ...process.env,PATH:dir+':'+process.env.PATH,CLOUDFLARE_API_TOKEN:'fixture-read-only-token',
    CLOUDFLARE_ACCOUNT_ID:'fixture-account',MOCK_WRANGLER_BAD_JSON:'1'
  }});
  assert.notEqual(badJson.status,0,'unexpected D1 JSON must fail closed');
  const malformedEnvelopes=['MOCK_WRANGLER_EMPTY','MOCK_WRANGLER_MISSING_RESULTS','MOCK_WRANGLER_FAILED'].map(flag => {
    const attempt=spawnSync(process.execPath,[file,'--execute'],{encoding:'utf8',env:{
      ...process.env,PATH:dir+':'+process.env.PATH,CLOUDFLARE_API_TOKEN:'fixture-read-only-token',
      CLOUDFLARE_ACCOUNT_ID:'fixture-account',[flag]:'1'
    }});
    assert.notEqual(attempt.status,0,flag+' must fail closed');
    return attempt;
  });
  for (const attempt of [withoutToken,denied,badJson,...malformedEnvelopes]) {
    const visible=attempt.stdout+'\n'+attempt.stderr;
    for (const raw of ['private-test-uid','cus_private_fixture','sub_private_fixture','fixture-read-only-token']) {
      assert(!visible.includes(raw),'Failed checks must not leak fixture credentials or IDs');
    }
  }
  console.log('Mocked Wrangler staging D1 audit PASS');
} finally {rmSync(dir,{force:true,recursive:true});}
