# Customer-Referral Growth Loop — Design Specification

**Status:** Design only; this document does not implement or release the flow.

**Repository baseline inspected:** branch `business-check-account-page-spec-20260927`, HEAD `70e4ff517ab95c0d6754f2aa9678d105cd843205`.

## Purpose and boundaries

This specification describes the smallest organic customer-to-customer loop that can support HEGEVA's first 50 paying small-business customers:

`public Challenge entry → authenticated customer's private Business Check → referral-link control → visitor → signup → first-touch attribution`.

The loop is free-first. It does not include paid advertising, paid upgrades, discounts, cash rewards, automatic payouts, creator commissions, email outreach, or Stripe changes. It must not turn a fictional demo into a real-data experience or place private workspace information in a public URL.

The Account-page Business Check relocation is an existing, separate change. This document consumes that authenticated surface; it does not redefine its deterministic score, share/revoke behavior, or privacy contract.

## Existing implementation facts

### Public Challenge and homepage

- The public demo route is `v0-app/app/challenge/page.tsx` and renders `SixtySecondChallenge`.
- The demo contains the visible label `DEMO BUSINESS — FICTIONAL DATA`, hard-coded fictional signals, and no live business-data fetch.
- The homepage is `v0-app/app/page.tsx`. It renders `GrowthLoopPromo`, which currently owns the localized Challenge entry (`/challenge`) and the `GIVE HEGEVA 60 SECONDS` copy.
- `v0-app/scripts/growth-engine-v1-audit.mjs` currently reads `app/page.tsx` itself and requires the literal `/challenge` link and `GIVE HEGEVA 60 SECONDS` string in that file. The audit fails at the current baseline because those literals live in the imported component. The failure reproduces independently of the Account-page relocation and must not be “fixed” by weakening or deleting the assertion.

### Authenticated source of a customer's score/share action

- `v0-app/app/account/page.tsx` is the authenticated Account surface and now mounts `WorkspaceBusinessCheck` after its existing session gate.
- `v0-app/components/growth/workspace-business-check.tsx` reads the signed-in user's cloud-synchronised workspace data through `useWorkspaceData`, uses `business-score.ts`, and renders aggregate score/deduction output. It ignores local/checking/saving/error sync states for scoring.
- Its existing Business Score share/revoke controls create or revoke a redacted, short-lived score share. That share token is not a referral code and must remain a separate contract.
- `v0-app/components/growth/referral-review.tsx` is the existing authenticated referral control. It can create one active opaque referral code, show its absolute URL, copy it, revoke it, and show aggregate attribution/reward-review status. It must remain adjacent to, not merged into, the private score-share control.

### Referral routes and server contracts

- `v0-app/app/r/[code]/page.tsx` accepts only `^[A-Za-z0-9_-]{1,32}$` and redirects valid codes to `/challenge?ref=<encoded-code>`; invalid input redirects generically to `/challenge`. It does not reveal code ownership, user identity, or workspace data.
- `v0-app/lib/conversion-tracking.ts` captures `ref` only when analytics consent is granted, stores a short-lived one-shot referral context in session storage, and calls `POST /api/referrals/touch` with the code. It rejects unsafe/expired browser values.
- `POST /api/referrals/touch` validates the opaque code server-side, hashes it for lookup, records a privacy-safe visit touch, and returns no body. Invalid or revoked codes fail without identifying details.
- `v0-app/components/auth/auth-panel.tsx` calls `captureReferralAttribution()` after successful signup, sends `POST /api/referrals/attribute` with the captured code, emits the existing aggregate `referral_signup` analytics event, and clears the one-shot browser context.
- `POST /api/referrals/attribute` requires the authenticated new user. The server rejects invalid/revoked codes, self-referrals, expired touch windows, and duplicate referred users. A successful attribution is pending and does not imply payment, activation, reward eligibility, or payout.
- `GET /api/referrals/attributions` is authenticated and owner-scoped. Its response is limited to aggregate-safe attribution fields already used by the private panel.
- Existing activation/reward-review routes and the V2 reward ledger are not part of this free-first loop. No new reward transition is specified here.

### Existing D1 data model

Migration `migrations/0024_referrals.sql` already defines:

- `referral_codes`: one active code per owner, hashed code, active/revoked status and timestamps;
- `referral_touches`: code-linked visit/challenge/share touch, opaque touch hash, timestamp, consent state and metadata version;
- `referral_attributions`: one attribution per referred user, first/last touch timestamps and pending/rejected state.

Migration `migrations/0031_referral_rewards.sql` defines the later reward ledger, including a reserved `EXECUTED` state. This specification neither uses nor changes reward eligibility, execution, entitlement, or payout semantics.

## Proposed customer flow

1. **Homepage entry.** The homepage shows a localized, truthful link to the already-fictional `/challenge`. The entry must remain visibly demo-oriented and retain the existing trust language. The minimal implementation may make the existing `GrowthLoopPromo` entry discoverable to the source audit by placing the explicit link/copy contract in the page-level source or by an equivalent source-level composition that leaves the audit assertion unchanged. It must not duplicate competing CTAs or imply that demo data is a customer's real data.
2. **Public demo.** The visitor can run the fictional Challenge without authentication, payment, or a provider call. The demo never reads or displays the referrer's Business Check.
3. **Private customer surface.** An authenticated customer opens `/account`, views their own cloud-backed Business Check, and separately chooses the existing referral-link control. The referral control creates/replaces the owner's active opaque code. No score, deduction, workspace ID, customer data, invoice data, or raw payload is copied into the referral URL.
4. **Visitor link.** The link is the canonical public origin plus `/r/<opaque-code>`. The repository's server canonical-host helper uses `PUBLIC_APP_URL` only when it is an HTTPS URL and otherwise falls back to `https://hegevaai.co.uk`; accepted production origins include `https://hegevaai.co.uk` and `https://www.hegevaai.co.uk`. `test.example` is test-only and is never a production host.
5. **Visit/touch.** `/r/<code>` validates syntax and redirects generically to the fictional Challenge with `ref`. The client capture helper submits the code to `/api/referrals/touch`; server lookup uses the hash and active status. Touches are privacy-safe and may be recorded with essential consent state; no raw IP, email, name, workspace ID, customer data, or code is returned publicly.
6. **Signup.** The visitor may continue to registration from the Challenge or existing signup CTA. Successful registration remains subject to existing email-verification/session behavior. Referral context is one-shot and short-lived in browser session storage; it is not authoritative.
7. **Attribution.** After the server-authenticated signup, the existing `/api/referrals/attribute` call establishes at most one first-touch attribution for that referred user. Attribution is idempotent. It does not grant a reward, credit, discount, paid entitlement, or upgrade.
8. **Customer view.** The referrer can later see only the existing aggregate-safe attribution/review surface on Account. Public visitors see no attribution status, score, owner identity, or workspace information.

## Attribution and edge-case rules

The following are existing behaviors and are preserved, not newly invented:

- The active code is the only code eligible for a new touch; revocation makes lookup fail generically.
- The current server window is 30 days (`30 * 86400000`) from the recorded touch. This is an implementation fact, not a new business policy; changing it requires a separate owner decision.
- First touch is authoritative for the attribution row. Later touches may be recorded, but the current `attributeReferral` implementation only creates one attribution per referred user and does not replace the existing one.
- A referred user can have only one attribution because `referredUserId` is unique and the server checks for an existing row before insert.
- Self-referrals are rejected when the referral-code owner equals the authenticated referred user.
- Malformed, unknown, revoked, or expired referrals use generic failure behavior. They must not disclose whether a code existed or who owns it.
- Duplicate attribution attempts return an idempotent duplicate result and do not create a second row.
- There is no referral-specific eligibility, paid conversion, reward amount, attribution override, or payout rule in this scope. Those remain unresolved owner decisions and must not be inferred from the V2 reward schema.

## Data and privacy boundaries

Publicly observable referral responses may contain only generic redirect/error behavior. Authenticated owner responses may contain only the existing aggregate counts/statuses and safe timestamps already in the UI contract.

Never expose in a public URL, public HTML, referral API response, redirect, analytics payload, or copied share text:

- Business Score numbers/deductions or raw evidence;
- customer names/contact details;
- invoice, quote, task, workspace, user, attribution, payment, or Stripe IDs;
- raw referral code hashes, session cookies, credentials, or secrets;
- entitlement, billing, Core, or reward internals.

The referral code itself is opaque and short-lived by server status/window, but it is still a bearer value. Revoke must invalidate it server-side. No client-only storage value is authoritative.

## Localization and analytics

All new or moved visible copy must follow the existing locale map for `en`, `hu`, `de`, `fr`, and `es`, including homepage entry, referral-link creation/copy/revoke, invalid/unavailable states, and signup continuation text. Dynamic customer/workspace data is never translated or copied into public output.

Consent-gated analytics may retain the existing aggregate events `referral_visit`, `referral_signup`, and `referral_link_copy`. Event payloads must remain free of raw referral codes, names, emails, IDs, workspace data, score values, and payment data. Essential touch recording may continue without analytics consent according to the existing server contract; analytics denial must clear referral browser context as it does today.

## Error and unavailable states

- Invalid `/r/<code>`: generic redirect to `/challenge`, no reason disclosure.
- Failed touch: no public error detail; the visitor can still use the fictional Challenge.
- Signup without valid referral context: ordinary signup, no attribution.
- Expired/revoked/self referral: generic attribution failure, no account or owner disclosure.
- Duplicate signup attribution: idempotent no-op.
- Referral API unavailable: existing Account panel shows its localized unavailable state; the Business Check and normal signup remain usable.
- No automatic reward or external action is triggered by any state above.

## Isolated acceptance tests

Use local mocks/isolated D1 only; do not query production or create real customer data.

1. Source audit proves homepage Challenge entry remains present and localized, and the existing Growth Engine assertion is unchanged.
2. Public `/challenge` renders fictional labels/data and performs no workspace fetch.
3. Authenticated Account Business Check and referral control are mounted only after the existing session gate.
4. Referral link generation returns the canonical application origin plus `/r/<opaque-code>`; no `test.example` or private fields appear.
5. Valid `/r/<code>` redirects to `/challenge?ref=<encoded-safe-code>`; malformed/revoked/unknown values redirect generically.
6. A valid touch creates one isolated `referral_touches` row with no raw IP/email/name/workspace data.
7. Consent denied prevents analytics referral events while preserving safe essential touch behavior and clearing browser referral context.
8. Successful synthetic signup performs one authenticated attribution; replay is idempotent.
9. A second referral code cannot replace the first attribution; a self-referral is rejected; an expired touch is rejected.
10. Owner list responses contain only aggregate-safe fields; unauthenticated access is `401`; another owner cannot read the list.
11. No test path creates `EXECUTED` reward state, payout, credit, discount, email, Stripe operation, provider call, or persistent production write.
12. EN/HU/DE/FR/ES source assertions cover all visible referral/homepage copy.

## Known blockers and unresolved owner decisions

- The current Growth Engine audit fails at baseline because it expects homepage literals in `app/page.tsx` while the existing localized entry lives in `GrowthLoopPromo`. The implementation plan must address this truthful source-composition mismatch without weakening the assertion or removing the demo.
- Local TypeScript/Next verification was previously blocked by missing dependencies and npm-cache EPERM; this documentation task does not repair that environment.
- Production referral code generation, touch recording, signup attribution, and the canonical live URL have not been proven in this repository-only inspection. No production claim is made.
- The exact canonical-host source fallback is verified as `https://hegevaai.co.uk`, with `https://www.hegevaai.co.uk` accepted for origin checks; deployment routing remains a separate release concern.
- Owner decisions still required before implementation: whether to keep the current 30-day attribution window; whether later touches should be retained only as audit history or surfaced as aggregate counts; what, if any, future paid qualification means; and whether the referral CTA remains separate from the score-share CTA (recommended: keep them separate to prevent privacy/contract mixing).

## Scope and release safety

This specification proposes no source, test, dependency, schema, migration, Worker, configuration, Stripe, provider, quota, secret, email, or production change. Implementation, if approved later, should reuse migrations 0024/0031 and current API/UI contracts, add only focused tests/source changes, and undergo a separate release review. No referral attribution or reward behavior is proven by this design document.
