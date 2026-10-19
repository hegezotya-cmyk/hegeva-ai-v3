/* =========================================================
   HEGEVA AI V35.4.3
   UI + BUSINESS TOOLS POLISH
   NAVY / BLACK / GOLD VISUAL CONSISTENCY
   BUSINESS TOOLS UX + VAT + BUTTON RELIABILITY
   EN / HU / DE / FR / ES
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.3";
  const LANGS = ["en","hu","de","fr","es"];

  const TEXT = {
    en:{
      customer:"Customer",
      description:"Description",
      total:"Total",
      saved:"Document saved locally.",
      missing:"Please enter the customer and description first.",
      preview:"Preview",
      save:"Save locally",
      print:"Print / Save PDF",
      calculate:"Calculate"
    },
    hu:{
      customer:"Ügyfél",
      description:"Leírás",
      total:"Összesen",
      saved:"A dokumentum helyben elmentve.",
      missing:"Kérlek add meg az ügyfelet és a leírást.",
      preview:"Előnézet",
      save:"Mentés helyben",
      print:"Nyomtatás / PDF mentés",
      calculate:"Számítás"
    },
    de:{
      customer:"Kunde",
      description:"Beschreibung",
      total:"Gesamt",
      saved:"Dokument lokal gespeichert.",
      missing:"Bitte Kunde und Beschreibung eingeben.",
      preview:"Vorschau",
      save:"Lokal speichern",
      print:"Drucken / PDF speichern",
      calculate:"Berechnen"
    },
    fr:{
      customer:"Client",
      description:"Description",
      total:"Total",
      saved:"Document enregistré localement.",
      missing:"Veuillez saisir le client et la description.",
      preview:"Aperçu",
      save:"Enregistrer localement",
      print:"Imprimer / Enregistrer PDF",
      calculate:"Calculer"
    },
    es:{
      customer:"Cliente",
      description:"Descripción",
      total:"Total",
      saved:"Documento guardado localmente.",
      missing:"Introduce el cliente y la descripción.",
      preview:"Vista previa",
      save:"Guardar localmente",
      print:"Imprimir / Guardar PDF",
      calculate:"Calcular"
    }
  };

  function language(){
    const raw = String(
      document.getElementById("languageSelect")?.value ||
      localStorage.getItem("hegeva_language") ||
      document.documentElement.lang ||
      "en"
    ).toLowerCase().slice(0,2);

    return LANGS.includes(raw) ? raw : "en";
  }

  function t(){
    return TEXT[language()] || TEXT.en;
  }

  function money(value){
    return new Intl.NumberFormat(
      language() === "en" ? "en-GB" : undefined,
      {style:"currency", currency:"GBP"}
    ).format(Number(value) || 0);
  }

  function escapeHtml(value){
    return String(value || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function installStyles(){
    if(document.getElementById("v3543PolishStyle")) return;

    const style = document.createElement("style");
    style.id = "v3543PolishStyle";

    style.textContent = `
      :root{
        --v3543-bg:#07111f;
        --v3543-panel:#0d1b2e;
        --v3543-panel2:#12233a;
        --v3543-border:rgba(224,184,76,.28);
        --v3543-gold:#e3bd55;
        --v3543-gold2:#f2d57f;
        --v3543-text:#f4f7fb;
        --v3543-muted:#9fb0c7;
      }

      body{
        background:
          radial-gradient(circle at top right, rgba(227,189,85,.06), transparent 28%),
          linear-gradient(180deg,#07111f,#091523 55%,#07111f) !important;
      }

      .card,
      .panel,
      .notice,
      [id^="v3540"],
      [id^="v3541"],
      [id^="v3542"]{
        border-color:var(--v3543-border) !important;
      }

      .card,
      .panel{
        background:
          linear-gradient(
            180deg,
            rgba(18,35,58,.94),
            rgba(10,22,39,.96)
          ) !important;
        box-shadow:
          0 12px 28px rgba(0,0,0,.20) !important;
      }

      button,
      .primary-button,
      .secondary-button{
        transition:
          transform .14s ease,
          border-color .14s ease,
          box-shadow .14s ease,
          background .14s ease;
      }

      button:hover,
      .primary-button:hover,
      .secondary-button:hover{
        transform:translateY(-1px);
      }

      .primary-button{
        background:
          linear-gradient(
            135deg,
            var(--v3543-gold),
            var(--v3543-gold2)
          ) !important;
        color:#111827 !important;
        border-color:rgba(255,220,120,.55) !important;
        font-weight:800 !important;
      }

      .secondary-button{
        background:rgba(20,37,61,.95) !important;
        color:var(--v3543-text) !important;
        border-color:rgba(227,189,85,.28) !important;
      }

      input,
      textarea,
      select{
        background:rgba(5,14,27,.92) !important;
        color:var(--v3543-text) !important;
        border-color:rgba(227,189,85,.25) !important;
      }

      input:focus,
      textarea:focus,
      select:focus{
        border-color:rgba(227,189,85,.70) !important;
        box-shadow:0 0 0 2px rgba(227,189,85,.10) !important;
      }

      .vision-tagline,
      .eyebrow{
        color:var(--v3543-gold) !important;
      }

      #btDocPreview{
        background:
          linear-gradient(
            180deg,
            rgba(12,28,48,.98),
            rgba(8,20,36,.98)
          ) !important;
        border:1px solid var(--v3543-border) !important;
        color:var(--v3543-text) !important;
        line-height:1.6;
      }

      #btDescription[value="loading"]{
        color:var(--v3543-text) !important;
      }

      @media(max-width:720px){
        .command-grid,
        .form-grid{
          grid-template-columns:1fr !important;
        }

        .tool-row{
          display:grid !important;
          grid-template-columns:1fr !important;
        }

        .tool-row button{
          width:100% !important;
        }
      }

      @media print{
        body *{
          visibility:hidden !important;
        }

        #btDocPreview,
        #btDocPreview *{
          visibility:visible !important;
        }

        #btDocPreview{
          position:absolute !important;
          left:0 !important;
          top:0 !important;
          width:100% !important;
          background:#fff !important;
          color:#000 !important;
          border:none !important;
          box-shadow:none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function normaliseFields(){
    const description =
      document.getElementById("btDescription");

    const vat =
      document.getElementById("btVat");

    if(
      description &&
      String(description.value).trim().toLowerCase() === "loading"
    ){
      description.value = "";
    }

    if(vat){
      const value = Number(vat.value || 0);

      if(value > 0 && value <= 1){
        vat.value = String(value * 100);
      }

      vat.setAttribute("max","100");
      vat.setAttribute("step","0.1");
    }
  }

  function documentData(){
    const qty = Math.max(
      0,
      Number(
        document.getElementById("btQty")?.value || 0
      )
    );

    const price = Math.max(
      0,
      Number(
        document.getElementById("btPrice")?.value || 0
      )
    );

    let vatRate = Math.max(
      0,
      Number(
        document.getElementById("btVat")?.value || 0
      )
    );

    if(vatRate > 0 && vatRate <= 1){
      vatRate *= 100;
    }

    vatRate = Math.min(vatRate,100);

    const subtotal = qty * price;
    const vat = subtotal * vatRate / 100;

    return {
      type:
        document.getElementById("btDocType")?.value ||
        "Invoice",
      number:
        document.getElementById("btDocNumber")?.value ||
        "",
      customer:
        String(
          document.getElementById("btCustomer")?.value || ""
        ).trim(),
      description:
        String(
          document.getElementById("btDescription")?.value || ""
        ).trim(),
      qty,
      price,
      vatRate,
      subtotal,
      vat,
      total:subtotal + vat,
      createdAt:new Date().toISOString()
    };
  }

  function preview(){
    normaliseFields();

    const data = documentData();
    const box = document.getElementById("btDocPreview");

    if(!box) return;

    box.style.display = "block";

    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <strong style="font-size:18px">
          ${escapeHtml(data.type)}
          ${escapeHtml(data.number)}
        </strong>

        <strong style="color:#e3bd55">
          ${money(data.total)}
        </strong>
      </div>

      <div style="margin-top:12px">
        <strong>${escapeHtml(t().customer)}:</strong>
        ${escapeHtml(data.customer || "—")}
      </div>

      <div style="margin-top:5px">
        <strong>${escapeHtml(t().description)}:</strong>
        ${escapeHtml(data.description || "—")}
      </div>

      <div style="margin-top:10px">
        ${data.qty} × ${money(data.price)}
        = <strong>${money(data.subtotal)}</strong>
      </div>

      <div>
        VAT (${data.vatRate}%):
        <strong>${money(data.vat)}</strong>
      </div>

      <div style="margin-top:8px;font-size:17px">
        <strong>
          ${escapeHtml(t().total)}:
          ${money(data.total)}
        </strong>
      </div>
    `;
  }

  function save(){
    normaliseFields();

    const data = documentData();

    if(!data.customer || !data.description){
      alert(t().missing);
      return;
    }

    let docs = [];

    try{
      docs = JSON.parse(
        localStorage.getItem("hegeva_v44_documents") ||
        "[]"
      );
    }catch(_error){
      docs = [];
    }

    if(!Array.isArray(docs)){
      docs = [];
    }

    docs.unshift(data);

    try{
      localStorage.setItem(
        "hegeva_v44_documents",
        JSON.stringify(docs.slice(0,100))
      );
    }catch(_error){}

    preview();

    const status =
      document.getElementById("btDocPreview");

    if(status){
      status.insertAdjacentHTML(
        "beforeend",
        `<div style="margin-top:10px;color:#b7f7c7;font-size:12px">✓ ${escapeHtml(t().saved)}</div>`
      );
    }
  }

  function printDocument(){
    preview();

    setTimeout(
      () => window.print(),
      60
    );
  }

  function bindButtons(){
    const previewBtn =
      document.getElementById("btPreview");

    const saveBtn =
      document.getElementById("btSaveDoc");

    const printBtn =
      document.getElementById("btPrint");

    if(previewBtn && !previewBtn.dataset.v3543Bound){
      previewBtn.dataset.v3543Bound = "true";
      previewBtn.addEventListener(
        "click",
        event => {
          event.preventDefault();
          preview();
        },
        true
      );
    }

    if(saveBtn && !saveBtn.dataset.v3543Bound){
      saveBtn.dataset.v3543Bound = "true";
      saveBtn.addEventListener(
        "click",
        event => {
          event.preventDefault();
          save();
        },
        true
      );
    }

    if(printBtn && !printBtn.dataset.v3543Bound){
      printBtn.dataset.v3543Bound = "true";
      printBtn.addEventListener(
        "click",
        event => {
          event.preventDefault();
          printDocument();
        },
        true
      );
    }
  }

  function translateButtons(){
    const text = t();

    const previewBtn =
      document.getElementById("btPreview");

    const saveBtn =
      document.getElementById("btSaveDoc");

    const printBtn =
      document.getElementById("btPrint");

    const calculateBtn =
      document.getElementById("btCalculate");

    if(previewBtn) previewBtn.textContent = text.preview;
    if(saveBtn) saveBtn.textContent = text.save;
    if(printBtn) printBtn.textContent = text.print;
    if(calculateBtn) calculateBtn.textContent = text.calculate;
  }

  function polish(){
    normaliseFields();
    bindButtons();
    translateButtons();
  }

  function boot(){
    installStyles();
    polish();

    document
      .getElementById("languageSelect")
      ?.addEventListener(
        "change",
        () => setTimeout(polish,80)
      );

    window.hegevaV3543UiBusinessPolish = {
      version:VERSION,
      businessTools:true,
      uiPolish:true,
      vatNormalisation:true,
      printView:true,
      fiveLanguages:true,
      extraAIRequest:false,
      changesAIBackend:false,
      changesStripe:false,
      changesBilling:false,
      changesAuthentication:false
    };

    console.log(
      "HEGEVA AI V35.4.3 UI + Business Tools polish active."
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
