# HEGEVA AI Growth & Conversion Fix — 2026-11-04

| Terület | Talált hiba | Javítás | Teszteredmény |
|---|---|---|---|
| GA4 | A `uk_trades_nov26` UTM-kampány címkéit a zárt lista eldobta. | Engedélyezett, közérthető címkék: `bio`, `quote_followup`, `priorities` és a négy TikTok-változat. Az attribúció egy munkameneten belül megmarad a Challenge → regisztráció → fizetés-visszatérés útvonalon. | Kampány-attribúciós audit PASS. |
| Consent Mode V2 | Analytics-hozzájáruláskor a Clarity hirdetési tárolást is engedélyezte; újratöltéskor kettős inicializálás kockázata volt. | Analytics-only hozzájárulás: hirdetési tárolás tiltva; kezdeti állapot tiltva; egy consentált életciklus inicializál. | Privacy audit PASS. |
| Netlify referral | A régi `shiny-stardust-e0dcb3.netlify.app` saját legacy forrásként jelent meg. | Csak a pontos legacy host nem kerül külső referralnak productionon; más Netlify és közösségi forrás érintetlen. | 8/referral teszt PASS. |
| Event payload | Egyedi CustomEvent paraméterek átkerülhettek volna GA4-be. | Zárt értékkészlet; e-mail, URL-lekérdezés és üzleti tartalom nem kerül át. | Paraméterteszt PASS. |
| Challenge / regisztráció | Challenge CTA nem volt az egységes elsődleges CTA-mérés része; mobilon az alsó munkaterületi navigáció takarta az űrlapot. | CTA mérhető; login oldalon rövidebb konverziós szöveg és nincs munkaterületi alsó navigáció. | 390px és 1440px helyi böngészőútvonal PASS. |
| Pricing / SEO | Az éles Pricing canonical a főoldalra mutatott; bejelentkezési és kezdő útvonal metaadata kevés volt. | Külön Pricing canonical/OG/meta; noindex marad a login és get-started. Sitemapből törölve az Enterprise útvonal, mert a termékoldal szerint még nem publikus ajánlat. | TypeScript és build PASS. |
| TikTok | Nincs kattintható Website mező a személyes, 18 követős profilon. | Elkészült mérhető Bio/CTA/UTM csomag és hivatalos feltétel-ellenőrzés. | Képernyőképes profil-ellenőrzés korábbi turnben, hivatalos TikTok forrás hivatkozva. |
| Mobilnézet | Login űrlap első mezői részben hajtás alatt voltak. | Rövidebb mobilos bevezető, a nem releváns workspace-nav nélkül. | Helyi 390px útvonalteszt PASS és képernyőkép. |

## KÉSZ

- Consentált, adatminimalizált GA4 eseménykezelés és duplikációvédelem.
- Novemberi Facebook, LinkedIn és TikTok UTM-ek megőrzése.
- Legacy Netlify referral tisztázása a kliensoldali méréssel.
- Challenge → CTA → regisztráció mobil és desktop ellenőrzése szimulált API-val.
- Pricing SEO javítás, route-metaadatok, public sitemap tisztítása.
- TikTok konverziós csomag: [TikTok conversion pack](./2026-11-04-tiktok-conversion-pack.md).

## BLOCKED

- GA4 valós idejű DebugView és friss beérkezési adatok: külső adatfeldolgozási késés és consent miatt itt nem bizonyítható.
- Éles TikTok Website mező: a platform fiókállapotához kötött, kóddal nem állítható.

## OWNER ACTION

- TikTok döntés a Business Account-ról a zenei licencelés átnézése után.
- Sole traderként ne tölts fel LTD-re kiállított Companies House dokumentumot; kérj TikTok-támogatási választ az elfogadható bizonyítékról.
- PR átnézése után külön jóváhagyás kell a staging aktiváláshoz vagy production deployhoz.

## READY FOR REVIEW

- Külön ág: `growth/conversion-fix-20261104`.
- Nincs production deploy, D1-módosítás, Stripe LIVE művelet, fizetett reklám vagy új közösségi poszt.
