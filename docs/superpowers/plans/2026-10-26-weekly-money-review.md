# Heti pénzügyi áttekintő Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Külön heti oldal adjon biztonságos, tulajdonosi áttekintést a három legfontosabb pénzügyi utánkövetésről.

**Architecture:** Az oldal a meglévő `useCoreDecision()` válaszból képez tömör, legfeljebb három elemű áttekintést. Egy tiszta, keretrendszertől független `weekly-money-review.ts` felel az adatválasztásért; a kliens komponens kizárólag megjeleníti azt és a már jóváhagyott felülvizsgálati céloldalakra navigál.

**Tech Stack:** Next.js, React, TypeScript, meglévő HEGEVA Core API, Tailwind CSS, Node-alapú auditok.

**Spec:** `docs/superpowers/specs/2026-10-26-weekly-money-review-design.md`

## Global Constraints

- Kizárólag az éppen bejelentkezett felhasználó meglévő Core-adatát használhatja.
- Nincs adatbázis-migráció, új külső kapcsolat, e-mail-küldés, Stripe-művelet vagy háttérfolyamat.
- Nem jeleníthet meg egyedi ügyfélnevet, teljes dokumentumot, nyers megosztási linket vagy ügyfélüzenetet.
- A képernyő minden eleme meglévő, jóváhagyást igénylő felülvizsgálati felületre vezet.

## Review Focus

- Nulla vagy hibás darabszám nem hozhat létre teendőt; ezt a szelektor tesztje rögzíti az 1. feladatban.
- Azonos szabály többször sem jelenhet meg kétszer; ezt a szelektor tesztje rögzíti az 1. feladatban.
- Nem GBP vagy érvénytelen összeg nem jelenhet meg pénzösszegként; ezt a szelektor tesztje rögzíti az 1. feladatban.
- Nem hitelesített és nem elérhető Core-válasznál az oldal nem mutathat félrevezető heti eredményt; ezt a komponens auditja rögzíti a 2. feladatban.
- A heti oldal nem indíthat kézbesítési vagy módosító hálózati műveletet; ezt a statikus biztonsági audit rögzíti a 3. feladatban.

---

### Task 1: Heti áttekintő adatmodell és szelektor

**Files:**
- Create: `v0-app/lib/weekly-money-review.ts`
- Create: `v0-app/lib/weekly-money-review.test.ts`

**Interfaces:**
- Consumes: `CoreDecisionResponse` a `v0-app/lib/use-core-decision.ts` fájlból.
- Produces: `selectWeeklyMoneyReview(response: CoreDecisionResponse): WeeklyMoneyReviewAction[]` és `getWeeklyMoneyReviewState(status, actions): WeeklyMoneyReviewState`.

- [ ] **Step 1: Write the failing selector contract test**

Írd meg a tesztet, amely a három jogos kategóriát prioritás szerint `overdue-invoices`, `stale-quotes`, `customer-followups` sorrendben várja, a meglévő belső céloldalakkal.

- [ ] **Step 2: Run the selector test to verify it fails**

Run: `node --experimental-strip-types v0-app/lib/weekly-money-review.test.ts`

Expected: FAIL, mert a modul még nem létezik.

- [ ] **Step 3: Implement the minimal selector**

Valósítsd meg a pontos exportokat. A szelektor csak pozitív darabszámú, első előfordulású szabályt fogadjon el, prioritás szerint rendezzen, maximum három elemet adjon vissza, és csak a meglévő GBP Opportunity Radar értéket mutassa összegként.

- [ ] **Step 4: Run the selector test to verify it passes**

Run: `node --experimental-strip-types v0-app/lib/weekly-money-review.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add v0-app/lib/weekly-money-review.ts v0-app/lib/weekly-money-review.test.ts
git commit -m "feat: add weekly money review selector"
```

### Task 2: Heti áttekintő oldal és navigáció

**Files:**
- Create: `v0-app/components/business/weekly-money-review.tsx`
- Create: `v0-app/app/business/weekly-review/page.tsx`
- Modify: `v0-app/app/business/page.tsx`
- Modify: `v0-app/components/business/money-today.tsx`

**Interfaces:**
- Consumes: `selectWeeklyMoneyReview` és `getWeeklyMoneyReviewState` az 1. feladatból.
- Produces: az autentikált tulajdonos számára elérhető `/business/weekly-review` felület.

- [ ] **Step 1: Write the failing component-navigation audit**

Az audit várja a heti oldal útvonalát a Business Hubban és a „Mai pénzügyek” oldalon, valamint a három belső, jóváhagyást igénylő céloldalt.

- [ ] **Step 2: Run the audit to verify it fails**

Run: `node v0-app/scripts/weekly-money-review-audit.mjs`

Expected: FAIL, mert az oldal és a navigáció még nem létezik.

- [ ] **Step 3: Implement the weekly review UI**

Hozd létre a kliens komponenst az `useCoreDecision()` használatával. A `loading`, `unauthenticated`, `unavailable`, `empty` és `ready` állapot legyen külön érthető. A `ready` állapot csak összesített kategóriát, darabszámot és biztonságos GBP összeget mutathat; az akciógombok `Link` elemek legyenek.

- [ ] **Step 4: Add the two discovery links**

A Business Hub kapjon heti áttekintő modult. A „Mai pénzügyek” oldal kapjon ugyanoda mutató, nem küldő szöveges linket.

- [ ] **Step 5: Run the audit to verify it passes**

Run: `node v0-app/scripts/weekly-money-review-audit.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v0-app/components/business/weekly-money-review.tsx v0-app/app/business/weekly-review/page.tsx v0-app/app/business/page.tsx v0-app/components/business/money-today.tsx v0-app/scripts/weekly-money-review-audit.mjs
git commit -m "feat: add owner weekly money review"
```

### Task 3: Biztonsági kapu, CI és teljes ellenőrzés

**Files:**
- Modify: `v0-app/package.json`
- Modify: `.github/workflows/main.yml`
- Modify: `v0-app/scripts/weekly-money-review-audit.mjs`

**Interfaces:**
- Consumes: a 2. feladat kész útvonalai és komponense.
- Produces: `audit:weekly-money-review` parancs és CI-védelem.

- [ ] **Step 1: Extend the failing audit with delivery-safety assertions**

Az audit hibázzon, ha a heti oldal `fetch`, `POST`, e-mail-előkészítő vagy kézbesítési hívást tartalmazna.

- [ ] **Step 2: Run the audit to verify it fails**

Run: `node v0-app/scripts/weekly-money-review-audit.mjs`

Expected: FAIL, amíg a csomag script és CI-kapu hiányzik.

- [ ] **Step 3: Add the package script and CI step**

Az `audit:weekly-money-review` futtassa a statikus auditot. A `.github/workflows/main.yml` építési ellenőrzése futtassa azt a TypeScript ellenőrzés előtt.

- [ ] **Step 4: Run focused verification**

Run: `npm --prefix v0-app run audit:weekly-money-review`

Expected: PASS.

- [ ] **Step 5: Run regression verification**

Run: `npm --prefix v0-app run audit:money-today && npm --prefix v0-app run audit:ui-mobile && npx --prefix v0-app tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v0-app/package.json v0-app/scripts/weekly-money-review-audit.mjs .github/workflows/main.yml
git commit -m "test: protect weekly money review"
```

### Task 4: Staging and release verification

**Files:**
- Modify: `.superpowers/sdd/2026-10-26-weekly-money-review/progress.md`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: evidence-backed staging result and, after owner-authorized promotion, production release evidence.

- [ ] **Step 1: Run the full Linux CI on the exact feature commit**

Expected: worker checks, TypeScript, normal Next build, Cloudflare build, mobile audit and weekly review audit all PASS.

- [ ] **Step 2: Deploy UI-only to staging**

Use the protected staging route. Do not deploy API or run a D1 migration.

- [ ] **Step 3: Verify staging in a real authenticated browser**

Expected: the weekly page loads, shows only aggregate business categories, and every available review link remains internal and non-sending.

- [ ] **Step 4: Restore temporary staging branch protection**

Expected: only `v0-rebuild` remains authorized for staging deployment.

- [ ] **Step 5: Require owner approval before production promotion**

Expected: no production push until explicit approval follows staging PASS.
