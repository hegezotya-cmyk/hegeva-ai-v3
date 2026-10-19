# One-Click Business kezelhetőségi fejlesztés

## Cél

A 90 másodperces üzleti indítás legyen könnyen használható mobilon és asztali gépen azoknak a brit kisvállalkozóknak is, akik ritkán használnak üzleti szoftvert. A felhasználó kevesebb gépeléssel jusson el az ellenőrizhető ajánlat-előnézetig, félbehagyott munkája maradjon meg, és a létrehozás után egyértelmű következő lépést kapjon.

## Hatókör

A fejlesztés a meglévő `/business/launch` folyamatot bővíti. Nem készül új háttérrendszer, automatikus üzenetküldés vagy önálló számlázási alrendszer. Az ügyfél, az ajánlattervezet és a Planner-feladat továbbra is csak kétlépcsős tulajdonosi jóváhagyás után jön létre.

## Felhasználói folyamat

1. A felhasználó választhat gyorsindító mintát: festő, építő/kőműves, takarító, villanyszerelő vagy kisbolt.
2. A minta előkészíti a gyakori szolgáltatás megnevezését, a GBP pénznemet és a 14 napos ajánlati érvényességet. Az adókulcsot a rendszer nem találja ki szakma alapján; az látható és szerkeszthető marad.
3. Az adatlap három részre tagolódik: **Ügyfél**, **Munka**, **Ár és határidő**. Az opcionális e-mail-mező külön, egyértelmű jelölést kap.
4. A felhasználó új ügyfelet írhat be, vagy kiválaszthat egy meglévő ügyfelet. A kiválasztás csak a nevet és az e-mailt tölti be, a mentett ügyfélrekordot nem módosítja.
5. A még jóvá nem hagyott adatok egyetlen, felhasználóhoz kötött piszkozatként mentődnek. A kész rekordok létrehozása vagy az „Új lehetőség” művelet törli ezt a piszkozatot, de ügyfél-, dokumentum- és feladatadatot nem töröl.
6. Hibás adatnál a mező alatt jelenik meg a saját hibaüzenete, a fókusz az első hibás mezőre kerül, és az előnézet nem készül el.
7. Mobilon az „Előnézet készítése” művelet könnyen elérhető marad. Az előnézet után a meglévő jóváhagyási lépcső változatlanul működik.
8. Sikeres létrehozás után az elsődleges művelet az **Ajánlat megnyitása**. Az ügyfél, a Planner és az új lehetőség másodlagos választásként marad elérhető.

## Adatmodell és adatvédelem

- A szakmai minták statikus termékadatok, személyes adatot nem tartalmaznak.
- A meglévő ügyfelek a már használt `customers` munkaterületből érkeznek.
- A piszkozat a meglévő munkaterület-szinkronizálási mintát használja, legfeljebb egy aktuális bejegyzéssel.
- A piszkozat nem tartalmaz jelszót, tokent, fizetési adatot vagy üzenettartalmat.
- A gyorsindítás nem küld e-mailt, nem hoz létre külső műveletet, és nem állítja, hogy a felhasználó áfaregisztrált.

## Komponensek

- `lib/one-click-business.ts`: minták, piszkozat-normalizálás és mezőszintű validációhoz szükséges tiszta függvények.
- `components/business/one-click-business.tsx`: szakmaválasztó, háromrészes űrlap, ügyfélválasztó, mezőhibák, piszkozat-visszaállítás és sikeres következő lépés.
- `scripts/one-click-business-audit.mjs`: a teljes biztonsági és használhatósági szerződés ellenőrzése.
- Szükség esetén célzott Node-teszt a tiszta függvények számítására és validációjára.

## Hibakezelés

- A hiányos vagy hibás mező nem engedi az előnézetet; a felhasználó konkrét, lokalizált üzenetet kap.
- Felhőszinkron-hibánál a böngészős példány megmarad, és a meglévő szinkronállapot jelzi a problémát.
- Már nem létező mentett ügyfél kiválasztása nem okoz hibát; a beírt adatok kézzel tovább szerkeszthetők.
- A piszkozat betöltése nem írhatja felül az aktív munkamenetben már begépelt adatot.

## Nyelvek és hozzáférhetőség

Minden új felirat angolul, magyarul, németül, franciául és spanyolul készül. A szakaszcímek, hibák és gombok programozott címkéket kapnak. A billentyűzetes sorrend követi az Ügyfél → Munka → Ár → Előnézet folyamatot.

## Mérhetőség

A meglévő, hozzájáruláshoz kötött `own_business_start` és `own_business_result` események megmaradnak. Új esemény csak összesített, tartalommentes tulajdonságot használhat, például `entry_mode: preset | manual` vagy `customer_mode: existing | new`. Ügyfélnév, e-mail, szolgáltatás vagy ár nem kerül analitikába.

## Ellenőrzés és kiadás

Minden viselkedéshez először hibázó ellenőrzés készül. Kötelező ellenőrzések: célzott One-Click audit, kapcsolódó onboarding- és termékérettségi audit, TypeScript, Next.js build és Cloudflare OpenNext build. Az élesítés kizárólag az `origin/v0-rebuild` ágra, zöld GitHub-ellenőrzések után történhet. Az éles böngészős próba előnézetig megy; nem hoz létre próbaügyfelet, ajánlatot vagy feladatot.

## Megvalósítási sorrend

1. Statikus szakmai minták és háromrészes adatlap.
2. Korábbi ügyfél kiválasztása és egyetlen visszaállítható piszkozat.
3. Mezőszintű hibajelzés, mobil művelet és sikeres következő lépés.
4. Teljes regressziós ellenőrzés, felülvizsgálat és éles próba.
