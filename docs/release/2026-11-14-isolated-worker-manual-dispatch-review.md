# PR #106 isolated Worker deployment dispatcher — review checklist

**Draft only. Not deployed. Not merged. No D1 writes, Cloudflare API calls, or Stripe event deliveries were triggered by creating this file.**

## Why a separate PR?
The original `isolated-stripe-webhook-test-harness-ci.yml` stays **offline only**. The Cloudflare browser editor timed out and the Codex local terminal lacks an authenticated PR checkout. This optional manual dispatcher is intentionally isolated from application/staging/production CI.

## Immutable target
- Repository: `hegezotya-cmyk/hegeva-ai-v3`
- Workflow registration: default `v0-rebuild` only, using `workflow_dispatch` **and** explicit text confirmation.
- Checkout: only PR #106 SHA `d2c8fc2366767c54f27e271e84873d22b9edc4a4` (verified against the current open Draft PR before tests and **again immediately before deployment**, including head SHA/branch/repository, base branch, open state, Draft status, and unmerged status).
- Cloudflare account: **HEGEVA Synthetic Tests** `ab362645fc03b7e63a26fd8e46e631b6`
- Existing Worker: `hegeva-isolated-deleted-user-webhook-test`
- Disposable D1 `DB`: `hegeva-deleted-user-webhook-test-db` / `84f4c3b0-c175-4458-bad1-e3f826d6ea96`
- Stripe Sandbox reference only: `acct_1U4YkdHH1vUED8ZN`
- Runtime flag **OFF**, `workers_dev=false`, `preview_urls=false`, no custom routes, no scheduled triggers, no D1 SQL or migrations.

## Required pre-merge decisions
1. **Do not merge this PR until the owner separately approves installing an Actions workflow on the default branch**, after checking existing default-branch deployment triggers. PR #106 remains Draft/unmerged.
2. Inspect the exact workflow and pin to the reviewed immutable SHA. If #106 gains a new commit, **stop and replace SHA only after re-review and passing fresh tests**.
3. **Required read-only Cloudflare route/domain pre-dispatch check** on the precise `HEGEVA Synthetic Tests` Worker page: `https://dash.cloudflare.com/ab362645fc03b7e63a26fd8e46e631b6/workers/services/view/hegeva-isolated-deleted-user-webhook-test/production/domains`. Confirm zero custom domains, zero custom routes, and that both production `workers.dev` and preview URLs are OFF. Capture the observation timestamp and a screenshot in the **owner's private run record**; do not put secret tokens, session cookies or private screenshots in GitHub/chat. If the UI is unavailable or ambiguous, **STOP**. The workflow requires a separate manually typed `route_domain_preflight=ZERO-ROUTES-DOMAINS-VERIFIED` attestation. The string is an operator assertion, **not an automated API proof**; post-deploy verification is still required. Do not broaden a scoped Worker token to enumerate Cloudflare zone routes.
4. The existing GitHub environment `isolated-stripe-test` has **required reviewer** `hegezotya-cmyk` and a branch allowlist historically restricted to `codex/isolated-stripe-test-webhook-harness-20261113`. The dispatcher deliberately runs on **`v0-rebuild` only** so its trusted workflow code executes from the reviewed default branch. As a separate, explicit owner action **after** workflow review, add `v0-rebuild` to that environment's selected deployment-branch rules. Do NOT disable required reviewers, make unrestricted, disable branch filters, or modify any other environment. If not changed, deployment remains blocked.
5. Confirm the environment secret name is `CLOUDFLARE_ISOLATED_WORKER_API_TOKEN`, with **Individual Worker Editor** scoped to this existing isolated Worker. **Do not reveal, copy, expand or reuse the token**. No D1 Write permission is needed to attach the existing D1 binding using Wrangler, but **the workflow itself performs no direct SQL/database operations**.
6. Require a distinct owner decision before clicking **Run workflow** on the **default `v0-rebuild` branch** with the exact confirmation text `DEPLOY-PR106-ISOLATED-ONLY`. Supply both required typed confirmations: `DEPLOY-PR106-ISOLATED-ONLY` and `ZERO-ROUTES-DOMAINS-VERIFIED` (only after the separate read-only Cloudflare route/domain precheck). The environment then requires **another** owner approval before secrets are accessible. No automation or pushes trigger this workflow.
7. Ensure the disposable D1 schema (6 HEGEVA tables, 5 triggers) and identity were installed by the owner; verify the recent pre-change Time Travel bookmark is saved privately. This workflow does not write directly to D1 or restore it.
8. On any error, **STOP**, leave public URLs disabled, report the exact failed gate; never assume deployment rolled back automatically. Remote deployment is a change to the test Worker only.
9. Post-deploy read-only checks use Cloudflare Worker settings, subdomain, schedules, and **deployments** endpoints to verify the exact D1/vars, disabled feature/URLs and no cron, plus the **active deployment ID and active Worker version ID at 100%**. A failing/unauthorized read after deploy is a **blocked sign-off**; the workflow does not automatically repair or roll back. A **human must independently inspect zero custom routes/domains, Worker deployment/version ID, and URL toggles** in the Cloudflare dashboard.
10. **No Stripe event replay, test webhook secret provisioning, public route activation, staging or production deploy, PR #106 merge, billing/Better Auth release sign-off.** `releaseSafe=false`.

## Structural distinction
A `workflow_dispatch` file must exist on the repository default branch for the manual trigger to be registered. Staging/production deploy workflows should not be connected to this new dispatcher. The environment's current branch filter must not be silently bypassed; adding `v0-rebuild` must be a separate approved security change, and is intentionally **not** performed here.

This is an operational review proposal only; it does not assert that the deployment succeeded.

## No-secret CI validation (PR #107)

- `.github/workflows/isolated-stripe-dispatch-validation.yml` runs on this PR when workflow, validator or runbook files change; it has `contents: read` only, **no environment or Cloudflare secret**, and **does not deploy**.
- `scripts/validate-isolated-worker-dispatch.py` uses PyYAML to parse the proposed workflow, `bash -n` on its run blocks and Python `ast.parse` on its embedded Python blocks. It also checks the exact guarded PR #106 head/base/Draft/open state, manual-only trigger, two typed confirmations, secret isolation, disabled URLs and deployment postflight.
- The validation CI also runs `actionlint` pinned at `v1.7.7` to check GitHub Actions grammar and expressions. **Do not mark CI PASS until the exact latest PR #107 head has a successful run.**
- All static validation is necessary but insufficient: it does not authorize the protected environment branch change, dispatch, approval or actual Worker deployment.

## Release evidence and failure policy

- Before dispatch: record operator, date/time, Cloudflare account, exact isolated Worker name, observed zero routes/domains, disabled `workers.dev` and preview URLs; a screenshot is private, not included in GitHub. The manual attestation input is not independent proof.
- After deployment (if later approved): read Cloudflare Worker settings, binding IDs, enabled flag, subdomain and previews, schedules, latest active deployment/version IDs. The Cloudflare `GET /accounts/{account_id}/workers/scripts/{script_name}/deployments` endpoint returns a list with the newest active deployment first; require a single version at 100%. Preserve only IDs/harmless metadata in the GitHub job summary.
- Confirm no routes/domains in Cloudflare UI again. If permissions to post-check are insufficient, report `BLOCKED` and do not claim verified deployment; do **not** expand token scope automatically.
- Until separately approved, **no branch allowlist change, PR merge, workflow dispatch, Worker upload, Stripe webhooks or feature enable.** `releaseSafe=false`.


## Additional remote preflight and version-change gate — 2026-11-14

- **After** owner approval of the protected environment, but **before** uploading anything, the scoped Individual Worker Editor token performs **read-only GETs** to the exact isolated Worker's Cloudflare `/subdomain`, `/schedules` and `/deployments` endpoints. It requires public `workers.dev` and preview URLs both disabled, no Cron schedules, and exactly one active pre-existing Worker version at 100%. Missing or ambiguous responses stop the job. The token is not used to alter these settings.
- The old active Worker version UUID is written to the GitHub job's environment variables; the full PR #106 safety-state recheck remains **immediately before the deploy command**.
- After deployment, the workflow re-queries read-only Cloudflare metadata, requires exactly one version at 100% and **a different active version UUID** from the pre-deploy version; records both IDs and the active deployment ID. This is deployment-change evidence, not proof of webhook correctness, Stripe signing, or route containment outside `workers.dev`.
- The manually recorded zero custom routes/domains is still required **before dispatch**, and must be independently reconfirmed after a future deployment. The scoped token does not grant zone-wide route enumeration; the workflow must not gain one.
- Validation script `scripts/validate-isolated-worker-dispatch.py` asserts the protected preflight URL/Cron/version checks and the active version comparison. Only a successful CI run on the **current** PR #107 head can close static-validation evidence.
- **No default-branch merge, environment allowlist change, dispatch, deployment or token adjustment was performed by preparing these updates.** `releaseSafe=false`.

Official deployment endpoint docs: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/deployments/methods/list/ .
