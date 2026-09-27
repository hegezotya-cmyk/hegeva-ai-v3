# Authenticated Business Check on Account — Design Specification

**Status:** Design only; implementation is not included in this document.

**Baseline inspected:** `referral-v2-safe-ledger-20260927` at `3bf5c43c5651fa3da3d1bf4b8ac2f63e4316c535`.

## Purpose

Expose a truthful, deterministic HEGEVA Business Check to an authenticated owner on the existing Account page. The result must use only the signed-in user's own cloud-synchronised workspace data, explain every deduction, and remain read-only.

## Scope

In scope:

- Move the existing authenticated `WorkspaceBusinessCheck` presentation from the public Challenge surface to the authenticated Account page.
- Reuse the existing `useWorkspaceData` hooks and `business-score.ts` engine.
- Preserve the existing deterministic scoring rules and minimum of two valid observed categories.
- Show exact calculation details, observed categories, deductions, and evidence-based next-step links.
- Preserve EN/HU/DE/FR/ES copy and existing consent-gated aggregate analytics.
- Preserve the existing Business Score share/revoke behavior without expanding it.

Out of scope:

- Any new API route, D1 table, migration, persistent write, provider call, email, payment, referral, reward, or external action.
- Any change to Core decision logic, Assistant behavior, quotas, Stripe, auth configuration, secrets, or production traffic.
- Any new benchmark, prediction, fabricated score, invented record, or synthetic production data.

## Public/demo boundary

`v0-app/app/challenge/page.tsx` remains the public 60-Second Challenge. It uses `v0-app/components/growth/sixty-second-challenge.tsx`, hard-coded demo profiles, and `DEMO_SCORE_SIGNALS`. The visible label `DEMO BUSINESS — FICTIONAL DATA` must remain present.

The public Challenge must not read authenticated workspace data and must not display a real user's score. After this design is implemented, the Challenge will no longer mount `WorkspaceBusinessCheck`.

The separate `/demo` experience remains fictional and isolated from real records.

## Authenticated Account placement

The existing `WorkspaceBusinessCheck` component will be rendered from `v0-app/app/account/page.tsx` within the authenticated Account layout. The component already returns no output without an authenticated session; the Account page must preserve its existing authentication/loading behavior.

No new route is required. The Account page becomes the single authenticated entry point for the Business Check.

## Data flow and isolation

The component continues to use `useWorkspaceData` for the existing typed workspace reads:

- `customers`
- `invoice_documents`
- `planner`

Each request uses the current authenticated session and `credentials: "include"`. The server-side `/api/workspace/:type` path authenticates the request and queries `workspace_data` with the authenticated `userId` and requested `dataType`.

Only a source whose sync state is exactly `cloud` is passed to the score mapper. `local`, `checking`, `saving`, and `error` states are treated as unavailable for scoring. Browser-local cached records must never produce an authenticated score.

The component performs no workspace write. It must not call `setItems`, PUT workspace records, or bypass the typed workspace hook with a direct read.

## Deterministic scoring contract

The existing `v0-app/lib/business-score.ts` engine remains authoritative for this presentation.

Supported categories are:

- `payments`
- `sales`
- `customers`
- `admin`

Current evidence mappings are:

- **Payments:** valid invoice records with valid due dates.
- **Sales:** valid quote records with valid due dates.
- **Customers:** customer records with valid follow-up dates.
- **Admin:** Planner tasks with valid due dates.

The mapper observes only categories supported by valid records. The overall score is the rounded average of the observed category scores; unobserved categories are not treated as zero.

The minimum evidence rule is strict:

- Two or more supported categories: render a score.
- Zero or one supported category: render no headline score and show the incomplete-data state.
- Invalid dates, malformed records, or unavailable cloud reads must not manufacture coverage or deductions.

The UI must show the applicable fixed deductions and points behind the displayed score. It must not expose record identifiers, customer names, document references, raw workspace payloads, or private operational details.

## Insufficient and unavailable data states

The Account page must distinguish the following user-facing states:

1. **Loading:** authenticated cloud reads are still checking.
2. **Unavailable:** one or more required cloud reads failed or are not available; do not fall back to browser data.
3. **Incomplete:** cloud reads succeeded, but fewer than two supported categories contain valid evidence.
4. **Ready:** at least two supported categories contain valid evidence; show score, deductions, observed categories, and next steps.

No state may display a reassuring default such as `100/100` when evidence is absent.

## Evidence-based next steps

Reuse the existing category links:

- customer evidence → `/business/customers`
- invoice/quote evidence → `/business/invoices`
- Planner evidence → the existing Planner destination

Next steps are navigational/read-only guidance only. They must not create records, send messages, execute Core actions, or invoke an AI provider.

## Privacy boundary

The Account UI may display aggregate category names, score bands/numbers, deduction labels, deduction points, and generic navigation links.

It must not display or emit:

- workspace IDs;
- user IDs;
- customer names or contact details;
- invoice, quote, task, or document IDs;
- raw customer or document payloads;
- raw billing/payment identifiers;
- secrets, credentials, cookies, or tokens.

The score module may use dates and amounts internally to evaluate its fixed rules, but the rendered Business Check must expose only the resulting aggregate evidence and deductions.

## Localization

All new or moved visible copy must remain available through the existing localization pattern for:

- English (`en`)
- Hungarian (`hu`)
- German (`de`)
- French (`fr`)
- Spanish (`es`)

The existing Business Check copy is the source of truth for loading, unavailable, incomplete, calculation, category, deduction, privacy-boundary, share, revoke, and next-step labels. No English fallback should be introduced for these strings when a supported locale is selected.

## Analytics and consent

Preserve the existing consent boundary and event allowlist. The authenticated result may continue emitting the existing `own_business_result` event only after analytics consent, with aggregate values such as score band and observed-category count.

No analytics event may contain names, IDs, workspace identifiers, raw records, raw amounts, referral data, or private Core payloads. No GA4 measurement ID, consent default, consent mode, or analytics configuration changes are part of this design.

## Existing share behavior

The current Business Score share/revoke controls remain unchanged in this phase. Server-side recomputation and existing redaction/privacy rules remain authoritative. This specification does not add referral attribution, creator links, rewards, or sharing features.

## Known limitations that must remain explicit

- The current score uses a UTC ISO-date boundary (`YYYY-MM-DD` from UTC).
- Quote follow-up is inferred from a quote being past its recorded due date; no separate follow-up field is currently used by this mapper.
- Returning-customer inactivity and previous-job history are not derived by the current workspace mapper.
- The actual contents, row counts, and data quality of any production workspace were not inspected for this design and must not be claimed as verified.
- Core supports broader workspace signals, but this Business Check uses only the four mappings listed above; it must not silently expand into a Core redesign.

## Acceptance tests

The implementation review must prove:

1. Public `/challenge` remains fictional and visibly labelled.
2. The authenticated Account page renders the Business Check only for an authenticated session.
3. Unauthenticated workspace reads return `401` and cannot produce a score.
4. Workspace reads remain bound to the authenticated user; a different user's data cannot be used.
5. Every valid two-category combination produces a deterministic score.
6. One-category, empty, malformed, or unavailable data produces an incomplete/unavailable state with no headline score.
7. Local-browser fallback data cannot produce an authenticated score.
8. Deductions and aggregate calculations are stable for the same inputs and date.
9. Score output and rendered UI contain no names, IDs, raw documents, workspace IDs, or private payloads.
10. All visible Business Check strings exist for EN/HU/DE/FR/ES.
11. Analytics is emitted only with consent and contains aggregate, non-personal values.
12. No workspace mutation, D1 write, provider call, email, payment, or external action occurs.
13. Existing share/revoke behavior remains unchanged and redacted.
14. UTC date-boundary behavior and the documented quote/customer limitations are covered by focused tests or audit assertions.

## Release and rollback safety

This design requires no schema or migration change. The future implementation must be source-only, locally audited, and separately approved before any deployment.

If the Account integration regresses authentication, privacy, localization, or existing Challenge behavior, remove the Account mount and restore the previous component placement from the prior source revision. Do not modify production D1, traffic, flags, or unrelated systems as a rollback mechanism.

## Files expected to be reviewed during implementation

- `v0-app/app/account/page.tsx`
- `v0-app/app/challenge/page.tsx`
- `v0-app/components/growth/workspace-business-check.tsx`
- `v0-app/components/growth/sixty-second-challenge.tsx`
- `v0-app/lib/business-score.ts`
- `v0-app/lib/use-workspace-data.ts`
- `src/index.js`
- focused Business Score, privacy, localization, hydration, and build audits

No file in this list is changed by this design-spec task.
