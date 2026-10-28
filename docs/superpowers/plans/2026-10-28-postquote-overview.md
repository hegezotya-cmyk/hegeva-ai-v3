# Postquote Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show existing task, invoice and follow-up evidence beside a saved accepted/invoiced quote, without adding record creation or automatic transitions.

**Architecture:** A pure selector computes relationships and dates. The invoice page selects a quote by saved ID and current account identity; a lazily mounted panel reads planner/messages through existing workspace hooks. Existing invoice conversion and all record-writing workflows remain unchanged.

**Tech Stack:** Existing React/TypeScript, five-locale dictionary conventions, Node assertions and Playwright. No dependencies or migrations.

**Spec:** `docs/superpowers/specs/2026-10-28-postquote-overview-design.md` (approved).

## Global Constraints

- Read-only overview: no record setters, message preparation, external calls, inferred customer links or automatic transitions.
- Only saved quotes with status `accepted` or `invoiced` are eligible.
- Exact identifiers and complete one-click provenance establish relationships; names, totals and number prefixes never do.
- Legacy invoice notes are separate, unverified hints, never payment/work completion evidence.
- Five locales, honest loading/local/error states, immediate account isolation, mobile layout.
- Tests and real authenticated staging verification are mandatory before production. Temporary staging branch permissions need separate owner approval.

## Review Focus

1. A quote number `QUO-1` must never match `QUO-10`; duplicate or empty numbers cannot establish legacy hints.
2. An invoice explicitly linked to another quote must not be reassigned by a matching legacy note or shared provenance.
3. A completed task or approved/completed message is not proof of work completion or delivered email.
4. Old account records must disappear immediately on account change, before hook cleanup effects complete.
5. A failed or still-loading collection must not produce a verified “no records in the cloud” claim.

### Task 1: Evidence selector

**Files:** Create `v0-app/lib/postquote-overview.ts` and `v0-app/scripts/postquote-overview-test.mjs`.

**Interfaces:** Export `OverviewDocument={id:string;type:string;status?:string;number?:string;sourceId?:string;sourceQuoteId?:string;notes?:string}`, `OverviewTask={id:string;title?:string;due?:string;done?:boolean;sourceId?:string}`, `OverviewMessage={id:string;sourceId?:string;followUpAt?:string;workflowStatus?:string}`; `selectPostQuoteOverview(input:{quoteId:string;documents:OverviewDocument[];tasks:OverviewTask[];messages:OverviewMessage[];today:string}):{tasks:OverviewTask[];invoices:OverviewDocument[];legacyInvoices:OverviewDocument[];followups:OverviewMessage[];nextFollowup:OverviewMessage|null}|null`.

- [ ] Write Node assertions for ineligible/missing quote; exact `sourceId===quote.id` tasks/messages; full `one-click:<run>:quote` to `one-click:<run>:task` correspondence; explicit `sourceQuoteId` invoice; same valid one-click quote provenance inherited by an invoice; conflicting explicit linkage; multiple results; input immutability. Legacy tests require exact whole first-line `Created from quote <number>`, one uniquely numbered quote, no explicit conflicting origin; reject prefix, blank/duplicate numbers and arbitrary later-line matches. Assert legacy candidates never enter verified invoices.
- [ ] Run `node --experimental-strip-types scripts/postquote-overview-test.mjs` from `v0-app`; expected RED because module is absent.
- [ ] Implement selector. Validate runtime string fields before comparisons. Parse complete one-click markers with nonempty UUID-compatible run tokens, never substring matches. Sort displayed arrays deterministically by date then ID. Follow-up dates come only from linked messages’ `followUpAt`: strict real YYYY-MM-DD dates; earliest due/overdue first, otherwise nearest future; invalid/missing dates excluded from `nextFollowup`. Retain original message status without inventing sent/delivered flags.
- [ ] Add date tests for missing/impossible dates, leap days, today, overdue and future candidates, stable ties and local-date boundary inputs. Rerun to PASS; commit selector/tests only.

### Task 2: Lazy read-only panel and invoice-page integration

**Files:** Create `v0-app/components/business/postquote-overview.tsx`, `v0-app/lib/i18n/postquote-overview-copy.ts`, `v0-app/scripts/postquote-overview-browser-test.cjs`; modify `v0-app/app/business/invoices/page.tsx`.

**Interfaces:** Panel consumes Task 1 types/selector and props `{quoteId:string;documents:OverviewDocument[];documentSyncState:WorkspaceSyncState;identity:string|null;onClose:()=>void}`. It reads `planner` and `messages` via existing `useWorkspaceData` without destructuring setters. It derives the saved quote from documents; it never receives or displays unsaved editor values. Source states are displayed independently; no final absence claim until that collection is ready. Reuse existing local-calendar-day helper for today, refreshed on day change.

- [ ] Write Playwright tests with controlled auth/workspace fixtures: only accepted/invoiced saved quotes offer overview; first open lazily loads planner/messages; matching evidence and multiple rows appear; misleading names/prefixes/legacy notes do not create verified links; real invoice/draft/paid and task/message statuses stay distinct; next follow-up ordering is correct. Assert opening, closing and repeat opening generate no write requests. Test loading, one failed collection, local mode, different account reusing the same quote ID, five locales, long text, keyboard open/close/focus return and 390/1440px overflow. Confirm RED on absent controls.
- [ ] Add one overview action to eligible saved quote rows and a selected `{quoteId,identity}` state. Render only when the selection identity matches the current identity and document loading is finished; key the child by identity+quote ID. Reset selection on account change, deletion or loss of eligibility. Remounting the keyed child creates fresh task/message hook state. Do not restructure existing invoice form or conversion actions.
- [ ] Build labelled panel sections for linked tasks, verified invoices, clearly separated unverified legacy references and follow-up records/next date. Link to existing `/business/planner` and `/business/messages`; invoice rows may use an existing safe record-load callback only if it is read-only, otherwise show reference and module navigation without claiming a deep link. Close restores focus to the originating action. Add translated empty/local/loading/error/status copy in en/hu/de/fr/es and a note explaining that message state does not establish delivery.
- [ ] Run browser tests and Task 1 suite to PASS; inspect mobile/desktop output; run existing quote-workflow/business-intelligence regressions and TypeScript. Commit only feature/test files, preserving the pre-existing generated `tsconfig.tsbuildinfo` change and output evidence.

### Task 3: Release gate, independent review and staging proof

**Files:** Modify `v0-app/package.json` and `.github/workflows/main.yml`; create `v0-app/scripts/postquote-overview-audit.mjs` and verification notes under `docs/audits/` after results exist.

- [ ] Add `test:postquote-overview` for Node logic/safety tests and `test:postquote-overview-browser` for the browser suite. Include logic/safety checks in `audit:roadmap` and as an explicit main build-check step.
- [ ] Safety audit rejects transport, record setters, message preparation and telemetry imports in the panel/selector. Run `npm run test:postquote-overview`, quote-workflow, business-intelligence and one-click regression audits, `npx tsc --noEmit --incremental false`, then root `npm run release:check`. Expected PASS; record environment failures truthfully.
- [ ] Request one fresh read-only whole-branch review against the approved spec. Fix material findings with reproduced failing tests, then green regression suite; do not silently expand scope.
- [ ] Prepare a reviewable PR against current `v0-rebuild`. Run Linux CI on its exact head. Obtain separate permission if staging needs a temporary feature-branch policy; run staging UI-only deployment/smoke, restore the policy, and verify the same head in a real signed-in browser with synthetic records. Test linked data after reload, legacy separation, navigation, no writes from overview, mobile/desktop and cloud/local/error treatment where safely testable. Do not send messages or modify real production records.
- [ ] Report exact checks and limitations. Merge/deploy only with owner authorization and successful authenticated staging proof; never treat “continue” as a staging waiver. After any authorized production release, verify production CI/deploy/smoke and restore temporary permissions.

## Execution preparation and self-review

Use the existing linked worktree on a new feature branch from current `origin/v0-rebuild`, carrying the approved spec and this plan. Read executing-plans and test-driven-development, preserve existing generated/untracked files, and record progress in a plan-specific ignored ledger. The previous feature’s deployment authorization and temporary staging policy permission are not reused for this feature.

Self-review: each spec section maps to Tasks 1–3; all five Review Focus cases have explicit selector/browser assertions; interfaces share the exact field names above. Existing conversion remains untouched, legacy references are never promoted to verified status, and no new creation flow or API is introduced. Continue with the previously chosen inline execution method after the owner reviews this plan.
