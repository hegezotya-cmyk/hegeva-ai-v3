# Ügyfél-visszatérési nézet — ellenőrzési jelentés

## Elkészült funkció

Az Ügyfelek oldalon új „Újra megkeresendő” nézet, opcionális utolsó kapcsolatfelvételi dátum, tényeken alapuló besorolás és szerkeszthető, másolható üzenet-előnézet készült. A nézet a meglévő ügyféladatokat használja. Az előnézet nem küld vagy ment üzenetet, és nem módosít ügyfélrekordot.

Aktív ügyfél esedékes utánkövetéssel vagy legalább 90 napja rögzített kapcsolatfelvétellel kerül a listába. Jövőbeli utánkövetés elhalasztja a javaslatot. Hiányzó dátum nem igazol inaktivitást; a létrehozás és szerkesztés dátuma nem helyettesíti a kapcsolatfelvételt.

## Bizonyított eredmények

- Számítási tesztek: PASS — 89/90/91 nap, hibás és hiányzó dátum, szökőnap, helyi naptári nap és óraátállítás, státuszok, jövőbeli utánkövetés, stabil sorrend, változatlan bemeneti rekordok.
- Böngészős tesztek helyi tesztadatokkal: PASS — szűrés, keresés, mező mentése/újratöltése, ismeretlen rekordmező megőrzése, előnézet és másolás írási/küldési mellékhatás nélkül, másolási hiba, törlés, fiókváltás, későn befejeződő másolás, betöltési állapot, öt nyelv, 390 és 1440 pixel széles nézet.
- Három külön kódáttekintési regresszió: PASS — londoni nyári éjfél, billentyűzetes megnyitás/fókuszvisszaadás, másolás közbeni szövegmódosítás. Mindhárom teszt reprodukálta a hibát a javítás előtt.
- Biztonsági audit: PASS — az előnézetben nincs hálózati vagy mentési út; a valódi exportált éles CSP-fejlécek tesztjelzővel és anélkül sem engednek `unsafe-eval` végrehajtást.
- TypeScript ellenőrzés: PASS.
- Végső teljes helyi kiadási ellenőrzés: PASS — Worker-szintaxis, helyi migrációs ellenőrzés, telepítési próba, teljes roadmap-auditkészlet, TypeScript, normál Next.js-build és Cloudflare OpenNext-build. A kódáttekintés javításai után is végigfutott.
- CSP negatív próba: PASS — az éles fejlécbe ideiglenesen bevezetett hibás `unsafe-eval` engedélyt az audit elutasította. A próba az eredeti konfigurációt visszaállította, majd az érvényes konfiguráció auditja ismét PASS lett.

## Kódáttekintés

Külön, csak olvasó kódáttekintés történt. Kritikus hiba nem volt. A két fontos jelzés és a két további jelzés javítva: egységes helyi dátum az utánkövetési vezérlőkben; megnyitáskor fókusz az előnézeten, bezáráskor az eredeti gombon; régebbi szövegre befejeződő másolás nem jelez sikert az új szövegnél; a CSP-audit a tényleges fejlécet ellenőrzi másolt feltétel helyett.

## Megvalósítói döntések

- A meglévő elkülönített munkapéldányt használtuk, a friss `899c77d` éles alapra épített külön fejlesztési ágon. A Windows alatt a munkanaplóhoz natív parancsok helyettesítik a skill POSIX segédprogramjait; ez nem termékváltozás.
- A helyi böngészős teszthez `HEGEVA_UI_TEST=1` mód készült: kikapcsolja a távoli fejlesztői API-kapcsolatot, és kizárólag fejlesztői környezetben engedi a webpack által igényelt evalt. Az éles fejléc változatlanságát valódi konfigurációs teszt ellenőrzi. Ha a környezeti feltétel hibás lenne, biztonsági eltérést okozhatna; ezért szerepel a kiadási ellenőrzésben.
- A másolási visszajelzés és a CSP-teszt két kisebbnek jelölt észrevételét is kötelező javításként kezeltük: félrevezető sikerjelzést, illetve téves biztonsági bizonyosságot előznek meg. Nincs elhalasztott kódáttekintési észrevétel.
- A közös munkaterület-hook már meglévő egyidejű mentési viselkedését nem alakítottuk át. Ez külön vizsgálati kör; a funkció nem tesz új garanciát a teljes mentési rendszerre. Az új előnézet fiókváltási és másolási életciklusát külön teszt ellenőrzi.

## Kiadási határ

Ezek helyi, tesztadatokkal végzett bizonyítások. Valódi bejelentkezett staging mentés/újratöltés és távoli Linux CI még szükséges élesítés előtt. Nem történt feltöltés, PR, staging telepítés, főági összeolvasztás vagy éles kiadás. Nem módosult adatbázisséma vagy külső üzenetküldés.

## Ismétlés

A `v0-app` könyvtárból: `npm run test:customer-reengagement`; `npx tsc --noEmit --incremental false`.

Helyi tesztkiszolgálóhoz `HEGEVA_UI_TEST=1 npm run dev -- --webpack --port 3018`, majd külön folyamatban `npm run test:customer-reengagement-browser`. Windows alatt a környezeti változót PowerShell-szintaxissal kell beállítani. Szükség esetén a `PLAYWRIGHT_BROWSERS_PATH` mutasson a telepített böngészőkre. A teszt minden API-hívást tesztválasszal szolgál ki.

A teljes helyi kiadási ellenőrzés a repository gyökeréből: `npm run release:check`. Ez helyi migrációs ellenőrzést és telepítési próbát futtat; nem telepít éles rendszert.
