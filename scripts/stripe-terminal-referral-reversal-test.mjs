import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { reverseTerminalReferralRewardsAtomically } from "../src/stripe-terminal-referral-reversal.js";

const sqlite=new DatabaseSync(":memory:");
try {
 sqlite.exec(`
  CREATE TABLE referral_reward_reviews (
    id TEXT PRIMARY KEY, referredUserId TEXT, status TEXT, reviewedBy TEXT,
    reviewedAt TEXT, decisionReason TEXT, updatedAt TEXT
  );
  CREATE TABLE referral_rewards (
    id TEXT PRIMARY KEY, referredUserId TEXT, status TEXT,
    eligibilityReason TEXT, updatedAt TEXT
  );
 `);
 const addReview=sqlite.prepare("INSERT INTO referral_reward_reviews(id,referredUserId,status) VALUES(?1,?2,?3)");
 const addReward=sqlite.prepare("INSERT INTO referral_rewards(id,referredUserId,status) VALUES(?1,?2,?3)");
 addReview.run("r1","u","approved");addReward.run("w1","u","APPROVED");
 addReview.run("r2","other","approved");addReward.run("w2","other","APPROVED");
 const db={
  prepare(sql){return {bind(...args){return ()=>sqlite.prepare(sql).run(...args)}}},
  async batch(statements){
   sqlite.exec("BEGIN IMMEDIATE");
   try {
     const results=statements.map(run=>({meta:{changes:run().changes}}));
     sqlite.exec("COMMIT");
     return results;
   } catch(e){sqlite.exec("ROLLBACK");throw e;}
  }
 };
 const now="2026-11-05T03:00:00.000Z";
 const first=await reverseTerminalReferralRewardsAtomically({db,userId:"u",now});
 assert.deepEqual(first,{ok:true,reviewsReversed:1,rewardsRejected:1});
 assert.equal(sqlite.prepare("SELECT status FROM referral_reward_reviews WHERE id='r1'").get().status,"reversed");
 assert.equal(sqlite.prepare("SELECT status FROM referral_rewards WHERE id='w1'").get().status,"REJECTED");
 const repeated=await reverseTerminalReferralRewardsAtomically({db,userId:"u",now});
 assert.deepEqual(repeated,{ok:true,reviewsReversed:0,rewardsRejected:0});
 assert.equal(sqlite.prepare("SELECT status FROM referral_reward_reviews WHERE id='r2'").get().status,"approved");
 assert.equal(sqlite.prepare("SELECT status FROM referral_rewards WHERE id='w2'").get().status,"APPROVED");
 addReview.run("r3","failuser","approved");addReward.run("w3","failuser","ELIGIBLE");
 sqlite.exec(`CREATE TRIGGER abort_second BEFORE UPDATE ON referral_rewards
   WHEN OLD.referredUserId='failuser'
   BEGIN SELECT RAISE(ABORT,'forced second update failure'); END;`);
 await assert.rejects(
  reverseTerminalReferralRewardsAtomically({db,userId:"failuser",now}),
  /forced second update failure/
 );
 assert.equal(sqlite.prepare("SELECT status FROM referral_reward_reviews WHERE id='r3'").get().status,"approved",
  "first update must roll back if second fails");
 assert.equal(sqlite.prepare("SELECT status FROM referral_rewards WHERE id='w3'").get().status,"ELIGIBLE");
 console.log("Atomic referral reversal PASS: both SQL writes, tenant isolation, duplicate no-op and forced rollback.");
} finally {sqlite.close();}
