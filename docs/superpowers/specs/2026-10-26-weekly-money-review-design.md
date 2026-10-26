# Heti pénzügyi áttekintő — rövid terv

## Cél

Egy külön, tulajdonosnak szóló oldal heti összképet ad a saját munkaterület aktuális pénzügyi teendőiről. Segít eldönteni, melyik három ügyet érdemes először kezelni, de sem e-mailt, sem más külső műveletet nem indít el.

## Felhasználó és siker

Kisvállalkozó tulajdonosok (építőipar, kereskedelem, takarítás és más szolgáltatók). A siker: egyetlen képernyőn látják a lejárt számlákat, az utánkövetésre váró ajánlatokat és az esedékes ügyfél-utánkövetéseket, összesített darabszámmal és csak akkor GBP összeggel, ha azt a meglévő rendszer már megbízhatóan szolgáltatja.

## Választott megoldás

Új `/business/weekly-review` oldal a meglévő `useCoreDecision()` adatra építve. A három kategóriából legfeljebb három, prioritás szerint rendezett teendőt jelenít meg. Minden teendő a meglévő, tulajdonosi felülvizsgálati felületre visz:

- lejárt számla → fizetési utánkövetés;
- elakadt ajánlat → ajánlati utánkövetés;
- ügyfél-utánkövetés → ügyfélkezelés.

Az új oldal a Business Hubról és a „Mai pénzügyek” oldalról lesz elérhető. A mobil és az asztali nézet ugyanazokat az adatokat mutatja.

## Elutasított alternatívák

- A „Mai pénzügyek” oldalba épített heti blokk: gyorsabb lenne, de a napi döntési felületet zsúfolná.
- Heti automatikus e-mail: jelenleg nem megfelelő, mert hozzájárulást, ütemezést és külön kézbesítési garanciákat igényelne.

## Korlátok

- Kizárólag az éppen bejelentkezett felhasználó saját, már elérhető Core-adatát használja.
- Nincs adatbázis-migráció, új külső kapcsolat, e-mail-küldés, Stripe-művelet vagy háttérfolyamat.
- Nem jelenít meg egyedi ügyfélnevet, teljes dokumentumot vagy nyers megosztási linket.
- Hibás vagy nem elérhető adatnál világos, nem félrevezető állapotot mutat.

## Bizonyítás

Egységteszt ellenőrzi a három kategória sorrendjét, a biztonságos céloldalakat és az üres/hibás állapotot. Egy statikus audit ellenőrzi, hogy nincs kézbesítési hívás. Fut a TypeScript-, mobil- és normál/Cloudflare-build ellenőrzés, majd staging böngészőteszt. Csak ezek után kerülhet productionbe.
