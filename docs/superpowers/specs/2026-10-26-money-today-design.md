# Mai pénzügyi teendők — Design

## Szándék

Legyen egyetlen, könnyen érthető oldal, amely megmutatja egy kisvállalkozónak, hogy melyik ügyfélhez kapcsolódó következő lépés segíthet leginkább pénzt beszedni vagy munkát szerezni. A HEGEVA már felismeri a lejárt számlákat és a lejárt ajánlatokat; ez a fejlesztés ezeket teszi napi használatban láthatóvá és cselekvésre kész állapotba.

## Jelenlegi állapot

A `core-v1` döntési logika már előállítja a lejárt számla-, régi ajánlat- és ügyfél-utánkövetési jelzéseket, valamint jóváhagyásra váró emlékeztető-vázlatokat. Ezek jelenleg a Command Center, az Intelligence és az üzenetkezelő felülete között oszlanak meg, ezért egy elfoglalt vállalkozó nem kap egyetlen világos napi listát.

## Célok

- Új, hitelesített `Mai pénzügyi teendők` nézet a meglévő üzleti felületen.
- Legfeljebb öt, fontosság szerint rendezett tétel: lejárt számla, régi ajánlat, esedékes ügyfél-utánkövetés.
- Tételenként rövid indok, összeg ahol számítható, és egy biztonságos belső gomb a megfelelő meglévő oldalra vagy üzenetvázlathoz.
- A felület kizárólag a bejelentkezett felhasználó saját munkaterületének adatait használja.
- A rendszer csak vázlatot készít vagy a meglévő vázlathoz irányít; üzenetet, számlát vagy fizetési kérést nem küld el önállóan.

## Nem célok

- Nincs automatikus e-mail-, SMS- vagy WhatsApp-küldés.
- Nincs új Stripe-fizetési folyamat, adatbázis-migráció vagy ügyfélportál-jogosultság-változtatás.
- Nincs új, személyes adatokat tartalmazó tulajdonosi analitika vagy harmadik fél felé történő adatküldés.

## Megvizsgált megoldások

1. A jelenlegi Command Center szövegének átírása. Kisebb változás, de továbbra sem ad külön, napi munkalistát.
2. Új `Mai pénzügyi teendők` oldal a meglévő Core-jelzésekre építve. A kiválasztott megoldás: a szabályok és vázlatok nem duplikálódnak, csak világos felületet kapnak.
3. Teljesen új behajtási automatizmus. Nagyobb kockázatot és külső kommunikációt jelentene, ezért nem része ennek a körnek.

## Tervezett működés

Az oldal ugyanabból a hitelesített workspace-adatforrásból kér le Core-jelzéseket, mint a Command Center. Csak a pénzhez vagy ajánlat-utánkövetéshez közvetlenül kapcsolódó jelzéseket tartja meg, a prioritási érték alapján rendezi őket, majd öt tételnél levágja a listát.

Minden tétel tartalmazza a típust, az emberi nyelvű okot, a darabszámot, szükség esetén a GBP-összeget, valamint a megfelelő belső útvonalat. A gombok a meglévő jóváhagyási folyamatba vezetnek. Ha nincs teendő, az oldal ezt egyértelműen jelzi, és nem állít bevételi eredményt vagy fizetési sikert.

## Védelem és mérés

- Az oldalt az alkalmazás meglévő hitelesítése védi; az API kizárólag a munkamenet felhasználójának adatait használhatja.
- Nem kerül új személyes adat a naplókba vagy analitikába.
- Csak összesített, tulajdonosi mérés készülhet későbbi külön jóváhagyással: megnyitás, cselekvésre kattintás, jóváhagyott vázlat. Nem mérjük az üzenetek tartalmát.

## Ellenőrzés

- Egységteszt a rendezésre, az ötös korlátra és a lejárt számla / régi ajánlat / utánkövetés besorolására.
- Jogosultsági teszt: az endpoint nem ad vissza más felhasználó munkaterületéről adatot.
- Felületi teszt üres és több teendős állapotra, mobilon és asztali nézetben.
- Meglévő Core-, billing-, portál- és TypeScript/build-ellenőrzések futtatása a kiadás előtt.

## Nyitott döntés

Az első verzió belső oldalakra és a már meglévő vázlat-jóváhagyásra vezet. Közvetlen e-mail/SMS küldést csak külön termék- és jogi döntés után szabad hozzáadni.
