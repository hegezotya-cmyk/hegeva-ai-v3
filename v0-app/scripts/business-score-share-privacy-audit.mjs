import assert from "node:assert/strict";import fs from "node:fs";
const migration=fs.readFileSync("../migrations/0023_business_score_shares.sql","utf8");const api=fs.readFileSync("../src/index.js","utf8");
for(const field of ["tokenHash","scoreBand","methodologyVersion","expiresAt","revokedAt"])assert.ok(migration.includes(field));
for(const forbidden of ["customerName","invoiceId","prompt","response"])assert.equal(migration.includes(forbidden),false);
assert.ok(api.includes("/api/business-score/share")&&api.includes("/api/business-score/public/"));console.log("business score share privacy audit: PASS");
