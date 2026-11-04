import assert from "node:assert/strict"
import { prepareStagingUiDeploymentProposal } from "./staging-ui-activation-proposal.mjs"
const verified = {
  worker: "hegeva-ai-v3-v0-staging",
  version: "cc024394-65dd-4ce0-b5d8-97dd67ae05a4",
  versionReadStatus: 200,
  deploymentsReadStatus: 200,
  versionVerified: true,
  currentDeploymentVerified: true,
  alreadyDeployed: false,
  readyForReview: true,
}
const proposal = prepareStagingUiDeploymentProposal(verified)
assert.equal(proposal.action, "PROPOSAL_ONLY_NO_NETWORK")
assert.equal(proposal.requiresSeparateExplicitApproval, true)
assert.equal(proposal.currentDeploymentMustBeRechecked, true)
assert.equal(proposal.productionAllowed, false)
assert.equal(proposal.payloadForManualReview.strategy, "percentage")
assert.deepEqual(proposal.payloadForManualReview.versions, [{ version_id: verified.version, percentage: 100 }])
assert.ok(proposal.apiPathForFutureReviewedChange.endsWith("/workers/scripts/hegeva-ai-v3-v0-staging/deployments"))
assert.ok(!JSON.stringify(proposal).includes("hegevaai.co.uk"))
for (const change of [
  { worker: "hegeva-ai-v3-v0" },
  { version: "49752f6a-12ed-4667-82a5-cf1f8e83d2d2" },
  { versionVerified: false },
  { currentDeploymentVerified: false },
  { versionReadStatus: 403 },
  { deploymentsReadStatus: 403 },
  { alreadyDeployed: true },
  { readyForReview: false },
]) {
  assert.throws(() => prepareStagingUiDeploymentProposal({ ...verified, ...change }))
}
assert.throws(() => prepareStagingUiDeploymentProposal(null))
console.log("Staging UI activation proposal offline safety tests: PASS (no network/mutations)")
