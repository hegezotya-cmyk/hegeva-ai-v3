import assert from "node:assert/strict";import fs from "node:fs";
const migration=fs.readFileSync("../migrations/0024_referrals.sql","utf8"),mod=fs.readFileSync("../src/referral-attribution.js","utf8"),api=fs.readFileSync("../src/index.js","utf8");
for(const table of ["referral_codes","referral_touches","referral_attributions"])assert.ok(migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`));
for(const bad of ["email","customerName","stripeCustomerId","workspaceId","paymentAmount"])assert.equal(migration.includes(bad),false,`privacy field ${bad}`);
assert.ok(mod.includes("30 * 86400000")&&mod.includes("code.ownerUserId===referredUserId")&&migration.includes("referredUserId TEXT NOT NULL UNIQUE"));
for(const route of ["/api/referrals/code","/api/referrals/touch","/api/referrals/attribute","/api/referrals/attributions"])assert.ok(api.includes(route));
const ui=fs.readFileSync("components/growth/referral-review.tsx","utf8");for(const locale of ["en:","hu:","de:","fr:","es:"])assert.ok(ui.includes(locale));
console.log("referral phase 3A audit: PASS");
