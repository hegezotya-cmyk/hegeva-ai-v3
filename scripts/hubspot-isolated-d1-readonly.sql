-- HEGEVA isolated HubSpot D1: read-only schema inventory.
-- Run ONLY in Cloudflare account HEGEVA Synthetic Tests,
-- D1 hegeva-hubspot-isolated-test-db (53fd518c-9b5c-45b5-9a74-4565f7acdd22).
-- This script makes no changes and reads no customer payloads.
-- Stop if the account/database identity does not match.
SELECT name, type FROM sqlite_master
WHERE type IN ('table','view','index','trigger')
  AND name NOT LIKE 'sqlite_%'
ORDER BY type, name;
SELECT name FROM sqlite_master
WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;
SELECT name FROM sqlite_master
WHERE type = 'trigger' AND name NOT LIKE 'sqlite_%'
ORDER BY name;
-- Do not run INSERT/UPDATE/DELETE/CREATE/DROP/ALTER/PRAGMA writable_schema.
