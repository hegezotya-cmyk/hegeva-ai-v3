# Ügyfél-visszatérési nézet — rövid terv

## Cél és választott megoldás

Az ügyfél a meglévő `/business/customers` oldalon, az „Újra megkeresendő” szűrővel lássa, mely aktív ügyfelekkel érdemes felvennie a kapcsolatot, milyen rögzített tény alapján, és milyen üzenettel indulhat el.

A felhasználó az Ügyfelek oldalába épített nézetet választotta. A külön központ több részletnek adna helyet, de új oldalt és párhuzamos ügyféllistát hozna létre; ezért nem ezt készítjük.

## Meglévő alapok és adathiány

Az oldal a `LocalWorkspace` komponenst és a `useWorkspaceData` ügyfélrekordjait használja. Már van keresés, aktív/érdeklődő/szüneteltetett státusz és esedékes utánkövetés szűrő. A rekord `createdAt` mezője létrehozási dátum, nem utolsó kapcsolatfelvétel. Az általános `updatedAt` sem igazol ügyfélkapcsolatot.

## Viselkedés

- Megmarad a „Minden ügyfél” és az „Utánkövetést igényel” nézet; melléjük kerül az „Újra megkeresendő”. A keresés mindegyikre érvényes.
- Az új nézet kizárólag aktív ügyfeleket mutat. Érdeklődő és szüneteltetett ügyfél nem kerül bele.
- Bekerül egy opcionális, tulajdonos által rögzíthető „Utolsó kapcsolatfelvétel” dátum az ügyfél szerkesztőjébe. Meglévő rekordnál hiányozhat; a többi adat szerkesztése megőrzi. Jövőbeli és érvénytelen dátum nem menthető ebbe a mezőbe.
- Megjelenési ok: esedékes vagy lejárt utánkövetés, illetve legalább 90 napja rögzített utolsó kapcsolatfelvétel. Jövőbeli utánkövetés esetén nem sürgeti korábbi megkeresésre az ügyfelet. A 90 nap az első verzió egyszerű, egyértelműen feltüntetett küszöbe.
- Az esedékes utánkövetés elsőbbséget élvez; azon belül a legrégebbi dátum kerül előre. Ezután a legrégebbi kapcsolatfelvétel következik. Egyezésnél stabil rekordazonosító szerinti sorrend.
- Minden találat mutatja a nevet, az okot, az utánkövetési dátumot és az utolsó rögzített kapcsolatfelvételt. Hiányzó kapcsolatdátum: „Nincs rögzítve”. Dátum nélküli rekordot nem nevezünk inaktívnak.
- Ha nincs elég adat a besoroláshoz, a nézet megmagyarázza, hogy utánkövetési vagy kapcsolatfelvételi dátum rögzítésével válhat használhatóvá. Az üres találat nem állítja, hogy minden ügyfél aktív kapcsolatban van.
- Az „Üzenet előkészítése” gomb megnyit egy helyi, szerkeszthető előnézetet, az ügyfél nevével és semleges érdeklődő szöveggel. Nem állít korábbi munkát, vásárlást vagy ígéretet, amelyre nincs adat. A felhasználó másolhatja a szöveget; egyértelmű címke jelzi, hogy ez még nincs elküldve vagy elmentve az Üzenetek közé.
- A nézet megnyitása és az üzenet előkészítése nem jelöl teljesítettnek utánkövetést és nem írja át a kapcsolatfelvételi dátumot.

## Megvalósítói döntések és korlátok

A meglévő React/TypeScript felületet és ügyfél-adatmentést használjuk. A dátum opcionális mező a meglévő rekordban; nem tervezünk adatbázis-migrációt. A mező megőrzését felhőmentés és újratöltés után ellenőrizni kell. A funkció követi a meglévő felület öt nyelvét és mobilos elrendezését.

Nincs automatikus küldés, új üzenetküldő szolgáltatás, címzett-következtetés a szabad szöveges kontaktmezőből, fizetés vagy automatikus rekordmódosítás. Az előnézet nem kerül mérési eseménybe vagy naplóba. A komponens ugyanazt az ügyféllistát használja, mint a meglévő oldal; nem épít külön adatbetöltést vagy vendégeknek új hozzáférést. Munkaterületváltáskor az előnézet bezárul és tartalma törlődik. A felhő ellenőrzése alatt nincs végleges üresállítás; hiba vagy helyi mód esetén a meglévő szinkronállapot látható marad.

## Ellenőrzés és kiadás

Célzott tesztek: 89/90/91 napos határ, helyi naptári nap kezelése, esedékes/lejárt/jövőbeli utánkövetés, hiányzó és hibás dátum, szüneteltetett/érdeklődő kizárása, keresés és stabil sorrend. Ellenőrizendő a mező mentése/újratöltése, a munkaterületváltás, a másolási hiba visszajelzése és az, hogy előnézet nem indít küldést vagy írást. TypeScript, meglévő auditok, build, majd mobil/asztali staging próba következik. Élesítés külön, a konkrét eredmények bemutatása után.
