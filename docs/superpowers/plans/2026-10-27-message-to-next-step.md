# Message-to-Next-Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect HEGEVA's existing First Wow message handoff to one saved reply draft and at most one linked follow-up task, while giving owners a safe audited way to dismiss eligible pending actions.

**Architecture:** Keep the existing local classifier, session-storage handoff, Message Studio, workspace data hooks, and D1-backed external-action governance. Add an idempotent Planner-task helper and an owner-authenticated discard transition that archives only awaiting-approval actions; the UI exposes active and dismissed views.

**Tech Stack:** Next.js / React / TypeScript in `v0-app`; Cloudflare Worker JavaScript in `src/index.js`; D1 `workspace_data`; existing five-locale dictionaries and Node audit scripts.

**Spec:** `docs/superpowers/specs/2026-10-27-message-to-next-step-design.md`

## Global Constraints

- No live AI classification, provider calls, or added AI-credit cost.
- No automatic email or message sending.
- No bulk deletion or automatic changes to existing workspace records.
- Keep the existing five-language support: EN, HU, DE, FR, and ES.
- Do not include pasted message content in analytics.
- The follow-up task is created only when the owner selects a date and saves the draft.
- Discard is an audited, owner-only state transition limited to pending actions.
- Use existing workspace synchronization and optimistic-concurrency behavior; reject stale state rather than overwrite newer records.
- Do not deploy to production as part of implementation; prepare the branch and verification evidence for owner review.

## Review Focus

1. Anonymous or wrong-account discard attempt — must not update another user's messages.
2. Approved, ready-to-send, sending, sent, failed, or uncertain action — must never be discardable.
3. Stale workspace version during discard — must return conflict without overwriting a newer message list.
4. Saving or editing the same draft with a follow-up date — must leave exactly one linked Planner task.
5. Missing or later-cleared follow-up date — must not create a task; if one already exists, keep it unchanged so clearing a form field cannot silently delete Planner data.

---

### Task 1: Add the audited discard transition and owner endpoint

**Files:**
- Modify: `src/external-action-governance.js`
- Modify: `src/index.js`
- Test: `v0-app/scripts/external-actions-approval-audit.mjs`

**Interfaces:**
- Produces: `discardGovernedExternalAction(action, { actorHash, now })` returning `{ ok: true, idempotent, action }` or `{ ok: false, reason }`.
- Produces: `POST /api/external-actions/discard`, accepting `{ actionId }` and returning the updated audited action.
- The route is owner-authenticated, limits transition to `awaiting-approval`, `deliveryStatus: "not-sent"`, `executionStatus: "not-executed"`, and uses the existing updatedAt compare-and-swap write.

- [ ] **Step 1: Add failing governance assertions** for a valid pending action becoming `approvalState: "discarded"` with `workflowStatus: "discarded"` and one audit event; assert approved, ready, sent, executed, malformed, and anonymous actions are rejected without state change.
- [ ] **Step 2: Run `npm --prefix v0-app run audit:external-actions`** and confirm the new assertions fail before implementation.
- [ ] **Step 3: Implement `discardGovernedExternalAction(action, { actorHash, now })`** in `src/external-action-governance.js`. Preserve delivery/execution as not-sent/not-executed, record actor hash and timestamp, and accept the discarded state only as a terminal governance state.
- [ ] **Step 4: Add `POST /api/external-actions/discard`** in `src/index.js`, following the approve/ready routes for auth, payload validation, tenant scoping, no-store headers, and optimistic D1 updates; return 401 unauthenticated, 400 invalid ID, 404 unknown action, and 409 ineligible or stale action.
- [ ] **Step 5: Extend the approval audit** to cover successful owner discard, wrong-user isolation, repeated discard behavior, rejected states, and stale-write conflict.
- [ ] **Step 6: Run `npm --prefix v0-app run audit:external-actions`** and confirm PASS.
- [ ] **Step 7: Commit** as `feat: add audited pending action discard`.

### Task 2: Link a saved reply to one Planner follow-up

**Files:**
- Create: `v0-app/lib/message-follow-up.ts`
- Create: `v0-app/scripts/message-follow-up-test.mjs`
- Modify: `v0-app/scripts/message-next-step-audit.mjs`
- Modify: `v0-app/package.json`
- Modify: `v0-app/components/business/message-studio.tsx`

**Interfaces:**
- Produces: `upsertMessageFollowUpTask(tasks, draft)`, where a draft has `id`, `type`, optional `subject`, and optional `followUpAt`; returns a task list with at most one task whose `sourceId` equals the draft ID.
- A new task uses a deterministic ID derived from the draft ID, `priority: "medium"`, `done: false`, and a title from the draft subject or type.
- If the owner clears the date on an existing draft, leave its existing Planner task unchanged; the owner can manage it in Planner.

- [ ] **Step 1: Add failing helper assertions** for first creation, repeat save, edit/date update, preserving completion on edit, no task without a date, clearing a date without deleting a prior task, and two different drafts remaining separate.
- [ ] **Step 2: Run `node --experimental-strip-types scripts/message-follow-up-test.mjs`** and confirm the new assertions fail before implementation.
- [ ] **Step 3: Implement `upsertMessageFollowUpTask(tasks, draft)`** in `v0-app/lib/message-follow-up.ts`; match by `sourceId`, use a stable task ID, and update due/title without duplicating or reopening a completed task.
- [ ] **Step 4: Update `MessageStudio.saveDraft`** to assign the draft ID before state updates, save the draft, and upsert its Planner task only when a follow-up date is selected. Use the same draft ID for edits.
- [ ] **Step 5: Add `v0-app/scripts/message-next-step-audit.mjs`** assertions that First Wow's existing seed handoff reaches Message Studio and that analytics contain only input/result categories, never pasted text; include the new link and no-auto-send behavior.
- [ ] **Step 6: Add `audit:message-follow-up`** to `v0-app/package.json` to run both `message-follow-up-test.mjs` and `message-next-step-audit.mjs`; run `npm --prefix v0-app run audit:message-follow-up` and confirm PASS.
- [ ] **Step 7: Commit** as `feat: link message drafts to planner follow-ups`.

### Task 3: Add the dismissed-actions view and discard control

**Files:**
- Modify: `v0-app/components/business/message-studio.tsx`
- Modify: `v0-app/lib/i18n/business-modules-copy.ts`
- Modify: `v0-app/scripts/message-next-step-audit.mjs`

**Interfaces:**
- The Message Studio filter has `active` and `dismissed` views; active is the default.
- The **Discard** button appears only for governed actions in `awaiting-approval`.
- The button calls `POST /api/external-actions/discard`; on success, replace the local item with the returned action. It must not call approve, ready, or delivery endpoints.
- Discarded actions remain in workspace history and appear only in the dismissed view.

- [ ] **Step 1: Add failing UI audit assertions** for five-locale active/dismissed/discard/confirmation copy, active-by-default filtering, discard visibility only for awaiting-approval, and no discard control for other states.
- [ ] **Step 2: Run `npm --prefix v0-app run audit:message-follow-up`** and confirm the UI assertions fail before implementation.
- [ ] **Step 3: Add localized copy** for active/dismissed filters, discard action, confirmation text, discarded status, and result notice in EN, HU, DE, FR, and ES.
- [ ] **Step 4: Implement the active/dismissed filter** in `MessageStudio`; hide discarded records from the default active list while retaining a reviewable dismissed list.
- [ ] **Step 5: Implement the guarded discard button** for awaiting-approval records. Require an in-product confirmation, call the authenticated endpoint, update from its response, and show an error without changing local state if the request fails.
- [ ] **Step 6: Extend the audit** to verify the endpoint path, state guard, and localized copy; run `npm --prefix v0-app run audit:message-follow-up` and confirm PASS.
- [ ] **Step 7: Commit** as `feat: add safe dismissal for pending actions`.

### Task 4: Verify the branch for review

**Files:**
- Verify: `src/external-action-governance.js`
- Verify: `src/index.js`
- Verify: `v0-app/components/business/message-studio.tsx`
- Verify: `v0-app/lib/message-follow-up.ts`
- Verify: `v0-app/lib/i18n/business-modules-copy.ts`

- [ ] **Step 1: Run `npm --prefix v0-app run audit:external-actions`.** Expected: PASS.
- [ ] **Step 2: Run `npm --prefix v0-app run audit:message-follow-up`.** Expected: PASS.
- [ ] **Step 3: Run `cd v0-app && npx tsc --noEmit`.** Expected: exit code 0.
- [ ] **Step 4: Run `cd v0-app && npm run build`.** Expected: Next.js build succeeds.
- [ ] **Step 5: Review the diff** for accidental pasted-message analytics, any route that can send email from discard, or changes outside this feature.
- [ ] **Step 6: Report the branch, commits, audit/build results, and remaining production-release decision.** No production deploy occurs in this plan.
