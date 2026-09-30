# HEGEVA Growth Activation Sprint 02

## A. Sprint goal

Improve the first verified customer path using the existing authentication, `/get-started`, workspace, Command Center, and billing surfaces. This sprint is source-only and does not introduce a new onboarding architecture.

## B. Problems fixed

- Email verification now gives a clear localized next step to sign in and continue to `/get-started`.
- The verified state records `email_verified` through the existing consent-gated analytics path.
- Empty Command Center state presents one primary first action: add a real customer.
- Empty reusable workspace panels use localized “start with one real record” copy while retaining their existing forms and save actions.

## C. Files changed

- `v0-app/components/acquisition/acquisition-attribution.tsx`
- `v0-app/components/analytics-consent.tsx`
- `v0-app/components/auth/email-verification-panel.tsx`
- `v0-app/components/business/local-workspace.tsx`
- `v0-app/components/command-center/core-decision-surface.tsx`
- `v0-app/scripts/growth-activation-sprint-02-audit.mjs`

This report is the Sprint 02 documentation artifact. No other worktree or repository was changed.

## D. Verification flow before/after

Before, a verified user was sent to the existing login link without an explicit explanation of what to do next. After verification, the panel now states the next step in EN/HU/DE/FR/ES and preserves the existing `/login?callbackURL=%2Fget-started` destination. The static Sprint 02 audit confirms both the destination and localized next-step surface.

The source-level flow is verified. Full browser execution remains unproven because no safe authenticated browser session was available in this local task.

## E. First-login flow before/after

The existing auth flow and `/get-started` route remain the authority. The change adds guidance after email verification and gives the empty Command Center a single customer-first action. No new onboarding route, auth rule, session behavior, or owner privilege was added.

## F. First-value definition

The first-value path is the existing workspace capability: create a real customer from the first empty Command Center action, then continue with the existing quote/invoice/workspace flows. The repository already has `activation_completed` as the established cloud activation milestone after workspace records and Core evidence; therefore no duplicate `first_workspace_value` event was added. This preserves the existing analytics contract rather than inventing a second milestone.

## G. Empty-state changes

- Command Center Core now exposes one primary customer action instead of a competing list of five links.
- Shared empty workspace panels (customers, documents, and expenses) use localized first-record guidance and keep their existing forms/save controls.
- The invoice/quote pages retain their existing primary Save Document action; no duplicate empty-state CTA was introduced.

## H. Analytics event changes

`email_verified` was added to the existing event type and consent allowlist. The verification panel records it only when the verified state is reached, using the existing consent-gated `recordAnalyticsEvent` helper. Existing `registration_completed`, `activation_completed`, and `checkout_started` behavior was not changed. Event deduplication and consent behavior remain owned by the existing analytics implementation.

No provider call, external action, persistent write, or production analytics configuration change occurred.

## I. Mobile verification

The source was checked by the existing mobile audit, which passed. Rendered viewport verification at 390×844 and 412×915 could not be run because the local Next/browser runtime dependencies are unavailable. Both sizes therefore remain NOT PROVEN, not PASS claims.

## J. Checkout-open result

No authenticated production checkout-open attempt was made. The bounded no-payment checkout test is BLOCKED in this task because no safe authenticated runtime was available and cookies/tokens must not be extracted or bypassed. No payment, Stripe operation, or production request occurred.

## K. Risks and unresolved items

- TypeScript passes when run with the already-installed, matching-lockfile dependency tree from an isolated local worktree; no packages were installed or downloaded.
- `npm run build` is blocked by Windows `EPERM` creating `.next` in this worktree.
- `npm run cf:build` is blocked by the known Windows OpenNext/esbuild access error (`Cannot read directory "../..": Access is denied`; `open-next.config.ts` cannot be resolved).
- `npm run lint` is not defined in this package.
- Browser/mobile rendering and authenticated checkout remain unproven.
- The static audits do not substitute for a real authenticated end-to-end test.

## L. Rollback instructions

No commit has been created. To discard this Sprint 02 source-only experiment, restore only the listed Sprint 02 files in this isolated worktree to the base branch state; do not touch the main or Sprint 01 worktrees. If a future separately approved production release is made, record the prior UI/API Worker versions and roll back traffic independently to those exact versions. Preserve D1 schema and data in either case; do not drop tables, reverse migrations, or delete records.

## M. Sprint 03 recommendation

Provide an isolated dependency-complete Linux/CI or local browser environment, then rerun TypeScript, Next/OpenNext, 390×844 and 412×915 rendering, and one authenticated checkout-open test without payment. Only after those gates pass should this source-only change be considered for a separately approved commit/release review.

## Verification ledger

PASS: Sprint 02 static audit; Growth Engine; customer referral growth-loop; auth hydration; billing readiness; product readiness; UI mobile source audit; Referral V1; Referral V2; TypeScript; `git diff --check`.

BLOCKED: Next build, OpenNext build, rendered mobile verification, and authenticated checkout-open test for the environment/safety reasons above.

Production/D1/Stripe/provider/email/deployment/push side effects: none.
