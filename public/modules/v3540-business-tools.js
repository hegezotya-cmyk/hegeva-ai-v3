/* =========================================================
   HEGEVA AI V35.4.0
   MODULE 2/4 — BUSINESS & DOCUMENT TOOLS
   INVOICE / QUOTE / LETTER / EMAIL / CONTRACT / SUMMARY
   EN / HU / DE / FR / ES
   LOCAL UI — USES EXISTING HEGEVA CHAT
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.0";
  const MODULE = "BUSINESS_TOOLS";
  const LANGS = ["en","hu","de","fr","es"];

  const TEXT = {
    en:{
      title:"Business & Document Tools",
      type:"Document type",
      invoice:"Invoice draft",
      quote:"Quote / Estimate",
      letter:"Business letter",
      email:"Professional email",
      contract:"Contract draft",
      summary:"Business summary",
      details:"Describe what you need...",
      create:"Prepare with HEGEVA",
      copy:"Copy prompt",
      copied:"Copied",
      clear:"Clear",
      note:"AI-generated drafts should be reviewed before official or legal use."
    },

    hu:{
      title:"Üzleti és dokumentum eszközök",
      type:"Dokumentum típusa",
      invoice:"Számla tervezet",
      quote:"Árajánlat / becslés",
      letter:"Üzleti levél",
      email:"Professzionális e-mail",
      contract:"Szerződés tervezet",
      summary:"Üzleti összefoglaló",
      details:"Írd le, mire van szükséged...",
      create:"Előkészítés HEGEVA-val",
      copy:"Prompt másolása",
      copied:"Másolva",
      clear:"Törlés",
      note:"Az AI által készített tervezeteket hivatalos vagy jogi használat előtt ellenőrizni kell."
    },

    de:{
      title:"Geschäfts- & Dokumenttools",
      type:"Dokumenttyp",
      invoice:"Rechnungsentwurf",
      quote:"Angebot / Kostenvoranschlag",
      letter:"Geschäftsbrief",
      email:"Professionelle E-Mail",
      contract:"Vertragsentwurf",
      summary:"Geschäftszusammenfassung",
      details:"Beschreibe, was du benötigst...",
      create:"Mit HEGEVA vorbereiten",
      copy:"Prompt kopieren",
      copied:"Kopiert",
      clear:"Löschen",
      note:"KI-generierte Entwürfe sollten vor offizieller oder rechtlicher Verwendung geprüft werden."
    },

    fr:{
      title:"Outils professionnels et documents",
      type:"Type de document",
      invoice:"Projet de facture",
      quote:"Devis / estimation",
      letter:"Lettre professionnelle",
      email:"E-mail professionnel",
      contract:"Projet de contrat",
      summary:"Résumé professionnel",
      details:"Décrivez ce dont vous avez besoin...",
      create:"Préparer avec HEGEVA",
      copy:"Copier le prompt",
      copied:"Copié",
      clear:"Effacer",
      note:"Les brouillons générés par IA doivent être vérifiés avant toute utilisation officielle ou juridique."
    },

    es:{
      title:"Herramientas de negocio y documentos",
      type:"Tipo de documento",
      invoice:"Borrador de factura",
      quote:"Presupuesto / estimación",
      letter:"Carta comercial",
      email:"Correo profesional",
      contract:"Borrador de contrato",
      summary:"Resumen empresarial",
      details:"Describe lo que necesitas...",
      create:"Preparar con HEGEVA",
      copy:"Copiar prompt",
      copied:"Copiado",
      clear:"Limpiar",
      note:"Los borradores generados por IA deben revisarse antes de su uso oficial o legal."
    }
  };

  const INSTRUCTIONS = {
    en:{
      invoice:"Create a professional invoice draft using the information below. Clearly separate supplier, customer, items/services, quantities, prices, totals, payment terms and notes. Do not invent missing legal or tax information.",
      quote:"Create a professional quote or estimate using the information below. Include scope, price breakdown, validity period, payment terms and clear assumptions. Do not invent missing figures.",
      letter:"Draft a clear professional business letter using the information below. Keep the tone appropriate and do not invent facts.",
      email:"Draft a professional email using the information below. Make it concise, clear and action-oriented.",
      contract:"Create a plain-language contract draft from the information below. Mark missing important terms clearly and do not present the draft as legal advice.",
      summary:"Create a structured business summary from the information below. Separate facts, actions, risks and next steps."
    },

    hu:{
      invoice:"Készíts professzionális számlatervezetet az alábbi információkból. Különítsd el a szolgáltatót, ügyfelet, tételeket/szolgáltatásokat, mennyiségeket, árakat, végösszeget, fizetési feltételeket és megjegyzéseket. Hiányzó jogi vagy adózási adatot ne találj ki.",
      quote:"Készíts professzionális árajánlatot az alábbi információkból. Tartalmazza a munkakört, árakat, érvényességet, fizetési feltételeket és feltételezéseket. Hiányzó összegeket ne találj ki.",
      letter:"Készíts világos, professzionális üzleti levelet az alábbi információkból. A hangnem legyen megfelelő, és ne találj ki tényeket.",
      email:"Készíts professzionális e-mailt az alábbi információkból. Legyen tömör, világos és cselekvésorientált.",
      contract:"Készíts közérthető szerződéstervezetet az alábbi információkból. A fontos hiányzó feltételeket egyértelműen jelöld, és ne állítsd, hogy ez jogi tanács.",
      summary:"Készíts strukturált üzleti összefoglalót az alábbi információkból. Különítsd el a tényeket, feladatokat, kockázatokat és következő lépéseket."
    },

    de:{
      invoice:"Erstelle einen professionellen Rechnungsentwurf aus den folgenden Informationen. Trenne Anbieter, Kunde, Positionen, Mengen, Preise, Gesamtsumme, Zahlungsbedingungen und Hinweise. Fehlende rechtliche oder steuerliche Angaben nicht erfinden.",
      quote:"Erstelle ein professionelles Angebot aus den folgenden Informationen. Enthalten sein sollen Leistungsumfang, Preisaufstellung, Gültigkeit, Zahlungsbedingungen und Annahmen. Fehlende Beträge nicht erfinden.",
      letter:"Erstelle einen klaren professionellen Geschäftsbrief aus den folgenden Informationen. Keine Fakten erfinden.",
      email:"Erstelle eine professionelle E-Mail aus den folgenden Informationen. Kurz, klar und handlungsorientiert.",
      contract:"Erstelle einen verständlichen Vertragsentwurf aus den folgenden Informationen. Wichtige fehlende Bedingungen deutlich markieren und nicht als Rechtsberatung darstellen.",
      summary:"Erstelle eine strukturierte Geschäftszusammenfassung. Trenne Fakten, Aufgaben, Risiken und nächste Schritte."
    },

    fr:{
      invoice:"Créez un projet de facture professionnel à partir des informations suivantes. Séparez fournisseur, client, articles/services, quantités, prix, total, conditions de paiement et notes. N'inventez pas d'informations juridiques ou fiscales manquantes.",
      quote:"Créez un devis professionnel à partir des informations suivantes. Incluez périmètre, prix, durée de validité, conditions de paiement et hypothèses. N'inventez pas de montants manquants.",
      letter:"Rédigez une lettre commerciale professionnelle claire à partir des informations suivantes. N'inventez aucun fait.",
      email:"Rédigez un e-mail professionnel clair, concis et orienté vers l'action.",
      contract:"Créez un projet de contrat en langage clair. Signalez les conditions importantes manquantes et ne le présentez pas comme un conseil juridique.",
      summary:"Créez un résumé professionnel structuré en séparant faits, actions, risques et prochaines étapes."
    },

    es:{
      invoice:"Crea un borrador de factura profesional con la siguiente información. Separa proveedor, cliente, artículos/servicios, cantidades, precios, total, condiciones de pago y notas. No inventes información legal o fiscal que falte.",
      quote:"Crea un presupuesto profesional con la siguiente información. Incluye alcance, desglose de precios, validez, condiciones de pago y supuestos. No inventes cantidades faltantes.",
      letter:"Redacta una carta comercial profesional y clara con la siguiente información. No inventes hechos.",
      email:"Redacta un correo profesional, claro, conciso y orientado a la acción.",
      contract:"Crea un borrador de contrato en lenguaje sencillo. Marca claramente las condiciones importantes que falten y no lo presentes como asesoramiento legal.",
      summary:"Crea un resumen empresarial estructurado separando hechos, acciones, riesgos y próximos pasos."
    }
  };

  function language(){
    const value = String(
      document.getElementById("languageSelect")?.value ||
      localStorage.getItem("hegeva_language") ||
      document.documentElement.lang ||
      "en"
    ).toLowerCase().slice(0,2);

    return LANGS.includes(value) ? value : "en";
  }

  function text(){
    return TEXT[language()] || TEXT.en;
  }

  function instruction(type){
    return (
      INSTRUCTIONS[language()]?.[type] ||
      INSTRUCTIONS.en[type] ||
      ""
    );
  }

  function chatInput(){
    return document.getElementById("aiChatInput");
  }

  function installStyle(){
    if(document.getElementById("v3540BusinessStyle")) return;

    const style = document.createElement("style");
    style.id = "v3540BusinessStyle";

    style.textContent = `
      #v3540BusinessTools{
        margin:14px 0;
        padding:14px;
        border:1px solid rgba(212,175,55,.24);
        border-radius:16px;
        background:rgba(18,31,52,.72);
      }

      #v3540BusinessTools h3{
        margin:0 0 12px;
        font-size:16px;
      }

      .v3540-business-grid{
        display:grid;
        grid-template-columns:200px 1fr;
        gap:10px;
      }

      #v3540DocumentType,
      #v3540DocumentDetails{
        width:100%;
        border:1px solid rgba(212,175,55,.30);
        border-radius:11px;
        background:rgba(9,15,27,.92);
        color:inherit;
        font:inherit;
      }

      #v3540DocumentType{
        min-height:42px;
        padding:0 10px;
      }

      #v3540DocumentDetails{
        min-height:110px;
        resize:vertical;
        padding:11px;
        grid-column:1/-1;
      }

      .v3540-business-actions{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        grid-column:1/-1;
      }

      .v3540-business-btn{
        min-height:38px;
        padding:7px 12px;
        border-radius:10px;
        border:1px solid rgba(212,175,55,.34);
        background:rgba(27,43,70,.92);
        color:inherit;
        cursor:pointer;
        font:inherit;
        font-weight:700;
      }

      #v3540DocumentCreate{
        background:linear-gradient(
          135deg,
          #f6c952,
          #ffd979
        );
        color:#111827;
      }

      #v3540BusinessNote{
        margin-top:10px;
        font-size:11px;
        line-height:1.45;
        opacity:.68;
      }

      @media(max-width:720px){
        .v3540-business-grid{
          grid-template-columns:1fr;
        }

        #v3540DocumentDetails{
          grid-column:auto;
        }

        .v3540-business-actions{
          grid-column:auto;
          display:grid;
          grid-template-columns:1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createUI(){
    if(document.getElementById("v3540BusinessTools")) return;

    const input = chatInput();
    if(!input) return;

    const section = document.createElement("section");
    section.id = "v3540BusinessTools";

    section.innerHTML = `
      <h3 id="v3540BusinessTitle"></h3>

      <div class="v3540-business-grid">
        <select id="v3540DocumentType">
          <option value="invoice"></option>
          <option value="quote"></option>
          <option value="letter"></option>
          <option value="email"></option>
          <option value="contract"></option>
          <option value="summary"></option>
        </select>

        <div></div>

        <textarea
          id="v3540DocumentDetails"
          spellcheck="true"
        ></textarea>

        <div class="v3540-business-actions">
          <button
            id="v3540DocumentCreate"
            class="v3540-business-btn"
            type="button"
          ></button>

          <button
            id="v3540DocumentCopy"
            class="v3540-business-btn"
            type="button"
          ></button>

          <button
            id="v3540DocumentClear"
            class="v3540-business-btn"
            type="button"
          ></button>
        </div>
      </div>

      <div id="v3540BusinessNote"></div>
    `;

    const parent =
      input.closest("form") ||
      input.parentElement;

    parent?.insertAdjacentElement(
      "beforebegin",
      section
    );

    document
      .getElementById("v3540DocumentCreate")
      ?.addEventListener(
        "click",
        preparePrompt
      );

    document
      .getElementById("v3540DocumentCopy")
      ?.addEventListener(
        "click",
        copyPrompt
      );

    document
      .getElementById("v3540DocumentClear")
      ?.addEventListener(
        "click",
        clearForm
      );

    translate();
  }

  function buildPrompt(){
    const type =
      document.getElementById("v3540DocumentType")
        ?.value || "email";

    const details =
      String(
        document.getElementById("v3540DocumentDetails")
          ?.value || ""
      ).trim();

    if(!details) return "";

    return [
      instruction(type),
      "",
      "--------------------",
      details
    ].join("\n");
  }

  function preparePrompt(){
    const prompt = buildPrompt();
    const input = chatInput();

    if(!prompt || !input) return;

    input.value = prompt;
    input.dispatchEvent(
      new Event(
        "input",
        {bubbles:true}
      )
    );

    input.focus();
  }

  async function copyPrompt(){
    const prompt = buildPrompt();
    if(!prompt) return;

    try{
      await navigator.clipboard.writeText(prompt);

      const button =
        document.getElementById("v3540DocumentCopy");

      if(button){
        button.textContent =
          "✓ " + text().copied;

        setTimeout(
          translate,
          1000
        );
      }
    }catch(_error){
      /* No destructive fallback. */
    }
  }

  function clearForm(){
    const details =
      document.getElementById("v3540DocumentDetails");

    if(details){
      details.value = "";
      details.focus();
    }
  }

  function translate(){
    const t = text();

    const title =
      document.getElementById("v3540BusinessTitle");

    const select =
      document.getElementById("v3540DocumentType");

    const details =
      document.getElementById("v3540DocumentDetails");

    const create =
      document.getElementById("v3540DocumentCreate");

    const copy =
      document.getElementById("v3540DocumentCopy");

    const clear =
      document.getElementById("v3540DocumentClear");

    const note =
      document.getElementById("v3540BusinessNote");

    if(title) title.textContent = "📄 " + t.title;

    if(select){
      const labels = [
        t.invoice,
        t.quote,
        t.letter,
        t.email,
        t.contract,
        t.summary
      ];

      [...select.options].forEach(
        (option,index) => {
          option.textContent =
            labels[index] || option.value;
        }
      );

      select.setAttribute(
        "aria-label",
        t.type
      );

      select.setAttribute(
        "lang",
        language()
      );
    }

    if(details){
      details.placeholder = t.details;
      details.setAttribute("lang",language());
    }

    if(create){
      create.textContent =
        "✨ " + t.create;
    }

    if(copy){
      copy.textContent =
        "📋 " + t.copy;
    }

    if(clear){
      clear.textContent =
        "× " + t.clear;
    }

    if(note){
      note.textContent =
        "ℹ️ " + t.note;
    }
  }

  function boot(){
    installStyle();

    let attempts = 0;

    const start = () => {
      attempts += 1;

      createUI();
      translate();

      if(
        !document.getElementById("v3540BusinessTools") &&
        attempts < 80
      ){
        setTimeout(start,100);
      }
    };

    start();

    document
      .getElementById("languageSelect")
      ?.addEventListener(
        "change",
        () => {
          setTimeout(translate,60);
        }
      );

    window.hegevaV3540BusinessTools = {
      version:VERSION,
      module:MODULE,
      invoiceDraft:true,
      quoteDraft:true,
      businessLetter:true,
      professionalEmail:true,
      contractDraft:true,
      businessSummary:true,
      fiveLanguages:true,
      usesExistingChat:true,
      extraAiRequest:false,
      legalAdvice:false,
      changesAIBackend:false,
      changesBilling:false,
      changesStripe:false,
      changesAuthentication:false
    };

    console.log(
      "HEGEVA AI V35.4.0 — Business & Document Tools active."
    );
  }

  if(document.readyState === "loading"){
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {once:true}
    );
  }else{
    boot();
  }
})();
