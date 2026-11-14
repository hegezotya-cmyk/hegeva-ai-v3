# PR #106 isolated Worker deployment dispatcher — review checklist

**Draft only. Not deployed. Not merged. No D1 writes, Cloudflare API calls, or Stripe event deliveries were triggered by creating this file.**

## Why a separate PR?
The original `isolated-stripe-webhook-test-harness-ci.yml` stays **offline only**. The Cloudflare browser editor timed out and the Codex local terminal lacks an authenticated PR checkout. This optional manual dispatcher is intentionally isolated from application/staging/production CI.

## Immutable target
- Repository: `hegezotya-cmyk/hegeva-ai-v3`
- Workflow registration: default `v0-rebuild` only, using `workflow_dispatch` **and** explicit text confirmation.
- Checkout: only PR #106 SHA `d2c8fc2366767c54f27e271e84873d22b9edc4a4` (verified against the current open Draft PR before tests and after environment approval).
- Cloudflare account: **HEGEVA Synthetic Tests** `ab362645fc03b7e63a26fd8e46e631b6`
- Existing Worker: `hegeva-isolated-deleted-user-webhook-test`
- Disposable D1 `DB`: `hegeva-deleted-user-webhook-test-db` / `84f4c3b0-c175-4458-bad1-e3f826d6ea96`
- Stripe Sandbox reference only: `acct_1U4YkdHH1vUED8ZN`
- Runtime flag **OFF**, `workers_dev=false`, `preview_urls=false`, no custom routes, no scheduled triggers, no D1 SQL or migrations.

## Required pre-merge decisions
1. **Do not merge this PR until the owner separately approves installing an Actions workflow on the default branch**, after checking existing default-branch deployment triggers. PR #106 remains Draft/unmerged.
2. Inspect the exact workflow and pin to the reviewed immutable SHA. If #106 gains a new commit, **stop and replace SHA only after re-review and passing fresh tests**.
3. The existing GitHub environment `isolated-stripe-test` has **required reviewer** `hegezotya-cmyk` and a branch allowlist historically restricted to `codex/isolated-stripe-test-webhook-harness-20261113`. The dispatcher deliberately runs on **`v0-rebuild` only** so its trusted workflow code executes from the reviewed default branch. As a separate, explicit owner action **after** workflow review, add `v0-rebuild` to that environment's selected deployment-branch rules. Do NOT disable required reviewers, make unrestricted, disable branch filters, or modify any other environment. If not changed, deployment remains blocked.
4. Confirm the environment secret name is `CLOUDFLARE_ISOLATED_WORKER_API_TOKEN`, with **Individual Worker Editor** scoped to this existing isolated Worker. **Do not reveal, copy, expand or reuse the token**. No D1 Write permission is needed to attach the existing D1 binding using Wrangler, but **the workflow itself performs no direct SQL/database operations**.
5. Require a distinct owner decision before clicking **Run workflow** on the **default `v0-rebuild` branch** with the exact confirmation text `DEPLOY-PR106-ISOLATED-ONLY`. The environment then requires **another** owner approval before secrets are accessible. No automation or pushes trigger this workflow.
6. Ensure the disposable D1 schema (6 HEGEVA tables, 5 triggers) and identity were installed by the owner; verify the recent pre-change Time Travel bookmark is saved privately. This workflow does not write directly to D1 or restore it.
7. On any error, **STOP**, leave public URLs disabled, report the exact failed gate; never assume deployment rolled back automatically. Remote deployment is a change to the test Worker only.
8. Post-deploy read-only checks use Cloudflare Worker settings, subdomain, and schedules endpoints to verify the exact D1/vars, disabled feature/URLs and no cron. A failing/unauthorized read after deploy is a **blocked sign-off**; the workflow does not automatically repair or roll back. A **human must independently inspect zero custom routes/domains, Worker deployment/version ID, and URL toggles** in the Cloudflare dashboard.
9. **No Stripe event replay, test webhook secret provisioning, public route activation, staging or production deploy, PR #106 merge, billing/Better Auth release sign-off.** `releaseSafe=false`.

## Structural distinction
A `workflow_dispatch` file must exist on the repository default branch for the manual trigger to be registered. Staging/production deploy workflows should not be connected to this new dispatcher. The environment's current branch filter must not be silently bypassed; adding `v0-rebuild` must be a separate approved security change, and is intentionally **not** performed here.

This is an operational review proposal only; it does not assert that the deployment succeeded.