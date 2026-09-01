PRAGMA foreign_keys = ON;

ALTER TABLE ai_bot_operations ADD COLUMN authorizationHash TEXT;
CREATE INDEX IF NOT EXISTS idx_ai_bot_operations_authorization ON ai_bot_operations(authorizationHash);
CREATE TRIGGER IF NOT EXISTS ai_bot_operation_requires_consumed_canary
BEFORE INSERT ON ai_bot_operations
WHEN NEW.status = 'reserved'
BEGIN
  SELECT RAISE(ABORT, 'consumed canary authorization required') WHERE NEW.authorizationHash IS NULL OR NOT EXISTS (SELECT 1 FROM ai_canary_authorizations WHERE authorizationHash = NEW.authorizationHash AND status = 'consumed' AND consumedCount = 1);
END;

CREATE TABLE IF NOT EXISTS ai_canary_authorizations (
  authorizationHash TEXT PRIMARY KEY CHECK (length(authorizationHash) BETWEEN 64 AND 128),
  actorHash TEXT NOT NULL CHECK (length(actorHash) BETWEEN 16 AND 128),
  workspaceHash TEXT NOT NULL CHECK (length(workspaceHash) BETWEEN 16 AND 128),
  operationType TEXT NOT NULL CHECK (operationType IN ('ai-bot','assistant')),
  maximumRequests INTEGER NOT NULL DEFAULT 1 CHECK (maximumRequests = 1),
  consumedCount INTEGER NOT NULL DEFAULT 0 CHECK (consumedCount BETWEEN 0 AND 1),
  createdAt TEXT NOT NULL CHECK (length(createdAt) BETWEEN 20 AND 40),
  expiresAt TEXT NOT NULL CHECK (length(expiresAt) BETWEEN 20 AND 40),
  consumedAt TEXT,
  revokedAt TEXT,
  status TEXT NOT NULL CHECK (status IN ('active','consumed','expired','revoked'))
);
CREATE INDEX IF NOT EXISTS idx_ai_canary_auth_expiry ON ai_canary_authorizations(expiresAt, status);
CREATE INDEX IF NOT EXISTS idx_ai_canary_auth_scope ON ai_canary_authorizations(workspaceHash, operationType, status);

CREATE TABLE IF NOT EXISTS ai_provider_usage (
  scopeHash TEXT NOT NULL CHECK (length(scopeHash) BETWEEN 16 AND 128),
  scopeType TEXT NOT NULL CHECK (scopeType IN ('global','user','workspace')),
  period TEXT NOT NULL CHECK (length(period) = 10 AND period GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  requests INTEGER NOT NULL DEFAULT 0 CHECK (requests >= 0),
  estimatedNeurons INTEGER NOT NULL DEFAULT 0 CHECK (estimatedNeurons >= 0),
  updatedAt TEXT NOT NULL CHECK (length(updatedAt) BETWEEN 20 AND 40),
  PRIMARY KEY (scopeHash, scopeType, period)
);

CREATE TABLE IF NOT EXISTS financial_guard_reservations (
  reservationId TEXT PRIMARY KEY CHECK (length(reservationId) BETWEEN 16 AND 128),
  operationId TEXT NOT NULL UNIQUE CHECK (length(operationId) BETWEEN 36 AND 64),
  providerClass TEXT NOT NULL CHECK (providerClass IN ('workers-ai','assistant','ai-bot')),
  userHash TEXT NOT NULL CHECK (length(userHash) BETWEEN 16 AND 128),
  workspaceHash TEXT NOT NULL CHECK (length(workspaceHash) BETWEEN 16 AND 128),
  period TEXT NOT NULL CHECK (length(period) = 10 AND period GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  estimatedUnits INTEGER NOT NULL CHECK (estimatedUnits > 0),
  reservedCostUnits INTEGER NOT NULL CHECK (reservedCostUnits > 0),
  status TEXT NOT NULL CHECK (status IN ('reserved','finalized','released')),
  failureCode TEXT CHECK (failureCode IS NULL OR length(failureCode) BETWEEN 1 AND 64),
  createdAt TEXT NOT NULL CHECK (length(createdAt) BETWEEN 20 AND 40),
  finalizedAt TEXT,
  retentionUntil TEXT NOT NULL CHECK (length(retentionUntil) BETWEEN 20 AND 40)
);
CREATE INDEX IF NOT EXISTS idx_fg_reservations_scope_period ON financial_guard_reservations(workspaceHash, period, status);
CREATE INDEX IF NOT EXISTS idx_fg_reservations_retention ON financial_guard_reservations(retentionUntil);

CREATE TABLE IF NOT EXISTS financial_guard_events (
  eventId TEXT PRIMARY KEY CHECK (length(eventId) BETWEEN 16 AND 128),
  reservationId TEXT NOT NULL,
  operationId TEXT NOT NULL CHECK (length(operationId) BETWEEN 36 AND 64),
  eventType TEXT NOT NULL CHECK (eventType IN ('reserved','finalized','released')),
  createdAt TEXT NOT NULL CHECK (length(createdAt) BETWEEN 20 AND 40),
  retentionUntil TEXT NOT NULL CHECK (length(retentionUntil) BETWEEN 20 AND 40),
  FOREIGN KEY (reservationId) REFERENCES financial_guard_reservations(reservationId) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_fg_events_reservation_time ON financial_guard_events(reservationId, createdAt);
CREATE INDEX IF NOT EXISTS idx_fg_events_retention ON financial_guard_events(retentionUntil);

CREATE TRIGGER IF NOT EXISTS ai_canary_authorization_consume_guard
BEFORE UPDATE OF consumedCount, status ON ai_canary_authorizations
WHEN OLD.status = 'active' AND NOT (NEW.status = 'consumed' AND NEW.consumedCount = 1 OR NEW.status IN ('expired','revoked') AND NEW.consumedCount = 0)
BEGIN SELECT RAISE(ABORT, 'invalid canary authorization transition'); END;
CREATE TRIGGER IF NOT EXISTS ai_canary_authorization_immutable
BEFORE UPDATE ON ai_canary_authorizations
WHEN OLD.status <> 'active'
BEGIN SELECT RAISE(ABORT, 'canary authorization is immutable'); END;
CREATE TRIGGER IF NOT EXISTS ai_canary_authorization_no_delete
BEFORE DELETE ON ai_canary_authorizations
BEGIN SELECT RAISE(ABORT, 'canary authorization is append-only'); END;
CREATE TRIGGER IF NOT EXISTS financial_guard_events_no_update
BEFORE UPDATE ON financial_guard_events
BEGIN SELECT RAISE(ABORT, 'financial guard events are append-only'); END;
CREATE TRIGGER IF NOT EXISTS financial_guard_events_no_delete
BEFORE DELETE ON financial_guard_events
BEGIN SELECT RAISE(ABORT, 'financial guard events are append-only'); END;

CREATE TRIGGER IF NOT EXISTS financial_guard_transition_guard
BEFORE UPDATE OF status ON financial_guard_reservations
WHEN NOT (
  OLD.status = 'reserved' AND NEW.status IN ('finalized','released')
)
BEGIN SELECT RAISE(ABORT, 'invalid financial guard transition'); END;

CREATE TRIGGER IF NOT EXISTS financial_guard_terminal_immutable
BEFORE UPDATE ON financial_guard_reservations
WHEN OLD.status IN ('finalized','released')
BEGIN SELECT RAISE(ABORT, 'terminal financial guard reservation is immutable'); END;

CREATE TRIGGER IF NOT EXISTS ai_bot_operation_terminal_guard
BEFORE UPDATE OF status ON ai_bot_operations
WHEN OLD.status <> 'reserved' AND NEW.status <> OLD.status
BEGIN SELECT RAISE(ABORT, 'terminal AI Bot operation is immutable'); END;

CREATE TRIGGER IF NOT EXISTS ai_bot_terminal_history_guard
BEFORE INSERT ON ai_bot_execution_history
WHEN NOT EXISTS (SELECT 1 FROM ai_bot_operations WHERE operationId=NEW.operationId AND status=NEW.status AND attemptNumber=1)
  OR EXISTS (SELECT 1 FROM ai_bot_execution_history WHERE operationId=NEW.operationId)
BEGIN SELECT RAISE(ABORT, 'terminal AI Bot history already exists or operation is not terminal'); END;

CREATE TRIGGER IF NOT EXISTS financial_guard_transition_event
AFTER UPDATE OF status ON financial_guard_reservations
WHEN OLD.status = 'reserved' AND NEW.status IN ('finalized','released')
BEGIN
  INSERT INTO financial_guard_events(eventId,reservationId,operationId,eventType,createdAt,retentionUntil)
  VALUES('fge-'||NEW.reservationId||'-'||NEW.status,NEW.reservationId,NEW.operationId,NEW.status,COALESCE(NEW.finalizedAt,NEW.createdAt),NEW.retentionUntil);
END;

-- Canonical trigger-guarded admission surface. Every mutation below runs in
-- the same SQLite/D1 transaction as the admission INSERT.
ALTER TABLE ai_provider_usage ADD COLUMN prepaidReserved INTEGER NOT NULL DEFAULT 0 CHECK (prepaidReserved >= 0);

CREATE TABLE IF NOT EXISTS ai_canary_admissions (
  operationId TEXT PRIMARY KEY CHECK (length(operationId) BETWEEN 36 AND 64),
  authorizationHash TEXT NOT NULL UNIQUE REFERENCES ai_canary_authorizations(authorizationHash) ON DELETE RESTRICT,
  actorHash TEXT NOT NULL CHECK (length(actorHash) BETWEEN 16 AND 128),
  workspaceHash TEXT NOT NULL CHECK (length(workspaceHash) BETWEEN 16 AND 128),
  profileId TEXT NOT NULL CHECK (length(profileId) BETWEEN 5 AND 100),
  period TEXT NOT NULL CHECK (length(period)=10 AND period GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  estimatedNeurons INTEGER NOT NULL CHECK (estimatedNeurons BETWEEN 1 AND 1000000),
  globalDailyCeiling INTEGER NOT NULL CHECK (globalDailyCeiling BETWEEN 1 AND 1000000),
  userDailyCeiling INTEGER NOT NULL CHECK (userDailyCeiling BETWEEN 1 AND 1000000),
  workspaceDailyCeiling INTEGER NOT NULL CHECK (workspaceDailyCeiling BETWEEN 1 AND 1000000),
  neuronDailyCeiling INTEGER NOT NULL CHECK (neuronDailyCeiling BETWEEN 1 AND 100000000),
  prepaidAvailable INTEGER NOT NULL CHECK (prepaidAvailable IN (0,1)),
  approvedAt TEXT NOT NULL CHECK (length(approvedAt) BETWEEN 20 AND 40),
  approvalExpiresAt TEXT NOT NULL CHECK (length(approvalExpiresAt) BETWEEN 20 AND 40),
  approvalVersion INTEGER NOT NULL CHECK (approvalVersion BETWEEN 1 AND 1000000),
  approvedByActorHash TEXT NOT NULL CHECK (length(approvedByActorHash) BETWEEN 16 AND 128),
  createdAt TEXT NOT NULL CHECK (length(createdAt) BETWEEN 20 AND 40)
);
CREATE INDEX IF NOT EXISTS idx_ai_canary_admissions_actor_period ON ai_canary_admissions(actorHash,period);
CREATE INDEX IF NOT EXISTS idx_ai_canary_admissions_workspace_period ON ai_canary_admissions(workspaceHash,period);

CREATE TRIGGER IF NOT EXISTS ai_canary_admission_guard
BEFORE INSERT ON ai_canary_admissions
BEGIN
  SELECT RAISE(ABORT,'canary authorization unavailable') WHERE NOT EXISTS (SELECT 1 FROM ai_canary_authorizations a WHERE a.authorizationHash=NEW.authorizationHash AND a.actorHash=NEW.actorHash AND a.workspaceHash=NEW.workspaceHash AND a.operationType='ai-bot' AND a.status='active' AND a.consumedCount=0 AND a.expiresAt>NEW.createdAt);
  SELECT RAISE(ABORT,'duplicate canary admission') WHERE EXISTS (SELECT 1 FROM ai_canary_admissions WHERE authorizationHash=NEW.authorizationHash OR operationId=NEW.operationId);
  SELECT RAISE(ABORT,'global provider ceiling reached') WHERE COALESCE((SELECT requests FROM ai_provider_usage WHERE scopeHash='global-scope-hash' AND scopeType='global' AND period=NEW.period),0)+1>NEW.globalDailyCeiling;
  SELECT RAISE(ABORT,'user provider ceiling reached') WHERE COALESCE((SELECT requests FROM ai_provider_usage WHERE scopeHash=NEW.actorHash AND scopeType='user' AND period=NEW.period),0)+1>NEW.userDailyCeiling;
  SELECT RAISE(ABORT,'workspace provider ceiling reached') WHERE COALESCE((SELECT requests FROM ai_provider_usage WHERE scopeHash=NEW.workspaceHash AND scopeType='workspace' AND period=NEW.period),0)+1>NEW.workspaceDailyCeiling;
  SELECT RAISE(ABORT,'neuron ceiling reached') WHERE COALESCE((SELECT estimatedNeurons FROM ai_provider_usage WHERE scopeHash='global-scope-hash' AND scopeType='global' AND period=NEW.period),0)+NEW.estimatedNeurons>NEW.neuronDailyCeiling;
  SELECT RAISE(ABORT,'prepaid allowance unavailable') WHERE NEW.prepaidAvailable<>1;
END;

CREATE TRIGGER IF NOT EXISTS ai_canary_admission_commit
AFTER INSERT ON ai_canary_admissions
BEGIN
  UPDATE ai_canary_authorizations SET consumedCount=1,status='consumed',consumedAt=NEW.createdAt WHERE authorizationHash=NEW.authorizationHash;
  INSERT INTO ai_provider_usage(scopeHash,scopeType,period,requests,estimatedNeurons,prepaidReserved,updatedAt) VALUES('global-scope-hash','global',NEW.period,1,NEW.estimatedNeurons,1,NEW.createdAt) ON CONFLICT(scopeHash,scopeType,period) DO UPDATE SET requests=requests+1,estimatedNeurons=estimatedNeurons+NEW.estimatedNeurons,prepaidReserved=prepaidReserved+1,updatedAt=NEW.createdAt;
  INSERT INTO ai_provider_usage(scopeHash,scopeType,period,requests,estimatedNeurons,prepaidReserved,updatedAt) VALUES(NEW.actorHash,'user',NEW.period,1,NEW.estimatedNeurons,1,NEW.createdAt) ON CONFLICT(scopeHash,scopeType,period) DO UPDATE SET requests=requests+1,estimatedNeurons=estimatedNeurons+NEW.estimatedNeurons,prepaidReserved=prepaidReserved+1,updatedAt=NEW.createdAt;
  INSERT INTO ai_provider_usage(scopeHash,scopeType,period,requests,estimatedNeurons,prepaidReserved,updatedAt) VALUES(NEW.workspaceHash,'workspace',NEW.period,1,NEW.estimatedNeurons,1,NEW.createdAt) ON CONFLICT(scopeHash,scopeType,period) DO UPDATE SET requests=requests+1,estimatedNeurons=estimatedNeurons+NEW.estimatedNeurons,prepaidReserved=prepaidReserved+1,updatedAt=NEW.createdAt;
  INSERT INTO ai_bot_operations(operationId,userId,workspaceScope,profileId,period,status,attemptNumber,approvedAt,approvalExpiresAt,approvalVersion,approvedByActorHash,usageLimit,createdAt,updatedAt,authorizationHash) VALUES(NEW.operationId,NEW.actorHash,NEW.workspaceHash,NEW.profileId,substr(NEW.period,1,7),'reserved',0,NEW.createdAt,NEW.createdAt,1,NEW.approvedByActorHash,1,NEW.createdAt,NEW.createdAt,NEW.authorizationHash);
  INSERT INTO financial_guard_reservations(reservationId,operationId,providerClass,userHash,workspaceHash,period,estimatedUnits,reservedCostUnits,status,createdAt,retentionUntil) VALUES('fg-'||NEW.operationId,NEW.operationId,'ai-bot',NEW.actorHash,NEW.workspaceHash,NEW.period,NEW.estimatedNeurons,1,'reserved',NEW.createdAt,strftime('%Y-%m-%dT%H:%M:%SZ',NEW.createdAt,'+90 day'));
  INSERT INTO financial_guard_events(eventId,reservationId,operationId,eventType,createdAt,retentionUntil) VALUES('fge-'||NEW.operationId,'fg-'||NEW.operationId,NEW.operationId,'reserved',NEW.createdAt,strftime('%Y-%m-%dT%H:%M:%SZ',NEW.createdAt,'+90 day'));
END;
