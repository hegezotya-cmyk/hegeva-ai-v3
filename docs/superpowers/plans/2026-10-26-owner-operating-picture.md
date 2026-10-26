# Vezetői összkép Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** A meglévő Üzleti intelligencia oldalon jelenjen meg egy pontos, összesített vezetői összkép.

**Architecture:** Egy tiszta segédfüggvény számolja a meglévő ügyfél-, dokumentum- és feladatrekordokból a mérőszámokat és a három biztonságos belső figyelmeztetést. A meglévő komponens ezt jeleníti meg, külső hívás vagy írás nélkül.

**Tech Stack:** Next.js, React, TypeScript, meglévő workspace hookok és Tailwind.

**Spec:** `docs/superpowers/specs/2026-10-26-owner-operating-picture-design.md`

## Global Constraints

- Csak a belépett felhasználó saját, meglévő munkaterületi rekordjai.
- Nincs e-mail, rekordmódosítás, fizetés, adatbázis-migráció vagy új külső kapcsolat.
- Nincs ügyfélnév vagy egyedi dokumentumtartalom a vezetői összképben.

### Task 1: Vezetői összkép számítása

**Files:**
- Create: `v0-app/lib/owner-operating-picture.ts`
- Create: `v0-app/lib/owner-operating-picture.test.ts`

- [ ] Írj hibázó tesztet a mérőszámokra, üres adatkészletre és a három belső céloldalra.
- [ ] Futtasd: `node --experimental-strip-types v0-app/lib/owner-operating-picture.test.ts` — elvárt: FAIL.
- [ ] Valósítsd meg a `selectOwnerOperatingPicture(...)` függvényt minimálisan.
- [ ] Futtasd újra a tesztet — elvárt: PASS.
- [ ] Commit: `feat: add owner operating picture selector`.

### Task 2: Megjelenítés és biztonsági audit

**Files:**
- Modify: `v0-app/components/business/business-intelligence-center.tsx`
- Create: `v0-app/scripts/owner-operating-picture-audit.mjs`
- Modify: `v0-app/package.json`
- Modify: `.github/workflows/main.yml`

- [ ] Írj hibázó auditot: követelje meg az összkép megjelenítését és tiltsa a `fetch`, `POST`, email- és író hívásokat az új összképhez.
- [ ] Futtasd az auditot — elvárt: FAIL.
- [ ] Építsd be az összképet az Üzleti intelligencia oldal tetejére, csak kategória-, darabszám- és biztonságos összegszinten.
- [ ] Add a csomagscriptet és CI-lépést.
- [ ] Futtasd: audit, TypeScript, mobil audit, normál és Cloudflare build.
- [ ] Commit: `feat: add owner operating picture`.

### Task 3: Staging és kiadási ellenőrzés

- [ ] Linux CI az exact feature commiton.
- [ ] Staging UI-only telepítés; API és D1-migráció nélkül.
- [ ] Autentikált staging böngészőteszt.
- [ ] Ideiglenes staging ágengedély visszaállítása.
- [ ] Production csak külön tulajdonosi jóváhagyás után.
