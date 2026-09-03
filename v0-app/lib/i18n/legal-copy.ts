import type { Locale } from "./dictionaries"

type Section = { title: string; body: string }
type LegalDocument = { eyebrow: string; title: string; updated: string; intro: string; sections: Section[]; contact: string }
type LegalSet = { privacy: LegalDocument; terms: LegalDocument; privacyLink: string; termsLink: string }

const business = "HEGEVA AI, 34 Ogden Road, Stoke-on-Trent, ST1 3BX, United Kingdom"
const email = "hegezotya@gmx.com"

const en: LegalSet = {
  privacyLink: "Privacy", termsLink: "Terms",
  privacy: { eyebrow:"HEGEVA AI · LEGAL", title:"Privacy notice", updated:"Last updated: 2 September 2026",
    intro:`HEGEVA AI is the data controller for this service. Controller: ${business}. Contact: ${email}. This notice explains what personal information we process, why, and your choices.`,
    sections:[
      {title:"Information we process",body:"We may process your name, email address, account and authentication records, subscription and transaction references, support messages, security and device information, usage records, AI prompts and responses, and content you save in your workspace. Payment card details are handled by the payment provider and are not stored by HEGEVA AI."},
      {title:"Purposes and lawful bases",body:"We process data to create and operate your account, provide requested features and subscriptions, enforce limits, secure the service, prevent abuse, answer enquiries and comply with legal duties. Our lawful bases are performance of our contract, legitimate interests in operating and protecting the service, compliance with legal obligations, and consent where specifically requested. You may withdraw consent at any time without affecting earlier lawful processing."},
      {title:"Providers, recipients and transfers",body:"Where needed, we use providers for hosting and security (Cloudflare), authentication, AI processing, email and payments (Stripe when billing is enabled). They receive only data needed for their role. Some providers may process data outside the UK; where required, we use recognised adequacy arrangements or appropriate contractual safeguards. We do not sell personal data."},
      {title:"Retention",body:"Account and workspace data is normally kept while your account is active and for a reasonable period afterwards for recovery, security and disputes. Financial records may be retained as required by tax and accounting law. Security logs and support records are retained only as long as reasonably necessary. Data is then deleted or anonymised, subject to legal holds and backup cycles."},
      {title:"Your rights",body:"Depending on the circumstances, you may ask for access, correction, deletion, restriction or data portability, object to processing, or withdraw consent. We may need to verify your identity. You may complain to the UK Information Commissioner’s Office at ico.org.uk, although we encourage you to contact us first."},
      {title:"AI, children and automated decisions",body:"Do not submit credentials, payment details or unnecessary sensitive information in prompts or free-text fields. The service is not intended for children under 18. HEGEVA AI does not currently make solely automated decisions that produce legal or similarly significant effects about users."},
      {title:"Security and updates",body:"We use access controls, account separation and encrypted network connections, but no online service can guarantee absolute security. We may update this notice when the service or legal requirements change; the date above identifies the current version."}
    ], contact:`Privacy requests: ${email}. Postal contact: ${business}.` },
  terms: { eyebrow:"HEGEVA AI · LEGAL", title:"Terms of use", updated:"Last updated: 2 September 2026",
    intro:`These terms form an agreement between you and ${business} when you use HEGEVA AI. They apply to consumers and business users.`,
    sections:[
      {title:"Service and eligibility",body:"You must be at least 18 and able to enter a contract. Features labelled Beta, Planned or Coming Soon may change or may not yet be available. The description shown before purchase forms part of your order."},
      {title:"Accounts and acceptable use",body:"Provide accurate information and protect your login. Only submit content you have the right to use. Do not bypass limits or security, access another person’s data, submit unlawful or harmful material, distribute malware, infringe rights, deceive or cause harm. We may proportionately restrict access to protect users, the service or comply with law."},
      {title:"Subscriptions, prices and payment",body:"Before an order, checkout shows the plan, billing period, total recurring price, applicable taxes, payment method and renewal terms. Paid subscriptions renew automatically for the displayed period until cancelled. There are no automatic usage-overage charges: when a limit is reached, affected usage stops unless you choose another plan. Studio is not purchasable while marked Coming Soon; Enterprise terms are agreed separately."},
      {title:"Cancellation and consumer rights",body:"You can stop future renewal through the billing portal or by contacting us. Cancellation normally takes effect at the end of the paid period and access continues until then. UK consumers may have a statutory 14-day cancellation right for distance contracts. If you expressly request immediate supply during that period, you may have to pay for service supplied before cancellation. Rights are affected only as permitted by law. Nothing limits your statutory consumer rights."},
      {title:"Refunds",body:"We provide refunds where required by applicable law. Outside statutory rights, paid fees are normally non-refundable, including unused time after a scheduled cancellation. Contact us promptly about an incorrect or duplicate payment, or material unavailability of a paid service."},
      {title:"AI output and your content",body:"You retain rights in content you submit and give us only the limited permission needed to provide the service. AI output can be incomplete, inaccurate or unsuitable and is not professional legal, tax, financial or medical advice. Review important output and obtain qualified advice before relying on it."},
      {title:"Availability, changes and liability",body:"We use reasonable care but cannot promise uninterrupted or error-free availability. We may make proportionate changes for security, legal or improvement reasons and will give reasonable notice of material changes where practicable. Nothing excludes liability that cannot legally be excluded, including fraud, death or personal injury caused by negligence, or statutory consumer rights."},
      {title:"Ending the agreement and disputes",body:"You may close your account or cancel a subscription at any time. We may suspend or end access for serious or repeated breach, security risk, non-payment or legal necessity, with proportionate notice where appropriate. English and Welsh law applies; consumers retain mandatory protections and rights available where they live. Contact us first so we can try to resolve a complaint."}
    ], contact:`Questions, cancellations and complaints: ${email} or ${business}.` }
}

const hu: LegalSet = {
  privacyLink:"Adatvédelem", termsLink:"Felhasználási feltételek",
  privacy:{eyebrow:"HEGEVA AI · JOGI",title:"Adatvédelmi tájékoztató",updated:"Utolsó frissítés: 2026. szeptember 2.",
    intro:`A szolgáltatás adatkezelője: ${business}. Kapcsolat: ${email}. Ez a tájékoztató leírja, milyen személyes adatokat kezelünk, milyen célból, és milyen jogaid vannak.`,
    sections:[
      {title:"Kezelt adatok",body:"Kezelhetjük a nevedet, e-mail-címedet, fiók- és hitelesítési adatokat, előfizetési és tranzakciós hivatkozásokat, ügyfélszolgálati üzeneteket, biztonsági és eszközadatokat, használati adatokat, AI-kéréseket és válaszokat, valamint az általad mentett tartalmat. A bankkártyaadatokat a fizetési szolgáltató kezeli; a HEGEVA AI nem tárolja."},
      {title:"Célok és jogalapok",body:"Az adatokat a fiók és előfizetés működtetéséhez, a kért funkciók biztosításához, korlátok kezeléséhez, védelemhez, visszaélés-megelőzéshez, megkeresések megválaszolásához és jogi kötelezettségekhez használjuk. Jogalapunk a szerződés teljesítése, a biztonságos működéshez fűződő jogos érdek, jogi kötelezettség, illetve ahol külön kérjük, a hozzájárulás. A hozzájárulás bármikor visszavonható."},
      {title:"Szolgáltatók és adattovábbítás",body:"Szükség szerint tárhely- és biztonsági (Cloudflare), hitelesítési, AI-feldolgozó, e-mail- és fizetési szolgáltatókat (a számlázás bekapcsolásakor Stripe) használunk. Csak a feladatukhoz szükséges adatot kapják meg. Az Egyesült Királyságon kívüli adatkezelésnél megfelelő megfelelőségi vagy szerződéses garanciákat alkalmazunk. Személyes adatot nem értékesítünk."},
      {title:"Adatmegőrzés",body:"A fiók- és munkaterületi adatokat általában az aktív fiók ideje alatt, majd helyreállítási, biztonsági és jogvita-kezelési célból indokolt ideig őrizzük. A pénzügyi adatokat az adó- és számviteli szabályok által előírt ideig tarthatjuk meg. Ezután az adatot töröljük vagy anonimizáljuk, a jogi megőrzés és mentési ciklusok kivételével."},
      {title:"Jogaid",body:"A körülményektől függően kérhetsz hozzáférést, helyesbítést, törlést, korlátozást vagy adathordozhatóságot, tiltakozhatsz, és visszavonhatod a hozzájárulást. Személyazonosság-ellenőrzést kérhetünk. Panaszt tehetsz az Egyesült Királyság adatvédelmi hatóságánál (ICO, ico.org.uk), de kérjük, először adj lehetőséget a rendezésre."},
      {title:"AI, gyermekek és automatizált döntések",body:"Ne adj meg jelszót, fizetési adatot vagy szükségtelen érzékeny információt AI-kérésben vagy szabad szöveges mezőben. A szolgáltatás 18 éven aluliaknak nem készült. Jelenleg nem hozunk kizárólag automatizált, rád nézve jogi vagy hasonlóan jelentős hatású döntést."},
      {title:"Biztonság és változások",body:"Hozzáférés-védelmet, fiókelkülönítést és titkosított hálózati kapcsolatot használunk, de teljes biztonságot egyetlen online szolgáltatás sem garantálhat. A változásokat e tájékoztató dátumával jelezzük."}
    ],contact:`Adatvédelmi kérelmek: ${email}. Postacím: ${business}.`},
  terms:{eyebrow:"HEGEVA AI · JOGI",title:"Felhasználási feltételek",updated:"Utolsó frissítés: 2026. szeptember 2.",
    intro:`E feltételek közted és a szolgáltató (${business}) között jönnek létre. Céges és magánfelhasználókra egyaránt vonatkoznak.`,
    sections:[
      {title:"Szolgáltatás és jogosultság",body:"A használathoz legalább 18 évesnek és szerződéskötésre jogosultnak kell lenned. A Béta, Tervezett vagy Hamarosan jelölésű funkciók változhatnak vagy még nem elérhetők. A vásárlás előtt megjelenített szolgáltatásleírás a megrendelés része."},
      {title:"Fiók és megengedett használat",body:"Adj meg pontos adatokat, és védd a belépésedet. Csak jogosultan használt tartalmat küldj be. Tilos korlátot vagy védelmet megkerülni, más adatához hozzáférni, jogellenes vagy káros tartalmat beküldeni, jogot sérteni, megtéveszteni vagy kárt okozni. A hozzáférést védelem vagy jogi kötelezettség miatt arányosan korlátozhatjuk."},
      {title:"Előfizetés, árak és fizetés",body:"A megrendelés előtt a fizetési oldal megjeleníti a csomagot, számlázási időszakot, teljes ismétlődő árat, alkalmazandó adókat, fizetési módot és megújulási feltételeket. A fizetős előfizetés lemondásig automatikusan megújul. Nincs automatikus túlfogyasztási díj: a korlát elérésekor az érintett használat megáll. A Studio „Hamarosan” jelölés alatt nem vásárolható; az Enterprise feltételeit külön állapítjuk meg."},
      {title:"Lemondás és fogyasztói jogok",body:"A következő megújulást a számlázási felületen vagy e-mailben mondhatod le. A lemondás rendszerint a kifizetett időszak végén lép hatályba. UK fogyasztóként távértékesítésnél 14 napos törvényes elállási jog illethet meg. Ha ezalatt kifejezetten kéred az azonnali teljesítést, a lemondásig nyújtott szolgáltatás díja fizetendő lehet. Jogaid csak a törvény által megengedett mértékben változnak; törvényes fogyasztói jogaidat nem korlátozzuk."},
      {title:"Visszatérítés",body:"Visszatérítést adunk, amikor azt a jog előírja. A törvényes jogokon túl a már kifizetett díj rendszerint nem visszatéríthető, ideértve az ütemezett lemondás utáni fel nem használt időt. Hibás vagy ismételt terhelés, illetve lényeges szolgáltatáskiesés esetén azonnal írj nekünk."},
      {title:"AI-válaszok és saját tartalmad",body:"A beküldött tartalomhoz fűződő jogaid megmaradnak; csak a szolgáltatáshoz szükséges feldolgozási engedélyt adod. Az AI-válasz téves vagy alkalmatlan lehet, és nem jogi, adózási, pénzügyi vagy egészségügyi szakvélemény. Fontos döntés előtt ellenőrizd, és szükség esetén kérj szakértői tanácsot."},
      {title:"Elérhetőség, változások és felelősség",body:"Ésszerű gondossággal szolgáltatunk, de folyamatos és hibamentes működést nem ígérhetünk. Biztonsági, jogi vagy fejlesztési okból arányos változtatást végezhetünk, a lényeges változásról lehetőség szerint előzetesen tájékoztatunk. Nem zárunk ki jogszerűen ki nem zárható felelősséget vagy kötelező fogyasztói jogot."},
      {title:"Megszüntetés és jogviták",body:"Fiókodat bezárhatod, előfizetésedet bármikor lemondhatod. Súlyos vagy ismételt szabálysértés, biztonsági kockázat, nemfizetés vagy jogi kötelezettség esetén a hozzáférést arányosan felfüggeszthetjük vagy megszüntethetjük. Anglia és Wales joga irányadó; fogyasztóként megmarad a lakóhelyed szerinti kötelező védelem. Panasz esetén először írj nekünk."}
    ],contact:`Kérdés, lemondás vagy panasz: ${email}; ${business}.`}
}

function fallback(privacyLink:string, termsLink:string, privacyTitle:string, termsTitle:string, updated:string): LegalSet {
  return {
    privacyLink, termsLink,
    privacy:{...en.privacy,title:privacyTitle,updated},
    terms:{...en.terms,title:termsTitle,updated},
  }
}

export const LEGAL_COPY: Record<Locale, LegalSet> = {
  en, hu,
  de:fallback("Datenschutz","Nutzungsbedingungen","Datenschutzhinweis","Nutzungsbedingungen","Letzte Aktualisierung: 2. September 2026"),
  fr:fallback("Confidentialité","Conditions d’utilisation","Avis de confidentialité","Conditions d’utilisation","Dernière mise à jour : 2 septembre 2026"),
  es:fallback("Privacidad","Términos de uso","Aviso de privacidad","Términos de uso","Última actualización: 2 de septiembre de 2026"),
}
