# Demo Presentation and Owner Canary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Demo Workspace's test-looking presentation with one internally consistent, clearly fictional property-care scenario while retaining the deployed hydration fix and verifying, without invoking, the existing owner-only Assistant canary boundary.

**Architecture:** The existing client-side fixture module remains the only data source for `/demo`; the page continues to make no data writes. A source audit pins the single-scenario fixture, localization coverage, human-readable states, and no-network-write boundary. The Assistant workstream is audit-only unless a normal authenticated owner session is available, in which case the existing endpoint—not a new bypass—remains the sole permitted canary path.

**Tech Stack:** Next.js 16, React, TypeScript, Node source audits, OpenNext/Cloudflare UI build.

**Spec:** `docs/superpowers/specs/2026-09-20-demo-and-owner-canary-design.md`

## Global Constraints

- Preserve `v0-app/components/auth/auth-panel.tsx`, `v0-app/components/command-center/view.tsx`, and `v0-app/scripts/auth-hydration-audit.mjs` unchanged.
- Keep `/demo` client-side, deterministic, visibly DEMO/SAMPLE only, and free of fetch/POST/PUT/PATCH/DELETE calls.
- Use one fictional scenario: Northgate Property Care Ltd; Riverside Estates Management; Amelia Carter; annual property maintenance; GBP 2,400; follow-up due 23 September 2026.
- Present prepared work as PREPARED, AWAITING APPROVAL, NOT SENT, and NOT EXECUTED through EN/HU/DE/FR/ES user-facing labels.
- Do not change D1/migrations, real workspace data, auth configuration, Stripe, billing, Cloudflare configuration, secrets, provider selection, quotas, email delivery, payments, or execution behavior.
- Do not stage or modify `v0-app/AGENTS.md` or `v0-app/CLAUDE.md`.
- Do not run an Assistant provider request without a normal authenticated owner session and an already eligible existing canary path.
- Do not push or deploy during this implementation.

## Review Focus

- A fixture with a second business or duplicate follow-up must fail the demo presentation audit.
- A visible raw state such as `followup-approval-pending` must fail the demo presentation audit.
- Each locale must render the prepared-action lifecycle without falling back to English labels.
- A demo action must not add a network mutation or create real workspace data.
- A missing owner session must result in no Assistant canary request and a NOT PROVEN report.

---

### Task 1: Add a red demo-presentation source audit

**Files:**
- Create: `v0-app/scripts/demo-presentation-audit.mjs`
- Test: `v0-app/scripts/demo-presentation-audit.mjs`

**Interfaces:**
- Consumes: text from `v0-app/lib/demo-workspace.ts` and `v0-app/components/demo-workspace.tsx`.
- Produces: exit code 0 only when the one-scenario fixture and visible presentation boundary are intact.

- [ ] **Step 1: Write the failing audit**

```js
assert.match(fixture, /name: "Northgate Property Care Ltd"/)
assert.doesNotMatch(fixture, /BrightSpark|PrimeCare|Crystal Clean|Urban Retail/)
assert.match(component, /preparedAction/)
assert.doesNotMatch(component, /followup-approval-pending/)
for (const locale of ["en", "hu", "de", "fr", "es"]) {
  assert.match(component, new RegExp(`${locale}:\\{[^}]*prepared`))
}
assert.doesNotMatch(component, /\\b(fetch|POST|PUT|PATCH|DELETE)\\b/)
```

- [ ] **Step 2: Run the audit to verify it fails**

Run: `node scripts/demo-presentation-audit.mjs`

Expected: FAIL because the current fixture includes five businesses and does not yet contain the new single scenario contract.

- [ ] **Step 3: Keep the audit narrowly structural**

Use `node:assert/strict` and `readFileSync`, matching the repository's existing source-audit pattern. Do not parse or execute TypeScript fixtures and do not add a testing dependency.

- [ ] **Step 4: Re-run the audit before fixture changes**

Run: `node scripts/demo-presentation-audit.mjs`

Expected: the same intentional failure from Step 2.

### Task 2: Replace Demo Workspace fixture data with one linked scenario

**Files:**
- Modify: `v0-app/lib/demo-workspace.ts`
- Test: `v0-app/scripts/demo-presentation-audit.mjs`

**Interfaces:**
- Consumes: existing `DemoBusiness` and `DEMO_DETAILS` types.
- Produces: one `northgate-property-care` record whose customers, quotes, invoices, tasks, priorities, timeline, opportunities, goal, and six-month revenue values agree.

- [ ] **Step 1: Define exact fixture values in the failing audit**

```js
for (const expected of [
  "Northgate Property Care Ltd",
  "Riverside Estates Management",
  "Amelia Carter",
  "Annual property maintenance contract",
  "2400",
  "23 September 2026",
]) assert.match(fixture, new RegExp(expected))
assert.equal((fixture.match(/Follow up with Riverside Estates Management/g) || []).length, 1)
```

- [ ] **Step 2: Run the audit to verify the exact contract fails**

Run: `node scripts/demo-presentation-audit.mjs`

Expected: FAIL because the current property names, amount, and duplicate multi-business fixture do not match.

- [ ] **Step 3: Apply the minimum fixture replacement**

Replace the five `DEMO_BUSINESSES` records and corresponding `DEMO_DETAILS` entries with one `northgate-property-care` record. Its linked values are:

```ts
name: "Northgate Property Care Ltd"
customer: "Riverside Estates Management"
contact: "Amelia Carter"
quote: { ref: "QUO-DEMO-2400", amount: 2400, status: "Awaiting approval" }
invoice: { ref: "INV-DEMO-2400", amount: 2400, status: "Prepared" }
task: { title: "Follow up with Riverside Estates Management", priority: "HIGH" }
```

The timeline must state that the annual property maintenance quote was prepared, that the follow-up is due 23 September 2026, and that the action is prepared only. The opportunity and goal must use GBP 2,400 consistently. No real-looking email, phone, address, or customer account is introduced.

- [ ] **Step 4: Run the fixture audit**

Run: `node scripts/demo-presentation-audit.mjs`

Expected: PASS for the one-scenario contract and one follow-up title.

### Task 3: Localize human-readable prepared-action presentation

**Files:**
- Modify: `v0-app/components/demo-workspace.tsx`
- Test: `v0-app/scripts/demo-presentation-audit.mjs`

**Interfaces:**
- Consumes: the fixture's prepared quote/invoice/task state.
- Produces: locale-specific prepared action copy and a visible DEMO lifecycle without internal keys.

- [ ] **Step 1: Extend the failing audit with visible lifecycle requirements**

```js
for (const locale of ["en", "hu", "de", "fr", "es"]) {
  assert.match(component, new RegExp(`${locale}:\\{[^}]*awaitingApproval`))
  assert.match(component, new RegExp(`${locale}:\\{[^}]*notSent`))
  assert.match(component, new RegExp(`${locale}:\\{[^}]*notExecuted`))
}
assert.doesNotMatch(component, /followup-approval-pending|HEGEVA TEST LEAD|HEGEVA E2E TEST CUSTOMER/)
```

- [ ] **Step 2: Run the audit to verify it fails**

Run: `node scripts/demo-presentation-audit.mjs`

Expected: FAIL because the lifecycle keys are not yet represented for all five locales.

- [ ] **Step 3: Add minimal locale copy and render it from data**

Add `awaitingApproval`, `notSent`, `notExecuted`, `preparedAction`, and `followUpDue` to the existing `COPY` structure for EN/HU/DE/FR/ES. Use these values in the existing prepared-action/owner-review card. Preserve the current `renderStatus` pattern; add only status entries actually used by the new fixture.

- [ ] **Step 4: Remove duplicate presentation paths**

Render one prepared follow-up card, sourced from the selected fixture. Do not retain a second card generated from a separate opportunity list or local `prepared` state.

- [ ] **Step 5: Run the audit to verify it passes**

Run: `node scripts/demo-presentation-audit.mjs`

Expected: PASS with all locale lifecycle labels and no raw internal/test-looking values.

### Task 4: Verify the demo route and production-write boundary

**Files:**
- Modify: `v0-app/scripts/demo-presentation-audit.mjs`
- Test: `v0-app/scripts/demo-presentation-audit.mjs`

**Interfaces:**
- Consumes: `demo-workspace.tsx`, `demo-workspace.ts`, and `app/demo/page.tsx`.
- Produces: an auditable proof that demo rendering has no production write route.

- [ ] **Step 1: Add a failing route and write-boundary check**

```js
assert.match(demoPage, /<DemoWorkspace\/>/)
assert.doesNotMatch(component, /\\b(fetch|POST|PUT|PATCH|DELETE)\\b/)
assert.match(component, /DEMO DOCUMENT — SAMPLE DATA/)
```

- [ ] **Step 2: Run the audit to verify it fails only if a forbidden write marker or missing label exists**

Run: `node scripts/demo-presentation-audit.mjs`

Expected: PASS after Tasks 2–3, confirming the existing no-write design is preserved.

- [ ] **Step 3: Start the normal local server and request the demo route**

Run: `npm run dev -- --port 3101`

Then run: `Invoke-WebRequest http://localhost:3101/demo -UseBasicParsing`

Expected: HTTP 200. Do not invoke a prepared-action button.

### Task 5: Audit the existing owner-only Assistant canary without calling it

**Files:**
- No source modifications.
- Read: `src/cloudflare-ai-provider.js`, `src/assistant-quota.js`, `src/index.js`, `v0-app/scripts/ai-bot-canary-readiness-audit.mjs`, `v0-app/scripts/ai-bot-one-shot-canary-integration-audit.mjs`, `v0-app/scripts/ai-canary-runtime-lifecycle-audit.mjs`, and `v0-app/scripts/assistant-quota-audit.mjs`.

**Interfaces:**
- Consumes: existing `AI_BOT_CANARY_EMAIL`, `AI_PROVIDER_ENABLED`, `AI_GLOBAL_KILL_SWITCH`, `AI_BOT_CANARY_ENABLED`, `FINANCIAL_GUARD_ENABLED`, owner session, and Workers AI binding.
- Produces: a read-only eligibility result; no provider call unless a normal authenticated owner session is demonstrably available.

- [ ] **Step 1: Run existing canary/limit/refund source audits**

Run:

```bash
node scripts/ai-bot-canary-readiness-audit.mjs
node scripts/ai-bot-one-shot-canary-integration-audit.mjs
node scripts/ai-canary-runtime-lifecycle-audit.mjs
node scripts/assistant-quota-audit.mjs
```

Expected: PASS. These audits must prove owner matching, one-request bounds, token/time ceilings, global kill-switch blocking, and settled/released quota paths.

- [ ] **Step 2: Check for a normal authenticated owner session without inspecting credentials**

Use only a browser connector's visible session state. Do not read cookies/tokens, inject a session, or call the endpoint directly.

Expected: if no normal owner session is exposed, record `NOT PROVEN`, zero provider calls, and zero credits used.

- [ ] **Step 3: Conditional one-shot canary**

Only if a visible normal owner session exists and the existing UI presents the approved canary control, use one short no-data request. Record the response class and provider metrics returned by the existing endpoint. Do not retry, create records, send mail, or change flags.

Expected: at most one provider call; otherwise no call is made.

### Task 6: Full verification and review

**Files:**
- Verify only: all Task 2–4 files plus the committed hydration files.

- [ ] **Step 1: Run targeted and existing audits**

Run:

```bash
node scripts/demo-presentation-audit.mjs
node scripts/auth-hydration-audit.mjs
node scripts/visual-system-v4-audit.mjs
node scripts/email-verification-audit.mjs
node scripts/ai-bot-canary-readiness-audit.mjs
node scripts/ai-bot-one-shot-canary-integration-audit.mjs
node scripts/ai-canary-runtime-lifecycle-audit.mjs
node scripts/assistant-quota-audit.mjs
```

Expected: every invoked audit exits 0.

- [ ] **Step 2: Run TypeScript and production build**

Run:

```bash
npx tsc --noEmit --incremental false
npm run build
```

Expected: exit 0 for both.

- [ ] **Step 3: Review the final patch**

Run:

```bash
git diff --check
git status --short
git diff -- v0-app/lib/demo-workspace.ts v0-app/components/demo-workspace.tsx v0-app/scripts/demo-presentation-audit.mjs
```

Expected: only demo fixture/presentation/audit files plus the already-approved untracked documentation and generated artifacts. Never stage `v0-app/AGENTS.md` or `v0-app/CLAUDE.md`.

- [ ] **Step 4: Stop before commit, push, or deployment**

Report exact diffs, local test output, owner-canary status, and any lack of normal authenticated owner session. Do not commit, push, or deploy without a separate explicit instruction.
