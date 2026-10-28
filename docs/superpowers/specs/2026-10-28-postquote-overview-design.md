# Elfogadott ajánlat — kapcsolódó lépések áttekintése

## Cél és megközelítés

A felhasználó az elfogadott ajánlat mellett megjelenő „Következő lépések” megoldást választotta. A feltárás igazolta, hogy a számlavázlat, a Tervező-feladatok és az utánkövetési piszkozatok már léteznek. Ezért az első változat ezeket mutatja együtt és a meglévő műveletekhez vezet; nem épít új munkakezelőt vagy új létrehozási folyamatot.

Alternatíva volt a Tervező központi bővítése, de az több oldalváltást igényelne. Az ajánlat melletti áttekintés marad a választott irány. A szűkítés a forráskód és meglévő tesztek áttekintése után történt, és a felhasználó ezt jóváhagyta.

## Megjelenés és működés

- A mentett, elfogadott vagy már számlázott ajánlathoz nyitható áttekintés mutatja a kapcsolt feladatokat, a számlát vagy számlavázlatot és a következő rögzített utánkövetést. Nem mentett, piszkozat vagy elküldött, de el nem fogadott ajánlatnál nem állít kész munkafolyamatot.
- Feladat: cím, határidő és nyitott/elvégzett állapot a Tervezőből. Általános kapcsolt feladatot nem nevezünk bizonyított elvégzett munkának. A megnyitás a meglévő Tervezőbe vezet.
- Utánkövetés: a kapcsolt piszkozat meglévő állapota és érvényes rögzített dátuma. A piszkozat, jóváhagyott vagy „completed” állapot önmagában nem bizonyítja, hogy üzenet kézbesült. Több dátumnál a legkorábbi esedékes/lejárt, ennek hiányában a legközelebbi jövőbeli dátum jelenik meg. A forrás és az állapot látható; nincs becsült vagy automatikusan választott utánkövetési nap.
- Számla: a bizonyíthatóan kapcsolt számla állapota jelenik meg; a fizetett állapot csak a mentett számlastátuszból olvasható. Nem keverjük össze a számlavázlatot a kiállított vagy fizetett számlával.
- A meglévő „Számla készítése” művelet az eddigi helyén és feltételeivel marad. Az áttekintés nem hoz létre számlát vagy feladatot, és nem készít új üzenetet; a felület megnyitása és ismételt kattintása csak olvasási/navigációs művelet.
- Hiányzó kapcsolatnál „Nincs rögzített kapcsolat” jelzés és a megfelelő meglévő modul megnyitása következik. Ez nem jelenti azt, hogy a munkaterületen egyáltalán nincs feladat vagy számla. Nem ígérünk célrekordra ugrást, ha a célmodul azt még nem támogatja.

## A kapcsolatok bizonyítása

- Feladat vagy piszkozat közvetlenül az ajánlat stabil azonosítójára mutató `sourceId` alapján kapcsolható.
- Az Egykattintásos üzleti folyamatban az azonos, teljes futásazonosítóból származó `one-click:<run>:quote` és `one-click:<run>:task` eredetjelölés használható. Csak a teljes, érvényes jelölést párosítjuk, nem részszöveget vagy hasonló nevet.
- Számlánál explicit `sourceQuoteId`, illetve az Egykattintásos folyamatból bizonyítható, változatlan eredetjelölés olvasható. Ha explicit kapcsolat más ajánlatra mutat, azt régebbi szöveges jelölés nem írhatja felül.
- A régi számlakonverzió megjegyzésbe írja az ajánlatszámot (`Created from quote ...`). Ezt legfeljebb külön, ellenőrizendő régi hivatkozásként mutatjuk, teljes első sor-egyezéssel és csak egyedi, nem üres ajánlatszámnál. Nem bizonyított kapcsolat, nem alapján történik fizetési vagy munkaállapot-összesítés. Azonos nevű ügyfél, összeghasonlóság, tetszőleges megjegyzésrészlet vagy ajánlatszám-előtag nem elég.
- Új kapcsolati mezőt ez az első változat nem ír, és régi rekordot nem kapcsol össze utólag automatikusan. Több találatot felsorol, nem választ ki hallgatólagosan egyet.

## Korlátok és ellenőrzés

A meglévő bejelentkezett munkaterület-hookokból olvasunk, nincs új API, adatbázis-migráció, automatikus küldés vagy külső kapcsolat. Betöltés, helyi mód és szinkronhiba külön látható; hibánál nem állítjuk, hogy a teljes felhőben nincs találat. Fiókváltáskor a nyitott ajánlat-áttekintés azonnal eltűnik. A meglévő öt nyelvet és a mobilos elrendezést megtartjuk.

Célzott tesztek fedik a közvetlen és Egykattintásos kapcsolatokat; az azonos nevet és ajánlatszám-előtagot; az üres, hibás és kétértelmű adatokat; a több találatot; a feladat- és üzenetállapotok őszinte jelölését; a helyi naptári dátumokat; a betöltési, hibás és fiókváltási állapotokat; valamint az írási mellékhatás hiányát. A meglévő ajánlatkonverziós és utánkövetési teszteknek zöldnek kell maradniuk. TypeScript, build, külön kódáttekintés és valódi bejelentkezett mobil/asztali staging próba mindig szükséges élesítés előtt. A staging engedélyek ideiglenes módosítása csak külön felhasználói jóváhagyással történhet.
