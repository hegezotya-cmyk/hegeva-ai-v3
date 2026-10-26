# Mai pénzügyi teendők Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A signed-in small-business owner can open one page and see the five most valuable payment and follow-up actions already identified from their own workspace records.

**Architecture:** Reuse the authenticated `/api/core/decide` response and build a pure, browser-side selector over its existing `businessRules` and `opportunityRadar` projections. A new business route renders the selected items and links only to existing, owner-controlled review surfaces; no new API endpoint, persistence, external communication, Stripe flow, or migration is introduced.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind, existing HEGEVA Core API and audit-script convention.

**Spec:** `docs/superpowers/specs/2026-10-26-money-today-design.md`

## Global Constraints

- Use only the authenticated user’s existing Core response; never accept a workspace or user ID from the browser.
- Do not send e-mail, SMS, WhatsApp, payment requests, or create invoices automatically.
- Do not add a D1 migration, Stripe change, third-party analytics, or a production deployment.
- Preserve the existing Core response’s `Cache-Control: private, no-store` behaviour.
- Do not log customer names, message content, document references, URLs, or raw workspace records.
- Show at most five action summaries and use only existing internal paths.

## Review Focus

- A signed-out visitor must see the existing unauthenticated state and no workspace-derived amount or count; covered by Task 2 selector fallback and route audit.
- A workspace with no eligible payment or sales signal must show a clear empty state rather than invented work; covered by Task 2 empty-state test and Task 3 UI audit.
- Amounts from a different currency must not be combined or shown as GBP; covered by Task 2 mixed-currency test.
- More than five eligible signals must be sorted deterministically and cut to five; covered by Task 2 ranking-limit test.
- A UI regression must not turn a preparation link into external delivery; covered by Task 4 source audit rejecting delivery/payment operations.

---

## File structure

- Create `v0-app/lib/money-today.ts`: pure conversion of existing Core projections to safe, UI-ready action summaries.
- Create `v0-app/components/business/money-today.tsx`: authenticated view with loading, unavailable, empty, and action-list states.
- Create `v0-app/app/business/money-today/page.tsx`: AppShell route for the view.
- Modify `v0-app/components/desktop-command-rail.tsx`: discoverable desktop link in the existing business operations group.
- Modify `v0-app/components/mobile-action-dock.tsx`: discoverable mobile entry without hiding an existing core action.
- Create `v0-app/scripts/money-today-audit.mjs`: static/regression checks for route, safe selector use, maximum list, and no autonomous delivery.
- Modify `v0-app/package.json`: add `audit:money-today` script.

### Task 1: Define the safe money-action contract

**Files:**
- Create: `v0-app/lib/money-today.ts`
- Test: `v0-app/lib/money-today.test.ts`

**Interfaces:**
- Consumes: `CoreDecisionResponse` from `v0-app/lib/use-core-decision.ts`.
- Produces: `selectMoneyTodayActions(response: CoreDecisionResponse): MoneyTodayAction[]`.
- `MoneyTodayAction`: `{ id: "overdue-invoices" | "stale-quotes" | "customer-followups"; priority: number; count: number; amount?: number; currency?: string; href: string }`.

- [ ] **Step 1: Write a failing selector test for a high-value overdue invoice**

```ts
assert.deepEqual(selectMoneyTodayActions(coreWithPaymentRisk)[0], {
  id: "overdue-invoices", priority: 3, count: 2, amount: 1200, currency: "GBP",
  href: "/business/intelligence#customer-follow-up",
})
```

- [ ] **Step 2: Run the selector test to verify it fails**

Run: `npx tsx v0-app/lib/money-today.test.ts`

Expected: FAIL because `selectMoneyTodayActions` does not exist.

- [ ] **Step 3: Implement `selectMoneyTodayActions(response: CoreDecisionResponse): MoneyTodayAction[]` in `v0-app/lib/money-today.ts`**

Map only `overdue-invoices`, `stale-quotes`, and `customer-followups` Core rules. Match invoice and quote amounts only to their corresponding `payment-risk` and `quote-leakage` radar findings, and retain an amount only if it is finite, non-negative, and GBP. Use fixed category priorities: overdue invoices 3, stale quotes 2, customer follow-ups 1.

- [ ] **Step 4: Add and run edge-case selector tests**

Test an empty response, mixed/non-GBP currency (amount omitted), duplicate rule categories, and six sorted eligible entries (only five returned). Run: `npx tsx v0-app/lib/money-today.test.ts`.

Expected: PASS.

- [ ] **Step 5: Commit the tested selector**

```bash
git add v0-app/lib/money-today.ts v0-app/lib/money-today.test.ts
git commit -m "feat: select daily money actions from core signals"
```

### Task 2: Render the authenticated daily money page

**Files:**
- Create: `v0-app/components/business/money-today.tsx`
- Create: `v0-app/app/business/money-today/page.tsx`
- Test: `v0-app/scripts/money-today-audit.mjs`

**Interfaces:**
- Consumes: `useCoreDecision()` and `selectMoneyTodayActions()` from Task 1.
- Produces: `/business/money-today` page.

- [ ] **Step 1: Write a failing source audit for the page states**

```js
assert.match(view, /useCoreDecision/)
assert.match(view, /selectMoneyTodayActions/)
assert.match(view, /No money-related follow-ups need your attention/)
assert.match(page, /<AppShell>/)
```

- [ ] **Step 2: Run the audit to verify it fails**

Run: `node v0-app/scripts/money-today-audit.mjs`

Expected: FAIL because the page and component do not exist.

- [ ] **Step 3: Implement `MoneyToday()` and the route**

Render loading, unauthenticated/unavailable, empty, and populated states. Each populated item must show a translated category label, count, optional formatted GBP amount, short static rationale, and a `next/link` to its existing internal `href`. Use five locale dictionaries already supported by the UI: English, Hungarian, German, French, Spanish. Do not render document/customer references or prepared message content.

- [ ] **Step 4: Extend the audit for no leakage and no automatic delivery**

Require safe internal `Link` use and reject `fetch(`, `sendMail`, `sendEmail`, `sms`, `whatsapp`, `stripe`, `paymentIntent`, document IDs, and prepared-action content in the new component.

- [ ] **Step 5: Run the view audit**

Run: `node v0-app/scripts/money-today-audit.mjs`

Expected: PASS.

- [ ] **Step 6: Commit the page**

```bash
git add v0-app/components/business/money-today.tsx v0-app/app/business/money-today/page.tsx v0-app/scripts/money-today-audit.mjs
git commit -m "feat: add daily money actions page"
```

### Task 3: Make the page discoverable on desktop and mobile

**Files:**
- Modify: `v0-app/components/desktop-command-rail.tsx`
- Modify: `v0-app/components/mobile-action-dock.tsx`
- Modify: `v0-app/scripts/money-today-audit.mjs`

**Interfaces:**
- Consumes: route from Task 2.
- Produces: visible internal navigation to `/business/money-today` for authenticated workspace users.

- [ ] **Step 1: Add failing navigation assertions**

```js
assert.match(rail, /"\/business\/money-today"/)
assert.match(mobileDock, /"\/business\/money-today"/)
assert.match(rail, /Money today|Mai pénzügyi teendők/)
```

- [ ] **Step 2: Run the audit to verify it fails**

Run: `node v0-app/scripts/money-today-audit.mjs`

Expected: FAIL because no navigation item exists.

- [ ] **Step 3: Add locale-aware navigation entries**

Use the existing command-rail and mobile-dock patterns, a financial/action icon already supplied by `lucide-react`, and exact route `/business/money-today`. Preserve current authenticated/unauthenticated navigation behaviour; the new link must not disclose data by itself.

- [ ] **Step 4: Run route and mobile audits**

Run: `node v0-app/scripts/money-today-audit.mjs && npm --prefix v0-app run audit:ui-mobile`

Expected: both PASS.

- [ ] **Step 5: Commit the navigation**

```bash
git add v0-app/components/desktop-command-rail.tsx v0-app/components/mobile-action-dock.tsx v0-app/scripts/money-today-audit.mjs
git commit -m "feat: link daily money actions in workspace navigation"
```

### Task 4: Register and verify the feature checks

**Files:**
- Modify: `v0-app/package.json`
- Modify: `v0-app/scripts/money-today-audit.mjs`

**Interfaces:**
- Consumes: all files from Tasks 1–3.
- Produces: `npm --prefix v0-app run audit:money-today`.

- [ ] **Step 1: Add a failing package-script assertion**

```js
assert.match(packageJson, /"audit:money-today": "node scripts\/money-today-audit\.mjs"/)
```

- [ ] **Step 2: Run the audit to verify it fails**

Run: `node v0-app/scripts/money-today-audit.mjs`

Expected: FAIL until the script is registered.

- [ ] **Step 3: Register `audit:money-today` in `v0-app/package.json`**

Keep it independent and do not add it to the full roadmap chain until it has passed in CI at least once.

- [ ] **Step 4: Run focused and release-quality verification**

Run: `npm --prefix v0-app run audit:money-today && npm --prefix v0-app run audit:ui-mobile && npm --prefix v0-app run audit:business-rules && cd v0-app && npx tsc --noEmit && npm run build && npm run cf:build`

Expected: all PASS. Record any environment-only build issue separately; do not call it a feature pass.

- [ ] **Step 5: Commit the verification wiring**

```bash
git add v0-app/package.json v0-app/scripts/money-today-audit.mjs
git commit -m "test: add daily money actions audit"
```

## Self-review

- **Spec coverage:** Tasks 1–2 deliver the bounded, workspace-scoped daily list; Task 3 makes it usable on both desktop and mobile; Task 4 verifies it. Automatic sending, billing changes, migrations, and deployment are explicitly excluded.
- **Step scan:** Each test, implementation, verification, and commit action has a concrete file, command, or interface.
- **Type consistency:** Task 1 exports `MoneyTodayAction` and `selectMoneyTodayActions`; Task 2 imports those exact names. The route is consistently `/business/money-today`.
- **Review focus:** All five listed failure modes have explicit tests in Tasks 1–4.
- **Proportion:** The plan uses the existing Core endpoint and view conventions rather than a new backend subsystem.
