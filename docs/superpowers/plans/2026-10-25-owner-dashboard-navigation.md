# Owner Dashboard Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the configured HEGEVA owner open the existing registration dashboard directly from the desktop command rail.

**Architecture:** Add a small read-only `/api/admin/access` endpoint that applies the existing server-side owner check and returns only an ownership boolean. Extend the client-side desktop command rail with an owner-only navigation item based on that boolean. The existing `/api/admin/registrations` owner check remains the authorization boundary.

**Tech Stack:** Next.js 16, React 19, TypeScript, Better Auth, Node audit scripts.

**Spec:** `docs/superpowers/specs/2026-10-25-owner-dashboard-navigation-design.md`

## Global Constraints

- The link path is exactly `/admin/registrations`.
- The link must not render for signed-out or non-owner sessions.
- Do not alter D1, Stripe, billing, user records, or the existing server-side authorization rule.
- Do not deploy production without separate owner approval.

## Review Focus

- A client-side visibility check must never become the only authorization check; retain the API owner check.
- An unset owner configuration must not display the link.
- E-mail comparisons must be case-insensitive and whitespace-safe.
- Existing desktop navigation links and active-route highlighting must stay unchanged.
- The nav label must be localised for every supported locale.

---

### Task 1: Owner-only command rail entry

**Files:**
- Modify: `v0-app/components/desktop-command-rail.tsx`
- Modify: `v0-app/scripts/admin-registrations-test.mjs`
- Modify: `src/admin-registrations.js`
- Modify: `src/index.js`

**Interfaces:**
- Consumes: `authClient.useSession()`, `/api/admin/access`, and the existing `/admin/registrations` route.
- Produces: an owner-only desktop navigation link labelled for the active locale.

- [ ] **Step 1: Add a failing audit assertion for the command-rail admin route**

Extend `admin-registrations-test.mjs` with owner, non-owner, unauthenticated and wrong-method cases for `/api/admin/access`; assert it reads no dashboard data. Also read `desktop-command-rail.tsx` and assert it contains the exact `/admin/registrations` route plus owner-session gating.

- [ ] **Step 2: Run the focused audit and verify it fails because the navigation entry is absent**

Run: `node --import ./scripts/audit-runtime-register.mjs scripts/admin-registrations-test.mjs`

Expected: FAIL on the missing command-rail owner-dashboard assertion.

- [ ] **Step 3: Add the minimal owner-only navigation item**

Add the small `/api/admin/access` server route that returns only `{ owner: true }` after the existing owner check. In `desktop-command-rail.tsx`, add localised `Tulajdonosi áttekintő` copy and append the admin route only when the endpoint confirms ownership. Reuse an existing Lucide icon and preserve every current navigation item.

- [ ] **Step 4: Run the focused audit and verify it passes**

Run: `node --import ./scripts/audit-runtime-register.mjs scripts/admin-registrations-test.mjs`

Expected: PASS with the existing registration API checks and the new navigation assertion.

- [ ] **Step 5: Run the relevant UI build checks**

Run: `npm run build` and `npm run cf:build` from `v0-app`.

Expected: both exit successfully.

- [ ] **Step 6: Commit the reviewed change on an isolated feature branch**

Commit only the command-rail change, focused audit, design and plan documents with a feature commit message.
