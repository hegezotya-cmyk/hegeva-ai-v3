# Growth Loop V1 Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an authenticated, transparent Business Check that calculates a HEGEVA Business Score only from the signed-in workspace's cloud-synchronised records.

**Architecture:** Keep `/challenge` as the public fictional demo. Render a separate authenticated panel only after workspace records for customers, invoice documents and planner tasks have loaded from the existing user-scoped API. Extend the pure score module with a deterministic workspace mapper and show an incomplete-data state rather than an unsupported score.

**Tech Stack:** Next.js client components, TypeScript, existing `useWorkspaceData`, existing i18n provider, Node strip-types audit.

**Spec:** In-chat approved HEGEVA Growth Loop V1 Phase 1 specification, 2026-09-22.

## Global Constraints

- Public Challenge remains fictional and visibly labelled.
- Own-data score reads no data outside the authenticated active workspace.
- No D1 migration, provider call, email, external action, automatic publishing, deployment, commit or push.
- No change to Stripe, Assistant, quotas, AI providers, authentication configuration, Core behaviour or secrets.
- All visible Phase 1 copy supports EN/HU/DE/FR/ES.
- Incomplete coverage produces no headline score.

## Review Focus

- Cloud load failure must not fall back to a local-browser score for an authenticated user.
- A workspace with no eligible records must show incomplete data, not 100/100.
- Invalid dates and malformed monetary lines must not create deductions.
- Score output must contain aggregate evidence only, never customer or document identity.
- Public demo output must remain independent of authenticated data.

### Task 1: Deterministic workspace score mapper

**Files:**
- Modify: `v0-app/lib/business-score.ts`
- Create: `v0-app/scripts/business-score-phase1-audit.mjs`

- [ ] Add a failing executable audit for eligible records, malformed records and incomplete coverage.
- [ ] Run it with `node --experimental-strip-types scripts/business-score-phase1-audit.mjs`; expect missing workspace mapper failure.
- [ ] Add a pure mapper that derives only aggregate signals from invoices, quotes, customer follow-ups and planner tasks.
- [ ] Re-run the audit; expect PASS.

### Task 2: Authenticated workspace presentation

**Files:**
- Create: `v0-app/components/growth/workspace-business-check.tsx`
- Modify: `v0-app/components/growth/sixty-second-challenge.tsx`
- Modify: `v0-app/scripts/growth-engine-v1-audit.mjs`

- [ ] Add a failing privacy/localisation audit for cloud-only score rendering and five locale maps.
- [ ] Run the audit; expect failure because the panel does not exist.
- [ ] Add the panel with no mutation callbacks, cloud-only readiness, visible deduction rules and a truthful incomplete-data state.
- [ ] Link it from the Challenge only for an authenticated session while leaving the public demo intact.
- [ ] Re-run the audit; expect PASS.

### Task 3: Verification

- [ ] Run the Phase 1 score/privacy audit, existing growth/free-tools audits, TypeScript, production build, hydration, V4, demo, email and `git diff --check`.
- [ ] Inspect the diff for generated files and prohibited subsystem changes.
