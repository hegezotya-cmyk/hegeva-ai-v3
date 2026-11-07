import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {decideTerminalBillingIdentityUpdate,applyTerminalBillingIdentityStatus} from "../src/stripe-terminal-billing-identity.js";
const userId="user_a", customerId="cus_old",subscriptionId="sub_old";
const old={id:subscriptionId,customerId,userId,livemode:false,status:"canceled",plan:"premium"};
const newer={id:"sub_new",customerId:"cus_new",userId,livemode:false,status:"active",plan:"premium"};
const existingCustomer={stripeCustomerId:customerId,stripeSubscriptionId:subscriptionId,subscriptionStatus:"active"};
const params=(rows,overrides={})=>({
 userId,customerId,subscriptionId,livemode:false,currentPlan:"basic",
 inventory:{complete:true,subscriptions:rows},existingCustomer,...overrides
});
assert.equal(decideTerminalBillingIdentityUpdate(params([old,newer],{currentPlan:"premium"})).decision,"retain-identity");
assert.equal(decideTerminalBillingIdentityUpdate(params([old])).decision,"update-status");
assert.equal(decideTerminalBillingIdentityUpdate(params([old],{existingCustomer:{...existingCustomer,stripeCustomerId:"cus_new"}})).decision,"defer");
assert.equal(decideTerminalBillingIdentityUpdate(params([old],{existingCustomer:{...existingCustomer,stripeSubscriptionId:"sub_new"}})).decision,"defer");
assert.equal(decideTerminalBillingIdentityUpdate(params([old],{currentPlan:"premium"})).decision,"defer");
assert.equal(decideTerminalBillingIdentityUpdate(params([old],{inventory:{complete:false,subscriptions:[old]}})).decision,"defer");
assert.equal(decideTerminalBillingIdentityUpdate(params([{...old,userId:"intruder"}])).decision,"defer");
assert.equal(decideTerminalBillingIdentityUpdate(params([{...old,status:"active"}])).decision,"defer");
assert.equal(decideTerminalBillingIdentityUpdate(params([old],{existingCustomer:{...existingCustomer,subscriptionStatus:"canceled"}})).decision,"already-terminal");
const sql=new DatabaseSync(":memory:");
try {
 sql.exec("CREATE TABLE stripe_customers (userId TEXT PRIMARY KEY,stripeCustomerId TEXT,stripeSubscriptionId TEXT,subscriptionStatus TEXT,cancelAtPeriodEnd INTEGER,updatedAt TEXT)");
 sql.prepare("INSERT INTO stripe_customers VALUES ('user_a','cus_new','sub_new','active',0,'old')").run();
 const db={prepare(query){return {bind(...args){return {run:async()=>({meta:{changes:sql.prepare(query).run(...args).changes}})}}}}};
 const stamp="2026-11-05T03:00:00.000Z";
 assert.deepEqual(await applyTerminalBillingIdentityStatus({db,userId,customerId,subscriptionId,status:"canceled",now:stamp}),{ok:true,updated:false});
 assert.equal(sql.prepare("SELECT stripeSubscriptionId FROM stripe_customers").get().stripeSubscriptionId,"sub_new");
 assert.equal(sql.prepare("SELECT subscriptionStatus FROM stripe_customers").get().subscriptionStatus,"active");
 sql.prepare("UPDATE stripe_customers SET stripeCustomerId='cus_old',stripeSubscriptionId='sub_old'").run();
 assert.deepEqual(await applyTerminalBillingIdentityStatus({db,userId,customerId,subscriptionId,status:"canceled",now:stamp}),{ok:true,updated:true});
 assert.deepEqual(await applyTerminalBillingIdentityStatus({db,userId,customerId,subscriptionId,status:"canceled",now:stamp}),{ok:true,updated:false});
 assert.equal(sql.prepare("SELECT stripeSubscriptionId FROM stripe_customers").get().stripeSubscriptionId,"sub_old");
 assert.equal(sql.prepare("SELECT subscriptionStatus FROM stripe_customers").get().subscriptionStatus,"canceled");
 console.log("Billing identity CAS PASS: active other Customer protected, matching terminal status-only update, idempotent retry.");
} finally {sql.close();}
