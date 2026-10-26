# Vezetői összkép — rövid terv

## Cél

A meglévő Üzleti intelligencia oldalon egy könnyen áttekinthető vezetői összkép mutassa a vállalkozás aktuális működésének legfontosabb, valós mérőszámait.

## Megoldás

A meglévő heti jelentés blokk fejlődik „Vezetői összképpé”. Az aktuális munkaterületi adatokból, helyben számolva jelenik meg: ügyfelek száma, utóbbi 7 nap új ügyfelei, kifizetett bevétel, kintlévőség, nyitott feladatok, valamint három felülvizsgálatra váró jelzés (lejárt számla, elakadt ajánlat, esedékes ügyfél-utánkövetés). A jelek a meglévő belső felülvizsgálati oldalakra vezetnek.

## Korlátok

- Kizárólag az éppen bejelentkezett felhasználó saját, meglévő munkaterületi rekordjait használja.
- Nem jelenít meg ügyfélnevet a vezetői összképben.
- Nem küld emailt, nem készít vázlatot, nem módosít rekordot és nem indít fizetést.
- Nincs adatbázis-migráció vagy új külső kapcsolat.
- Üres adatkészletnél tényszerű, nem félrevezető nullás állapot jelenik meg.

## Alternatívák

- Külön mérőfal oldal: elutasítva, mert a Riportok és az Üzleti intelligencia már lefedi ezt a területet.
- Heti pénzügyi áttekintőbe építés: elutasítva, mert az kizárólag pénzügyi döntésekre szolgál.

## Bizonyítás

Teszt rögzíti a helyes összesítést, az üres állapotot és a biztonságos belső céloldalakat. Statikus audit tiltja a küldési és módosító hívásokat. TypeScript-, mobil-, normál- és Cloudflare-build ellenőrzés, majd staging böngészőteszt szükséges kiadás előtt.
