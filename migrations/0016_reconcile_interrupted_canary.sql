-- Reconcile the single canary whose provider attempt completed before the
-- original finalizer failed to match the hashed ledger owner identifier.
UPDATE financial_guard_reservations
SET status='released',
    finalizedAt=strftime('%Y-%m-%dT%H:%M:%fZ','now'),
    failureCode='operation-finalization-failed'
WHERE operationId='569b8db0-caf7-49a8-b80c-561857ac2634'
  AND status='reserved';

UPDATE ai_bot_operations
SET status='failed',
    attemptNumber=1,
    updatedAt=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE operationId='569b8db0-caf7-49a8-b80c-561857ac2634'
  AND status='reserved';

INSERT INTO ai_bot_execution_history(
  id,operationId,userId,workspaceScope,profileId,status,failureCode,
  attemptNumber,createdAt,retentionUntil
)
SELECT
  'repair-569b8db0-caf7-49a8-b80c-561857ac2634',
  operationId,userId,workspaceScope,profileId,'failed',
  'operation-finalization-failed',1,
  strftime('%Y-%m-%dT%H:%M:%fZ','now'),
  strftime('%Y-%m-%dT%H:%M:%SZ','now','+90 day')
FROM ai_bot_operations
WHERE operationId='569b8db0-caf7-49a8-b80c-561857ac2634'
  AND status='failed'
  AND NOT EXISTS (
    SELECT 1 FROM ai_bot_execution_history
    WHERE operationId='569b8db0-caf7-49a8-b80c-561857ac2634'
  );
