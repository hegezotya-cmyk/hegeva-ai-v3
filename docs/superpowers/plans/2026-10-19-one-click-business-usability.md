# One-Click Business Usability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 90-second business start faster and easier with trade presets, a three-part form, existing-customer selection, a recoverable draft, field-level errors, and one clear post-creation action.

**Architecture:** Keep record creation in the existing `OneClickBusiness` flow, but move deterministic preset, draft, and validation behavior into focused pure helpers in `lib/one-click-business.ts`. Reuse `useWorkspaceData` for existing customers and one owner-scoped draft; preserve the review → approved → created state machine and all no-send guarantees.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, Tailwind CSS, existing `useWorkspaceData`, Node audit scripts.

**Spec:** `docs/superpowers/specs/2026-10-19-one-click-business-usability-design.md`

## Global Constraints

- Release only from `origin/v0-rebuild`; never build or deploy the old growth branch.
- No new backend subsystem, external message, purchase, or automatic customer contact.
- Presets set the service label, GBP, and a 14-day validity date; they never infer VAT registration or silently change the VAT rate.
- Existing customer selection reads name and email only and never edits the customer record.
- Keep at most one owner-scoped draft; clearing it must never delete customers, documents, tasks, or messages.
- All new user-facing copy must support `en`, `hu`, `de`, `fr`, and `es`.
- Analytics may contain only content-free modes such as `preset | manual` and `existing | new`.
- Every behavior follows red → green → refactor, then targeted audits, TypeScript, Next.js build, and Cloudflare build.

## Review Focus

- A preset must not overwrite a business name, customer name, email, amount, or VAT rate already entered by the user.
- A stale draft referencing a deleted customer must restore editable text without crashing or mutating customer data.
- Invalid e-mail, negative amount, VAT outside 0–100, or malformed date must identify the exact field and block preview.
- Draft hydration must happen once and must not overwrite input typed while workspace data is loading.
- Creating records twice from the same run must remain duplicate-safe, and clearing the launch draft must not clear business records.

---

### Task 1: Trade presets and field-aware validation

**Files:**
- Modify: `v0-app/lib/one-click-business.ts`
- Create: `v0-app/scripts/one-click-business-logic-test.mjs`
- Modify: `v0-app/package.json`

**Interfaces:**
- Produces: `TRADE_PRESETS`, `TradePresetId`, `applyTradePreset(brief, presetId, dueDate)`, and the existing `validateLaunchBrief(input)` returning `{ ok, errors }` with field keys.
- Consumes: existing `LaunchBrief` and `launchSource` contracts.

- [ ] **Step 1: Write failing preset and validation tests**

Create cases named `preset supplies service GBP and date without overwriting user values`, `unknown preset leaves brief unchanged`, and `validation returns exact invalid field keys`. Assert painter, builder/mason, cleaner, electrician, and small-shop IDs exist; assert VAT and entered identity/amount fields survive preset application; assert invalid inputs return `customerEmail`, `amount`, `vatRate`, and `dueDate`.

- [ ] **Step 2: Run the logic test and verify RED**

Run: `node scripts/one-click-business-logic-test.mjs`
Expected: FAIL because `TRADE_PRESETS` and `applyTradePreset` are not exported.

- [ ] **Step 3: Implement the pure preset helpers**

Add exact signatures:

```ts
export type TradePresetId = "painter" | "builder" | "cleaner" | "electrician" | "small-shop"
export const TRADE_PRESETS: Readonly<Record<TradePresetId, { offer: string; currency: "GBP"; validityDays: 14 }>>
export function applyTradePreset(input: LaunchBrief, presetId: TradePresetId, dueDate: string): LaunchBrief
```

Only fill `offer` when empty; set GBP and the supplied 14-day date; preserve business, customer, e-mail, amount, and VAT.

- [ ] **Step 4: Add and run the test command**

Add `audit:one-click-logic` to `package.json`, run it, and expect all named cases to PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add v0-app/lib/one-click-business.ts v0-app/scripts/one-click-business-logic-test.mjs v0-app/package.json
git commit -m "Add safe One-Click trade presets"
```

### Task 2: Three-part form and existing-customer selection

**Files:**
- Modify: `v0-app/components/business/one-click-business.tsx`
- Modify: `v0-app/scripts/one-click-business-audit.mjs`

**Interfaces:**
- Consumes: `TRADE_PRESETS`, `TradePresetId`, `applyTradePreset`, `LaunchBrief`, and `customers` from `useWorkspaceData<Customer>("customers")`.
- Produces: preset selector, customer selector, and labelled sections `customer`, `work`, and `price` in all five locales.

- [ ] **Step 1: Add failing UI contract checks**

Require five preset IDs, five-locale labels, three section legends/headings, an explicit `new-customer` option, and a customer selection handler that copies only `title` and `meta` into the brief.

- [ ] **Step 2: Run the UI audit and verify RED**

Run: `node scripts/one-click-business-audit.mjs`
Expected: FAIL at `trade preset selector`.

- [ ] **Step 3: Implement preset selection and the three form sections**

Add an accessible preset button group above the form. Split fields into semantic sections in keyboard order: customer, work, price/date. Use the existing inputs and state; do not change the approval state machine.

- [ ] **Step 4: Implement existing-customer selection**

Add `selectedCustomerId` local state and `selectCustomer(id: string)`; `new-customer` clears only name/e-mail, while an existing ID copies only customer `title` and `meta`. Missing IDs leave editable values unchanged.

- [ ] **Step 5: Run Task 1 and Task 2 tests**

Run: `npm run audit:one-click-logic && npm run audit:one-click-business && npx tsc --noEmit`
Expected: all exit 0.

- [ ] **Step 6: Commit Task 2**

```bash
git add v0-app/components/business/one-click-business.tsx v0-app/scripts/one-click-business-audit.mjs
git commit -m "Simplify One-Click opportunity entry"
```

### Task 3: Recoverable single draft

**Files:**
- Modify: `v0-app/lib/one-click-business.ts`
- Modify: `v0-app/components/business/one-click-business.tsx`
- Modify: `v0-app/scripts/one-click-business-logic-test.mjs`
- Modify: `v0-app/scripts/one-click-business-audit.mjs`

**Interfaces:**
- Produces: `LaunchDraft` and `normalizeLaunchDraft(value, fallbackBusinessName)`; workspace type `one_click_business_drafts` contains zero or one record.
- Consumes: `LaunchBrief`, `TradePresetId`, and existing `useWorkspaceData` behavior.

- [ ] **Step 1: Write failing draft normalization tests**

Assert a valid draft restores all supported fields, malformed/stale data falls back safely, a deleted `customerId` retains editable name/e-mail, and extra keys are discarded.

- [ ] **Step 2: Run the logic test and verify RED**

Run: `npm run audit:one-click-logic`
Expected: FAIL because `normalizeLaunchDraft` is not exported.

- [ ] **Step 3: Implement the draft contract**

Add exact interfaces:

```ts
export type LaunchDraft = { id: "current"; brief: LaunchBrief; presetId?: TradePresetId; customerId?: string; updatedAt: string }
export function normalizeLaunchDraft(value: unknown, fallbackBusinessName: string): LaunchDraft | null
```

Reject non-object or invalid brief data and return only supported fields.

- [ ] **Step 4: Add one-time draft hydration and debounced workspace persistence**

Use `useWorkspaceData<LaunchDraft>("one_click_business_drafts")`. Hydrate only while the local form is still pristine; thereafter save exactly one `current` draft. On successful record creation or `newOpportunity`, call `setDrafts([])` without touching any other workspace type.

- [ ] **Step 5: Extend UI contract checks and run all targeted tests**

Require the draft workspace type, one-time hydration guard, single-record write, and draft-only clear. Run both One-Click audits and `npx tsc --noEmit`; expect exit 0.

- [ ] **Step 6: Commit Task 3**

```bash
git add v0-app/lib/one-click-business.ts v0-app/components/business/one-click-business.tsx v0-app/scripts/one-click-business-logic-test.mjs v0-app/scripts/one-click-business-audit.mjs
git commit -m "Restore unfinished One-Click drafts"
```

### Task 4: Field errors, mobile action, and post-creation handoff

**Files:**
- Modify: `v0-app/components/business/one-click-business.tsx`
- Modify: `v0-app/scripts/one-click-business-audit.mjs`

**Interfaces:**
- Consumes: `validateLaunchBrief` field keys and existing created-record links.
- Produces: localized field error mapping, first-invalid-field focus, mobile action container, and primary `/business/invoices` handoff.

- [ ] **Step 1: Add failing interaction contract checks**

Require localized field-error keys for every validated field, `aria-invalid`, `aria-describedby`, focus refs for the first error, a mobile-safe action container, and the quote link before secondary links after creation.

- [ ] **Step 2: Run the UI audit and verify RED**

Run: `npm run audit:one-click-business`
Expected: FAIL at `field-level validation feedback`.

- [ ] **Step 3: Implement field-level errors and focus**

Store `LaunchBrief` field keys returned by validation, render the matching localized message under each field, connect it with `aria-describedby`, and focus the first invalid field after a blocked preview.

- [ ] **Step 4: Implement mobile and completion actions**

Place the preview button in a narrow-screen sticky action surface that does not cover fields. Render `/business/invoices` as the first primary link after creation; keep customer, planner, and new-opportunity controls secondary.

- [ ] **Step 5: Add content-free mode analytics**

Extend only the existing consented start event with `entry_mode` and `customer_mode`; verify no name, e-mail, service, amount, or VAT is passed.

- [ ] **Step 6: Run complete verification**

Run:

```bash
npm run audit:one-click-logic
npm run audit:one-click-business
node scripts/onboarding-first-wow-audit.mjs
node scripts/product-readiness-audit.mjs
npx tsc --noEmit
npm run build
npm run cf:build
```

Expected: every command exits 0; Next.js reports 75 routes including `/business/launch`.

- [ ] **Step 7: Commit Task 4**

```bash
git add v0-app/components/business/one-click-business.tsx v0-app/scripts/one-click-business-audit.mjs
git commit -m "Complete One-Click usability flow"
```

### Task 5: Review, release, and non-destructive production check

**Files:**
- Modify only if review finds a proven issue in files already named above.

**Interfaces:**
- Consumes: all Task 1–4 deliverables.
- Produces: reviewed branch, merged PR, successful production deployment, and browser evidence through preview only.

- [ ] **Step 1: Review the entire branch against the spec**

Check presets do not infer VAT, draft clearing is scoped, analytics contains no business content, and approval/duplicate protections remain intact.

- [ ] **Step 2: Re-run fresh verification after review fixes**

Run the complete Task 4 command set and `git diff --check`; expect all exit 0 and no whitespace errors.

- [ ] **Step 3: Open a PR against `v0-rebuild` and wait for both required checks**

Expected: `verify-capability-engine` and `verify-edit-capability` both pass.

- [ ] **Step 4: Squash-merge and wait for deployment checks**

Expected: `HEGEVA V0 Build Check` and `HEGEVA V0 UI Auto Deploy` both complete successfully for the merge commit.

- [ ] **Step 5: Run the production browser check without creating records**

Verify preset application, existing-customer selection, draft restoration, exact field error, and quote preview totals. Stop before preview approval so no customer, document, or Planner record is created.

- [ ] **Step 6: Confirm repository state**

Run: `git status --short --branch`
Expected: clean `v0-rebuild...origin/v0-rebuild`.
