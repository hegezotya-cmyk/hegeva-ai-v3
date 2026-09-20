# Demo presentation and owner-canary design

## Purpose

Replace test-looking content in the isolated Demo Workspace with one coherent,
clearly fictional UK example while preserving the deployed Visual System V4
hydration fix. Inspect, but do not broaden, the existing owner-only Assistant
canary path.

## Hydration boundary

The committed hydration guard remains unchanged. The existing source audit is
the regression proof; this work adds no session, API, or visual-system change.

## Demo boundary

The `/demo` route continues to use the current deterministic, client-side demo
fixture architecture. Its visible presentation will use the single fictional
Northgate Property Care Ltd scenario:

- Riverside Estates Management / Amelia Carter;
- annual property maintenance opportunity worth GBP 2,400;
- follow-up due 23 September 2026;
- one prepare-only follow-up action; and
- PREPARED, AWAITING APPROVAL, NOT SENT, and NOT EXECUTED displayed through
  the current five-language label pattern.

All records remain visibly demo/sample data. Fixture totals, cards, timeline,
opportunity, AI employee, owner review, and documents must derive from the
same values. No network write or production command is permitted.

## Assistant canary boundary

Existing server-side owner gating, global/provider switches, quotas, timeout,
and quota-refund behavior are only audited. A single live provider request is
allowed only when all of these conditions hold without source/config changes:

1. an existing normal authenticated owner session is available;
2. the existing owner-only canary endpoint is already enabled and eligible;
3. existing limits are active; and
4. the canary uses no customer data and triggers no external action.

If any condition is absent, the canary result is NOT PROVEN. No new bypass,
flag, credential, provider selection, API deployment, or public rollout may
be introduced.

## Verification

Before a demo-only commit: fixture/source audit with a red-to-green test,
locale coverage for EN/HU/DE/FR/ES, route rendering, typecheck, build, Visual
System V4 audit, hydration audit, email audit, and `git diff --check`.

UI deployment is considered only after these checks pass. API deployment is
not part of this design unless an existing canary path demonstrably requires a
source change, which this design does not authorize by default.

## Exclusions

No changes to real workspace records, D1/migrations, Stripe, billing, auth
configuration, Cloudflare configuration, secrets, provider selection, quotas,
email delivery, payment behavior, or prepared-action execution. Generated
`v0-app/AGENTS.md` and `v0-app/CLAUDE.md` remain untouched and untracked.
