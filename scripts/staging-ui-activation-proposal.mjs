// Pure, offline activation proposal. This module has no network or mutation capability.
// A proposal is NOT permission to activate a version.
const WORKER = "hegeva-ai-v3-v0-staging"
const VERSION = "cc024394-65dd-4ce0-b5d8-97dd67ae05a4"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function prepareStagingUiDeploymentProposal(assessment) {
  if (!assessment || assessment.worker !== WORKER || assessment.version !== VERSION ||
      !UUID.test(assessment.version) || assessment.versionReadStatus !== 200 ||
      assessment.deploymentsReadStatus !== 200 || assessment.versionVerified !== true ||
      assessment.alreadyDeployed !== false || assessment.readyForReview !== true) {
    throw new Error("Refusing unverified or non-staging deployment proposal")
  }
  const body = {
    strategy: "percentage",
    versions: [{ version_id: VERSION, percentage: 100 }],
    annotations: { "workers/message": "HEGEVA staging-only GA4 validation; manual approval required" },
  }
  return {
    worker: WORKER,
    action: "PROPOSAL_ONLY_NO_NETWORK",
    apiMethodForFutureReviewedChange: "POST",
    apiPathForFutureReviewedChange: `/accounts/{account_id}/workers/scripts/${WORKER}/deployments`,
    payloadForManualReview: body,
    requiresSeparateExplicitApproval: true,
    currentDeploymentMustBeRechecked: true,
    productionAllowed: false,
  }
}
