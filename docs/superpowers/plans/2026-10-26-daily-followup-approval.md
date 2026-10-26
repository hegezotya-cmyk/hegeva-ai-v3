# Daily Follow-up Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an authenticated owner move safely from a Money Today item to the existing invoice or quote follow-up preparation flow, without creating duplicate drafts or sending any customer message.

**Architecture:** Money Today remains read-only prioritisation. Its action links use a dedicated invoice-workspace `focus` query parameter to focus the right review card without conflicting with the existing `prepare=quote` document-creation flow. The invoice page stays the only place that calls the protected draft-preparation endpoints, retaining authentication, workspace sync, payment-state and idempotency protections.

**Tech Stack:** Next.js App Router, React, TypeScript, existing HEGEVA Core decision hook, existing invoice workspace and Node assertion audits.

**Spec:** `docs/superpowers/specs/2026-10-26-retention-loop-design.md`

## Global Constraints

- Never send email, SMS, WhatsApp or another external communication automatically.
- Reuse existing authenticated workspace contracts; do not alter Stripe, subscriptions, roles, sharing links or database schema.
- Do not expose message bodies, tokens, URLs, payment data or unnecessary personal data in measurements or logs.
- A paused, disputed, or still-promised invoice must not be offered for payment chasing.
- Do not stage `v0-app/tsconfig.tsbuildinfo`.

## Review Focus

- An anonymous visitor sees no commercial records or preparation controls.
- Money Today targets only fixed internal business routes.
- Stale quotes and overdue invoices focus different existing review flows.
- Reopening a prepared item preserves existing duplicate-safe endpoint behaviour.
- Blocked payment states stay blocked even on a directly focused route.

---

### Task 1: Add deterministic Money Today destinations

**Files:**
- Modify: `v0-app/lib/money-today.ts`
- Modify: `v0-app/lib/money-today.test.ts`

**Interfaces:**
- Consumes: `CoreDecisionResponse` and its existing decision kinds.
- Produces: `selectMoneyTodayActions(response): MoneyTodayAction[]`, where `href` is a fixed internal route and, for invoice/quote actions, includes a constrained `focus` value.

- [ ] **Step 1: Write failing selector tests for focused follow-up destinations**

```ts
assert.equal(overdue.href, "/business/invoices?focus=payment-followup")
assert.equal(staleQuote.href, "/business/invoices?focus=quote-followup")
assert.equal(customerFollowUp.href, "/business/customers")
```

- [ ] **Step 2: Run the selector tests to verify they fail**

Run: `npx tsx v0-app/lib/money-today.test.ts`

Expected: FAIL because destinations are currently generic.

- [ ] **Step 3: Map only the three supported action kinds to fixed internal destinations**

Implement in `v0-app/lib/money-today.ts`. Keep existing ranking, GBP-only amount behaviour, maximum action count and no-delivery contract.

- [ ] **Step 4: Run the selector tests to verify they pass**

Run: `npx tsx v0-app/lib/money-today.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add v0-app/lib/money-today.ts v0-app/lib/money-today.test.ts
git commit -m "feat: focus money actions on follow-up review"
```

### Task 2: Accept only supported focused follow-up entry points

**Files:**
- Modify: `v0-app/app/business/invoices/page.tsx`
- Create: `v0-app/scripts/money-today-followup-audit.mjs`

**Interfaces:**
- Consumes: fixed `focus=payment-followup` and `focus=quote-followup` values from Task 1.
- Produces: focused invoice-workspace state that surfaces the relevant existing review card but does not invoke preparation itself.

- [ ] **Step 1: Write a failing static regression audit**

```js
assert.match(page, /focus=payment-followup/)
assert.match(page, /focus=quote-followup/)
assert.doesNotMatch(page, /fetch\([^)]*external-actions[^)]*useEffect/)
```

The audit also asserts the existing payment block-state check remains on the preparation path.

- [ ] **Step 2: Run the audit to verify it fails**

Run: `node v0-app/scripts/money-today-followup-audit.mjs`

Expected: FAIL because focused query states are not supported yet.

- [ ] **Step 3: Add narrow visible focus state to the invoice page**

Interpret only `payment` and `quote`; ignore every other value. Scroll/focus only after the relevant cards render. Never call either draft endpoint from mount/query parsing; the owner must press the existing preparation button.

- [ ] **Step 4: Run focused-route and existing follow-up regressions**

Run: `node v0-app/scripts/money-today-followup-audit.mjs; node v0-app/scripts/payment-followup-state-regression.mjs; node v0-app/scripts/quote-followup-governance-audit.mjs`

Expected: PASS, including blocked payment cases and no automatic delivery.

- [ ] **Step 5: Commit**

```bash
git add v0-app/app/business/invoices/page.tsx v0-app/scripts/money-today-followup-audit.mjs
git commit -m "feat: guide daily actions into owner follow-up review"
```

### Task 3: Integrate and release daily follow-up approval

**Files:**
- Modify: `v0-app/package.json`
- Modify: `.github/workflows/main.yml`

**Interfaces:**
- Consumes: `money-today-followup-audit.mjs` from Task 2.
- Produces: `npm --prefix v0-app run audit:money-today-followup` and a required Linux CI check.

- [ ] **Step 1: Extend the audit with failing package/workflow checks**

```js
assert.equal(packageJson.scripts["audit:money-today-followup"], "node scripts/money-today-followup-audit.mjs")
assert.match(workflow, /audit:money-today-followup/)
```

- [ ] **Step 2: Run the audit to verify it fails**

Run: `node v0-app/scripts/money-today-followup-audit.mjs`

Expected: FAIL because the audit is not registered.

- [ ] **Step 3: Register the audit in package and Linux CI**

Add only the targeted audit after existing UI/business-rule checks. Do not change deployment triggers or credentials.

- [ ] **Step 4: Run full local verification**

Run: `npm --prefix v0-app run audit:money-today; npm --prefix v0-app run audit:money-today-followup; npm --prefix v0-app run audit:ui-mobile; npm --prefix v0-app run audit:business-rules; npm --prefix v0-app run typecheck; npm --prefix v0-app run build; npm --prefix v0-app run cf:build`

Expected: PASS.

- [ ] **Step 5: Commit, push, and verify staging then production**

```bash
git add v0-app/package.json .github/workflows/main.yml v0-app/scripts/money-today-followup-audit.mjs
git commit -m "test: protect daily follow-up approval flow"
```

Use existing staged-release process. Verify route and focused review state on phone and desktop in staging. Promote only after all checks pass; verify the production deploy and smoke test after release.

## Self-review

- Spec coverage: Phase 1 is covered. Weekly summary and aggregate measurement are independent data/UI work and will have separate plans.
- Step scan: Every task has explicit test-first, fail, implementation, pass and commit steps.
- Type consistency: Money Today exports `MoneyTodayAction`; the invoice page consumes fixed query strings, not a new cross-page type.
- Review focus: anonymous access, constrained destinations, quote/payment routing, idempotency and blocked payment state are assigned to Tasks 1–2.
- Proportion: this is an independently releasable first phase.
