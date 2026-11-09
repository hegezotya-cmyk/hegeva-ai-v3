# Isolated synthetic Cron account setup

Status: **OWNER SETUP REQUIRED**. No new Cloudflare account, token, or GitHub secret has been created by this change.

## Why this is separate

The synthetic Cron worker needs D1 and Workers Scripts write access. Cloudflare token permissions apply at account scope, so the synthetic token must belong to an account that contains only the synthetic test D1 database and its test Worker. Do not create this token in the account that contains production or the existing staging app.

## One-time owner setup

1. Create or select a separate Cloudflare account used only for synthetic Cron acceptance. Do not add production zones, production Workers, or production D1 databases to it.
2. In that account, create a D1 database named `hegeva-ai-v3-staging-scheduled-test-db`. Copy its account ID and D1 database ID.
3. Create a temporary account API token in that same test-only account:
   - Name: `HEGEVA Synthetic Cron CI`
   - Permissions: `D1 Edit` and `Workers Scripts Edit`
   - Scope: the synthetic-only account
   - Expiration: 7 days
   - Do not grant zone, production account, or unrelated permissions.
4. In GitHub **Settings → Environments → staging**, add:
   - Secret `CLOUDFLARE_SYNTHETIC_TEST_API_TOKEN`: the new token value
   - Variable `CLOUDFLARE_SYNTHETIC_TEST_ACCOUNT_ID`: the test-only account ID
   - Variable `STAGING_SCHEDULED_TEST_D1_ID`: the new D1 database ID
5. Confirm the existing staging environment can read the production account ID secret `CLOUDFLARE_ACCOUNT_ID` and staging account ID secret `CLOUDFLARE_STAGING_ACCOUNT_ID`. The setup guard refuses to continue if the synthetic account matches either one.
6. Never paste the token value into chat or commit it. Save it only in the GitHub environment secret and a password manager.

## Automated acceptance and cleanup

On the isolated-account branch, run **HEGEVA Staging Deploy** with `synthetic-cron-enable`. The workflow:

1. Runs the offline synthetic regression suite.
2. Rejects malformed identifiers, a production/staging account ID, or a D1 ID belonging to production, staging, or the prior shared-account fixture.
3. Materializes a temporary Wrangler config with the new D1 ID.
4. Applies only the synthetic schema and deploys only `hegeva-ai-v3-staging-scheduled-test` in the dedicated test account with TEST mode and the Cron flag enabled.
5. Waits for actual scheduled invocations to record two-attempt retry recovery, a single idempotent effect, successful fencing checks, and no active lease.
6. Disables the test Cron, deletes only synthetic fixture rows, and verifies zero residual fixture rows.

A PASS requires the remote D1 evidence and cleanup verification. A missing secret, wrong account, wrong database, insufficient permission, timeout, failed assertion, or cleanup failure leaves the workflow failed. No production Worker or production D1 is used by this workflow.

## Current state

- Existing staging-only token remains unchanged.
- No new token or secret has been created.
- No remote D1 write or Worker deploy has been run with the new path.
- The dedicated test account and its GitHub environment values still need owner setup before the workflow can run.
