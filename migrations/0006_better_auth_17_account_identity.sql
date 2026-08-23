-- Better Auth 1.7 scopes account identities by (issuer, accountId).
-- HEGEVA currently uses email/password credentials, whose canonical issuer is
-- local:credential and whose accountId is the linked Better Auth user id.
-- Keep issuer nullable at the SQLite/D1 schema level so this migration is safe
-- for existing data; Better Auth writes issuer for new rows. Existing non-
-- credential providers (if added later) must be backfilled from their trusted
-- provider issuer before they are used in production.

ALTER TABLE "account" ADD COLUMN "issuer" text;

UPDATE "account"
SET "accountId" = "userId",
    "issuer" = 'local:credential'
WHERE "providerId" = 'credential';

CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_accountId_uidx"
ON "account" ("issuer", "accountId");
