-- Test-only. Apply ONLY with wrangler d1 execute --local to a disposable fixture.
-- NEVER run this file on remote staging or production databases.
INSERT INTO "user" ("id","name","email","emailVerified","createdAt","updatedAt")
VALUES
 ('fixture-tenant-alpha','Fixture Alpha','alpha@fixture.invalid',1,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
 ('fixture-tenant-beta','Fixture Beta','beta@fixture.invalid',1,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000);
INSERT INTO "session" ("id","expiresAt","token","createdAt","updatedAt","userId")
VALUES
 ('fixture-session-alpha',(CAST(strftime('%s','now') AS INTEGER)+86400)*1000,'fixture-alpha-session-only',(CAST(strftime('%s','now') AS INTEGER))*1000,(CAST(strftime('%s','now') AS INTEGER))*1000,'fixture-tenant-alpha'),
 ('fixture-session-beta',(CAST(strftime('%s','now') AS INTEGER)+86400)*1000,'fixture-beta-session-only',(CAST(strftime('%s','now') AS INTEGER))*1000,(CAST(strftime('%s','now') AS INTEGER))*1000,'fixture-tenant-beta');
