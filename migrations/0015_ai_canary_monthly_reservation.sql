-- Keep the monthly execution ledger compatible with the stricter one-per-day
-- canary admission ceiling. The daily provider guards remain authoritative.
DROP TRIGGER IF EXISTS ai_canary_admission_commit;

CREATE TRIGGER ai_canary_admission_commit
AFTER INSERT ON ai_canary_admissions
BEGIN
  UPDATE ai_canary_authorizations SET consumedCount=1,status='consumed',consumedAt=NEW.createdAt WHERE authorizationHash=NEW.authorizationHash;
  INSERT INTO ai_provider_usage(scopeHash,scopeType,period,requests,estimatedNeurons,prepaidReserved,updatedAt) VALUES('global-scope-hash','global',NEW.period,1,NEW.estimatedNeurons,1,NEW.createdAt) ON CONFLICT(scopeHash,scopeType,period) DO UPDATE SET requests=requests+1,estimatedNeurons=estimatedNeurons+NEW.estimatedNeurons,prepaidReserved=prepaidReserved+1,updatedAt=NEW.createdAt;
  INSERT INTO ai_provider_usage(scopeHash,scopeType,period,requests,estimatedNeurons,prepaidReserved,updatedAt) VALUES(NEW.actorHash,'user',NEW.period,1,NEW.estimatedNeurons,1,NEW.createdAt) ON CONFLICT(scopeHash,scopeType,period) DO UPDATE SET requests=requests+1,estimatedNeurons=estimatedNeurons+NEW.estimatedNeurons,prepaidReserved=prepaidReserved+1,updatedAt=NEW.createdAt;
  INSERT INTO ai_provider_usage(scopeHash,scopeType,period,requests,estimatedNeurons,prepaidReserved,updatedAt) VALUES(NEW.workspaceHash,'workspace',NEW.period,1,NEW.estimatedNeurons,1,NEW.createdAt) ON CONFLICT(scopeHash,scopeType,period) DO UPDATE SET requests=requests+1,estimatedNeurons=estimatedNeurons+NEW.estimatedNeurons,prepaidReserved=prepaidReserved+1,updatedAt=NEW.createdAt;
  INSERT INTO ai_bot_operations(operationId,userId,workspaceScope,profileId,period,status,attemptNumber,approvedAt,approvalExpiresAt,approvalVersion,approvedByActorHash,usageLimit,createdAt,updatedAt,authorizationHash) VALUES(NEW.operationId,NEW.actorHash,NEW.workspaceHash,NEW.profileId,substr(NEW.period,1,7),'reserved',0,NEW.createdAt,NEW.createdAt,1,NEW.approvedByActorHash,31,NEW.createdAt,NEW.createdAt,NEW.authorizationHash);
  INSERT INTO financial_guard_reservations(reservationId,operationId,providerClass,userHash,workspaceHash,period,estimatedUnits,reservedCostUnits,status,createdAt,retentionUntil) VALUES('fg-'||NEW.operationId,NEW.operationId,'ai-bot',NEW.actorHash,NEW.workspaceHash,NEW.period,NEW.estimatedNeurons,1,'reserved',NEW.createdAt,strftime('%Y-%m-%dT%H:%M:%SZ',NEW.createdAt,'+90 day'));
  INSERT INTO financial_guard_events(eventId,reservationId,operationId,eventType,createdAt,retentionUntil) VALUES('fge-'||NEW.operationId,'fg-'||NEW.operationId,NEW.operationId,'reserved',NEW.createdAt,strftime('%Y-%m-%dT%H:%M:%SZ',NEW.createdAt,'+90 day'));
END;
