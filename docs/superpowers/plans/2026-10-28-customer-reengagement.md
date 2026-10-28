# Customer Reengagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add the approved “Újra megkeresendő” customer view with evidence-based ranking and an editable, copy-only message preview.

**Architecture:** Extend the existing `LocalWorkspace` customer form and filters. A pure selector owns calendar-date validation and ranking; a small customer-only preview component owns ephemeral text and clipboard feedback. Keep the existing workspace data contract.

**Tech Stack:** React, TypeScript, existing workspace hook, Node assertions and Playwright; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-28-customer-reengagement-design.md` (approved).

## Global Constraints

- Active customers only; exclude leads and paused customers.
- Inactivity threshold is at least 90 calendar days; a future follow-up suppresses reengagement.
- Never infer contact from `createdAt` or `updatedAt`. The optional explicit field is `lastContactAt: string` in YYYY-MM-DD format.
- Preview neither sends nor saves messages and never completes follow-ups or changes contact dates.
- Preserve five locales (en, hu, de, fr, es), mobile usability and existing sync feedback.
- No migrations, external providers, auth changes, new telemetry or production deployment in implementation.

## Review Focus

1. Local date near midnight and DST boundaries must not change 90-day results.
2. Missing, impossible or future contact dates must not produce invented inactivity.
3. Workspace/account changes must immediately hide old preview contents, including before cleanup effects run.
4. Existing customers must retain the contact field through unrelated edits and save/reload.
5. Clipboard rejection must provide visible fallback without claiming success.

### Task 1: Pure date validation and ranking

**Files:** Create `v0-app/lib/customer-reengagement.ts` and `v0-app/scripts/customer-reengagement-test.mjs`.

**Interfaces:** Export `ReengagementCustomer = {id:string;title:string;customerStatus?:string;followUp?:string;lastContactAt?:string}`; `localCalendarDay(date:Date):string`; `isValidContactDate(value:string,today:string):boolean`; `selectCustomerReengagement(customers:ReengagementCustomer[],today:string):Array<{customer:ReengagementCustomer;reason:"follow-up"|"inactive";date:string}>`.

- [x] Write Node assertion tests importing the TypeScript module, following existing `--experimental-strip-types` script usage. Assert 89 days excluded, 90 and 91 included; due/today follow-ups precede inactivity; future follow-up suppresses even an old contact; paused/lead/missing status excluded; impossible/leap-day/future/missing dates handled; IDs break date ties deterministically; input records remain unchanged. Assert calendar dates around DST and midnight via local date components and integer day arithmetic.
- [x] Run `node --experimental-strip-types scripts/customer-reengagement-test.mjs` from `v0-app`; confirm failure is the missing module.
- [x] Implement strict calendar validation (round-trip components), convert validated dates to UTC day ordinals only for subtraction, and sort fresh result arrays. Use local calendar components for today, never UTC slicing.
- [x] Rerun tests and confirm PASS; commit only task files.

### Task 2: Customer form, filtered results and preview

**Files:** Modify `v0-app/components/business/local-workspace.tsx`; create `v0-app/components/business/customer-reengagement-preview.tsx`, `v0-app/lib/i18n/customer-reengagement-copy.ts`, and `v0-app/scripts/customer-reengagement-browser-test.cjs`.

**Interfaces:** Use Task 1 exports. Export a preview component accepting `{customer:{id:string;title:string};identity:string;locale:Locale;onClose:()=>void}` using the existing locale type. It receives no record setter, sender or persistence function. Store preview selection with its workspace identity and render only when that identity matches the current identity and loading has finished.

- [x] Write Playwright coverage against a local app with controlled workspace/auth responses: current filters still work; new filter searches and orders eligible records; render reason/date/missing-contact labels; exclude paused/leads/future follow-up; invalid form dates rejected; contact field preserved through edit, PUT and reload; preview edits/copy cause no workspace PUT or send request; copy rejection shows fallback; workspace switch hides preview; deletion closes the selected preview. Confirm tests fail on absent controls.
- [x] Add optional `lastContactAt` to `RecordItem`, form load/reset/save and explicit date validation with localized feedback. Preserve unrelated record fields during edits. Leave customer status and follow-up behavior intact.
- [x] Add third filter with wrapping buttons and accessible pressed state. Combine existing search with selector results without reordering the original array. Show localized criterion, evidence, missing-date and honest no-result copy; checking state must not show a final empty conclusion. Retain local/error/saving status.
- [x] Implement inline labelled editable preview, close action and copy button with success/error feedback. Text is neutral, refers only to the customer name, and is labelled not sent/not saved to Messages. No contact-address inference, persistence or analytics. Clear selection on identity change and deletion; guard async clipboard completion after identity change/unmount.
- [x] Supply all new labels and neutral templates in en/hu/de/fr/es. Verify long names, keyboard operation, 390px and 1440px layouts, and no horizontal overflow. Preview state has no record-writing capability.
- [x] Run Task 1 and browser tests; inspect changed files and commit only feature/test files, preserving the existing `tsconfig.tsbuildinfo` modification.

### Task 3: Release verification and review

**Files:** Modify `v0-app/package.json`; create `v0-app/scripts/customer-reengagement-audit.mjs`.

- [ ] Add `test:customer-reengagement` for Task 1 and an audit checking that the isolated preview has no network/persistence/telemetry imports. Add the test/audit to the existing roadmap verification chain so CI exercises them.
- [ ] Run new tests, customer/quote workflow regressions, `npx tsc --noEmit --incremental false`, then `npm run release:check` from repository root. Record actual failures separately from environment limitations; do not label skipped checks PASS.
- [ ] Review the full diff against the approved spec, including all five Review Focus cases. Confirm optional contact data survives the existing authenticated workspace API without schema changes.
- [ ] Run normal Next and Cloudflare builds through the existing checks. Use the existing staging UI-only process for authenticated save/reload and mobile/desktop verification when available; no API deployment, migration or production release.
- [ ] Summarize exact changes, tests and any remaining staging requirement. Request production approval only after a concrete tested release candidate exists.

## Execution preparation

Before implementation, read applicable repository instructions and the executing-plans, test-driven-development and using-git-worktrees skills. Reuse the attached checkout where suitable, preserve the pre-existing generated-file change, and base the implementation branch on the latest verified `origin/v0-rebuild`. Carry the approved spec and this plan forward without pushing directly to the production branch.

## Execution result
Tasks 1 and 2 complete. Task 3 local checks and fresh code review complete: final release:check PASS, browser suite PASS, review regressions 3/3 PASS, actual CSP audit and negative probe PASS. Authenticated staging and remote CI remain release gates after the integration choice; no remote branch or environment changed.
