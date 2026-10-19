# HEGEVA Visual System V4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a coherent premium V4 visual system to the existing authenticated HEGEVA product without changing any behavior or production-facing configuration.

**Architecture:** Establish V4 design tokens and reusable CSS primitives in the global stylesheet, then opt existing shell and Command Center components into those primitives. Existing hooks and state remain untouched; component edits are class-name and semantic-presentation changes only.

**Tech Stack:** Next.js, React, Tailwind utilities, CSS custom properties, existing HEGEVA components and audit scripts.

**Spec:** `docs/superpowers/specs/2026-09-20-visual-system-v4-design.md`

## Global Constraints

- Begin from `4a6b797d999d7d8e2004ca819c039432cb0de05b` on `visual-system-v4-20260920`.
- Use `/hegeva-logo-gold-official.png` through the existing logo component; do not generate or replace branding assets.
- Retain existing data, routes, actions, localization architecture, focus behavior, and reduced-motion behavior.
- Do not modify API Worker files, D1/schema/migrations, auth, Stripe/billing, provider/quota/kill-switch settings, analytics, consent, Cloudflare configuration, or deployment workflows.
- Do not deploy, merge, send email, invoke providers, create payments, or write production data.

## Review Focus

- Unauthenticated and no-data Core states must remain truthful and visually usable.
- Long DE/FR/ES translations must wrap without clipping action controls.
- Command Center actions must retain their original destination and disabled/busy semantics.
- Mobile navigation and the official logo must not create horizontal overflow at 390px or 412px.
- Existing document-print surfaces must not inherit app-shell decorative styling.

### Task 1: Establish a deterministic V4 foundation

**Files:**
- Create: `v0-app/scripts/visual-system-v4-audit.mjs`
- Modify: `v0-app/app/globals.css`
- Test: `v0-app/scripts/visual-system-v4-audit.mjs`

**Interfaces:**
- Consumes: existing `--background`, `--card`, `--primary`, `--gold`, `--cyan`, and `--surface-*` token consumers.
- Produces: `.v4-surface`, `.v4-elevated`, `.v4-core-zone`, `.v4-status-*`, and `.v4-priority-*` primitives.

- [ ] **Step 1: Write the failing source audit**

```js
assert.match(css, /--v4-ink/)
assert.match(css, /\.v4-core-zone/)
assert.match(css, /prefers-reduced-motion/)
assert.doesNotMatch(css, /\.v4-core-zone[^}]*animation:/)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/visual-system-v4-audit.mjs`
Expected: FAIL because V4 primitives do not exist.

- [ ] **Step 3: Write minimal implementation**

Use one ordered V4 section in `globals.css`; merge superseded V4-targeted rules rather than adding another late cascade patch. Keep print styles and existing hero rules outside the V4 authenticated-surface scope.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/visual-system-v4-audit.mjs && npm run audit:visual && npm run audit:ui-mobile`
Expected: PASS.

### Task 2: Integrate the official logo and shared shell

**Files:**
- Modify: `v0-app/components/hegeva-logo.tsx`
- Modify: `v0-app/components/desktop-command-rail.tsx`
- Modify: `v0-app/components/site-header.tsx`
- Modify: `v0-app/app/globals.css`
- Test: `v0-app/scripts/visual-system-v4-audit.mjs`

**Interfaces:**
- Consumes: Task 1 V4 surface and focus primitives.
- Produces: shared `.v4-brand-lockup`, `.v4-command-rail`, and `.v4-site-header` hooks.

- [ ] **Step 1: Write the failing source audit**

```js
assert.match(logo, /hegeva-logo-gold-official\.png/)
assert.match(css, /\.v4-brand-lockup img[^}]*max-width:100%/)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/visual-system-v4-audit.mjs`
Expected: FAIL because the V4 shell hooks are absent.

- [ ] **Step 3: Write minimal implementation**

Add only class hooks and layout-safe containment. Preserve every link, translation, auth state, and existing mobile-menu interaction.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/visual-system-v4-audit.mjs && npm run audit:ui-mobile`
Expected: PASS.

### Task 3: Promote Command Center and Core hierarchy

**Files:**
- Modify: `v0-app/components/command-center/view.tsx`
- Modify: `v0-app/components/command-center/core-decision-surface.tsx`
- Modify: `v0-app/components/command-center/operating-center.tsx`
- Modify: `v0-app/components/command-center/owner-attention-section.tsx`
- Modify: `v0-app/components/command-center/prepared-work-review-board.tsx`
- Modify: `v0-app/components/command-center/ai-employee-delegations.tsx`
- Test: `v0-app/scripts/visual-system-v4-audit.mjs`

**Interfaces:**
- Consumes: existing Core response, owner-attention statuses, prepared-work records, and Task 1 visual primitives.
- Produces: visual-only Core, priority, semantic-status, and owner-review class hooks.

- [ ] **Step 1: Write the failing source audit**

```js
assert.match(core, /v4-core-zone/)
assert.match(core, /v4-priority-1/)
assert.match(core, /noSignalsData/)
assert.doesNotMatch(core, /setInterval|fake|simulated/i)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/visual-system-v4-audit.mjs`
Expected: FAIL because the Core visual hooks are missing.

- [ ] **Step 3: Write minimal implementation**

Apply presentation only. Preserve ranking, real evidence, actions, approval states, disabled states, and all existing handlers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run audit:business-operating-system && node scripts/visual-system-v4-audit.mjs`
Expected: PASS.

### Task 4: Apply shared authenticated-page surface polish

**Files:**
- Modify: `v0-app/app/business/layout.tsx` only if a shared class hook is needed
- Modify: `v0-app/app/globals.css`
- Test: `v0-app/scripts/visual-system-v4-audit.mjs`

**Interfaces:**
- Consumes: Task 1 shared V4 primitives and existing `.hegeva-atmosphere` app shell.
- Produces: controlled surfaces for business pages without behavior changes.

- [ ] **Step 1: Write the failing source audit**

```js
assert.doesNotMatch(v4Block, /public-document-view|@media\s+print/)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/visual-system-v4-audit.mjs`
Expected: FAIL until the V4 block is properly scoped.

- [ ] **Step 3: Write minimal implementation**

Scope surface rules to the authenticated app shell; preserve tables, forms, and overflow wrappers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run audit:visual && npm run audit:ui-mobile && node scripts/business-document-studio-audit.mjs && git diff --check`
Expected: PASS.

### Task 5: Audit localization and final verification

**Files:**
- Modify: visible localization sources only where a malformed character or broken interpolation is proven
- Modify: `v0-app/scripts/visual-system-v4-audit.mjs`
- Test: `v0-app/scripts/visual-system-v4-audit.mjs`

- [ ] **Step 1: Write failing source checks for proven malformed characters in touched visual-copy sources**

```js
assert.doesNotMatch(touchedCopy, /\uFFFD|\?(?=[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű])/)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/visual-system-v4-audit.mjs`
Expected: FAIL only for a proven malformed visible string.

- [ ] **Step 3: Write minimal implementation**

Correct only proven malformed strings through existing localization maps; do not bulk-rewrite dictionaries or business data.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsc --noEmit --incremental false && npm run build && npm run audit:business-operating-system && npm run audit:visual && npm run audit:ui-mobile && git diff --check`
Expected: PASS.

### Task 6: Final review and checkpoint

**Files:**
- Review: every changed file against `4a6b797d999d7d8e2004ca819c039432cb0de05b`

- [ ] **Step 1: Confirm protected paths have no diff**

Run: `git diff --name-only 4a6b797d999d7d8e2004ca819c039432cb0de05b..HEAD -- src migrations wrangler.jsonc .github`
Expected: no output.

- [ ] **Step 2: Inspect responsive source constraints and run final branch checks**

Run: `git diff --check && git status --short`
Expected: PASS with only intentional V4 files.

- [ ] **Step 3: Create a local visual-system checkpoint only after all gates pass**

Do not push or deploy unless separately approved.
