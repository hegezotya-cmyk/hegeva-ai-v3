-- TEST-ONLY synthetic users; Wrangler --local / disposable D1 fixture exclusively.
-- Accounts/password hashes are generated separately by Better Auth's hashPassword helper.
-- Never apply this SQL to remote staging or production D1.
INSERT INTO "user" ("id","name","email","emailVerified","createdAt","updatedAt")
VALUES
 ('fixture-tenant-alpha','Fixture Alpha','alpha@fixture.invalid',1,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
 ('fixture-tenant-beta','Fixture Beta','beta@fixture.invalid',1,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000);
