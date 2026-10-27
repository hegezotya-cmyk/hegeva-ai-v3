# Message-to-Next-Step Design

**Date:** 2026-10-27  
**Status:** Approved for implementation  
**Repository base:** `v0-rebuild` at `3c17638506b027ed188028ac7ec6db291c4cfcf3`

## Intent

Make HEGEVA's existing customer-message quick start feel like one complete workflow: understand a message, prepare a reply, and create a follow-up task the owner can review.

## Current state

- First Wow classifies pasted text locally with visible-word patterns and prepares a localized reply. It hands the reply to Message Studio through short-lived session storage; the pasted message itself is not sent to an AI provider.
- Message Studio saves editable drafts and has an optional follow-up date, but saving does not create a linked Planner task.
- Governed email actions waiting for approval can be approved, but there is no safe way to discard an obsolete pending action.

## Goals

- Reuse First Wow and Message Studio; keep the existing five-language support.
- Carry the detected message category and prepared reply into Message Studio for owner review and editing.
- Let the owner choose a follow-up date. Save the reply draft and, when a date is selected, create or update one linked Planner task. Editing a draft must not create duplicate tasks.
- Add a **Discard** action for governed messages only while they are `awaiting-approval`, `not-sent`, and `not-executed`. Require an in-product confirmation and an authenticated owner endpoint.
- Record an audit transition, retain discarded records in a separate dismissed view, and keep them out of the normal active list.
- Keep all external sending behind the existing explicit approval flow.

## Non-goals

- No live AI classification, provider calls, or added AI-credit cost.
- No automatic email or message sending.
- No bulk deletion or automatic changes to existing workspace records.
- No changes to billing, pricing, or other onboarding steps.

## Approaches

1. **Extend First Wow and Message Studio — selected.** Reuse the existing local classifier, session handoff, composer, and Planner data. This is the smallest coherent path and avoids another tool or provider.
2. **Create a separate AI-backed inbox.** Could classify more flexibly, but adds provider cost, new data handling, and approval complexity.
3. **Add a separate message workflow module.** Keeps the current components untouched, but duplicates the composer and divides the customer workflow.

## Constraints and implementation calls

- Do not include pasted message content in analytics.
- The follow-up task is created only when the owner selects a date and saves the draft.
- Use the draft ID as the task link so edits update the same task.
- Discard is an audited, owner-only state transition limited to pending actions. Approved, ready-to-send, sending, sent, failed, or uncertain actions are not eligible.
- The discarded view preserves review history; it does not send, approve, or execute an action.
- Use existing workspace synchronization and its optimistic-concurrency behavior; reject stale state rather than overwrite newer records.

## Success criteria

- A new user can move from a pasted message to an editable reply draft and optional linked follow-up task without losing the detected category.
- Saving or editing a draft with a chosen date leaves exactly one matching Planner task.
- An eligible pending action can be discarded only by its owner; the audit state changes and the action appears under the dismissed view.
- Ineligible action states cannot be discarded, and no path sends a message automatically.
- Interface copy covers EN, HU, DE, FR, and ES.
