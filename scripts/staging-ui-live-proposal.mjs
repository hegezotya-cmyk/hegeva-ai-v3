// Fresh read-only review; never deploys a Worker or calls a mutating API.
// A successful review is not authorization for staging activation.
import { assessStagingUiVersion } from "./staging-ui-version-assessment.mjs"
import { prepareStagingUiDeploymentProposal } from "./staging-ui-activation-proposal.mjs"

const TARGET_VERSION = "cc024394-65dd-4ce0-b5d8-97dd67ae05a4"
export async function reviewStagingActivation(account, token, request = fetch) {
  const assessment = await assessStagingUiVersion(account, token, TARGET_VERSION, request)
  const proposal = prepareStagingUiDeploymentProposal(assessment)
  return {
    assessment,
    proposal,
    reviewedAt: "current API request; no approval carried forward",
    executed: false,
  }
}
