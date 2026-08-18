/* =========================================================
   HEGEVA AI V35.4.1
   MODULE 5/8 — PLANS & USAGE
   PLAN OVERVIEW + LOCAL USAGE DASHBOARD + LIMIT EXPLANATION
   EN / HU / DE / FR / ES
   LOCAL ONLY — NO BILLING / STRIPE CHANGES
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.1";
  const MODULE = "PLANS_USAGE";
  const ID = "hegevaV3541PlansUsage";

  const LANGS = ["en", "hu", "de", "fr", "es"];

  const TEXT = {
    en: {
      title: "📊 Plans & Usage",
      plan: "Current plan",
      planValue: "Plan information",
      usage: "Local usage overview",
      chats: "Saved chats",
      notes: "Workspace notes",
      language: "Language",
      storage: "Browser storage",
      available: "Available",
      unavailable: "Unavailable",
      local: "Stored locally in this browser",
      limits: "Usage & limits",
      limitsText:
        "Your exact account limits depend on the active HEGEVA plan and connected services. This panel does not invent or estimate billing limits.",
      privacy:
        "This overview reads local browser information only. It does not create extra AI requests.",
      refresh: "↻ Refresh usage",
      ready: "Usage overview ready",
      unknown: "Not detected"
    },

    hu: {
      title: "📊 Csomag és használat",
      plan: "Jelenlegi csomag",
      planValue: "Csomaginformáció",
      usage: "Helyi használati áttekintés",
      chats: "Mentett chatek",
      notes: "Workspace jegyzet",
      language: "Nyelv",
      storage: "Böngésző tárhely",
      available: "Elérhető",
      unavailable: "Nem elérhető",
      local: "Helyben, ebben a böngészőben tárolva",
      limits: "Használat és limitek",
      limitsText:
        "A pontos fióklimitek az aktív HEGEVA csomagtól és a kapcsolódó szolgáltatásoktól függenek. Ez a panel nem talál ki és nem becsül számlázási limiteket.",
      privacy:
        "Ez az áttekintés csak helyi böngészőadatokat olvas. Nem indít extra AI-kérést.",
      refresh: "↻ Használat frissítése",
      ready: "Használati áttekintés kész",
      unknown: "Nem észlelhető"
    },

    de: {
      title: "📊 Tarif & Nutzung",
      plan: "Aktueller Tarif",
      planValue: "Tarifinformationen",
      usage: "Lokale Nutzungsübersicht",
      chats: "Gespeicherte Chats",
      notes: "Workspace-Notizen",
      language: "Sprache",
      storage: "Browser-Speicher",
      available: "Verfügbar",
      unavailable: "Nicht verfügbar",
      local: "Lokal in diesem Browser gespeichert",
      limits: "Nutzung & Limits",
      limitsText:
        "Die genauen Kontolimits hängen vom aktiven HEGEVA-Tarif und den verbundenen Diensten ab. Dieses Panel erfindet oder schätzt keine Abrechnungslimits.",
      privacy:
        "Diese Übersicht liest nur lokale Browserinformationen und erzeugt keine zusätzlichen AI-Anfragen.",
      refresh: "↻ Nutzung aktualisieren",
      ready: "Nutzungsübersicht bereit",
      unknown: "Nicht erkannt"
    },

    fr: {
      title: "📊 Forfait et utilisation",
      plan: "Forfait actuel",
      planValue: "Informations sur le forfait",
      usage: "Aperçu de l’utilisation locale",
      chats: "Chats enregistrés",
      notes: "Notes Workspace",
      language: "Langue",
      storage: "Stockage du navigateur",
      available: "Disponible",
      unavailable: "Indisponible",
      local: "Stocké localement dans ce navigateur",
      limits: "Utilisation et limites",
      limitsText:
        "Les limites exactes du compte dépendent du forfait HEGEVA actif et des services connectés. Ce panneau n’invente ni n’estime les limites de facturation.",
      privacy:
        "Cet aperçu lit uniquement les informations locales du navigateur et ne crée aucune requête AI supplémentaire.",
      refresh: "↻ Actualiser l’utilisation",
      ready: "Aperçu de l’utilisation prêt",
      unknown: "Non détecté"
    },

    es: {
      title: "📊 Plan y uso",
      plan: "Plan actual",
      planValue: "Información del plan",
      usage: "Resumen de uso local",
      chats: "Chats guardados",
      notes: "Notas del Workspace",
      language: "Idioma",
      storage: "Almacenamiento del navegador",
      available: "Disponible",
      unavailable: "No disponible",
      local: "Guardado localmente en este navegador",
      limits: "Uso y límites",
      limitsText:
        "Los límites exactos de la cuenta dependen del plan HEGEVA activo y de los servicios conectados. Este panel no inventa ni estima límites de facturación.",
      privacy:
        "Este resumen solo lee información local del navegador y no genera solicitudes AI adicionales.",
      refresh: "↻ Actualizar uso",
      ready: "Resumen de uso listo",
      unknown: "No detectado"
    }
  };

  function language() {
    let lang = "";

    try {
      lang =
        localStorage.getItem("hegeva_language") ||
        localStorage.getItem("hegeva_language_v1") ||
        "";
    } catch (_) {}

    if (!lang) {
      const select = document.getElementById("languageSelect");
      if (select) lang = select.value || "";
    }

    lang = String(lang).toLowerCase().slice(0, 2);

    return LANGS.includes(lang) ? lang : "en";
  }

  function t() {
    return TEXT[language()] || TEXT.en;
  }

  function localStorageWorks() {
    try {
      const key = "__hegeva_v3541_test__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch (_) {
      return false;
    }
  }

  function savedChatCount() {
    const list = document.getElementById("savedChatsList");

    if (list) {
      const cards = list.querySelectorAll(
        ".saved-chat,[data-chat-id],[data-saved-chat]"
      );

      if (cards.length) return cards.length;
    }

    try {
      const possibleKeys = [
        "hegeva_saved_chats",
        "hegeva_savedChats",
        "savedChats"
      ];

      for (const key of possibleKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          return parsed.length;
        }

        if (parsed && typeof parsed === "object") {
          return Object.keys(parsed).length;
        }
      }
    } catch (_) {}

    return 0;
  }

  function notesStatus() {
    try {
      const keys = Object.keys(localStorage);

      const noteKey = keys.find(key =>
        /hegeva.*(?:workspace|note)/i.test(key)
      );

      if (!noteKey) return false;

      const value = localStorage.getItem(noteKey);

      return Boolean(
        value &&
        String(value).trim()
      );
    } catch (_) {
      return false;
    }
  }

  function detectPlan() {
    const selectors = [
      "[data-plan]",
      "[data-current-plan]",
      "#currentPlan",
      "#planName",
      ".current-plan",
      ".plan-name"
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);

      if (!el) continue;

      const value =
        el.dataset?.plan ||
        el.dataset?.currentPlan ||
        el.textContent;

      if (
        value &&
        String(value).trim()
      ) {
        return String(value).trim().slice(0, 80);
      }
    }

    return t().unknown;
  }

  function host() {
    return (
      document.querySelector(
        "#aiChatPanel,#aiChatSection,.ai-chat-panel,.chat-main"
      ) ||
      document.querySelector("main") ||
      document.body
    );
  }

  function styles() {
    if (document.getElementById("v3541PlansUsageStyle")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "v3541PlansUsageStyle";

    style.textContent = `
      #${ID}{
        margin:14px 0;
        padding:14px;
        border:1px solid rgba(244,196,86,.30);
        border-radius:16px;
        background:rgba(14,30,53,.76);
        box-sizing:border-box;
      }

      #${ID} *{
        box-sizing:border-box;
      }

      #${ID} .v3541-title{
        margin:0 0 12px;
        font-size:16px;
        font-weight:800;
      }

      #${ID} .v3541-grid{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
      }

      #${ID} .v3541-card{
        padding:11px;
        border:1px solid rgba(255,255,255,.10);
        border-radius:12px;
        background:rgba(255,255,255,.035);
        min-width:0;
      }

      #${ID} .v3541-label{
        display:block;
        opacity:.72;
        font-size:11px;
        margin-bottom:5px;
      }

      #${ID} .v3541-value{
        font-weight:750;
        overflow-wrap:anywhere;
      }

      #${ID} .v3541-info{
        margin-top:10px;
        padding:10px 11px;
        border-radius:12px;
        background:rgba(255,255,255,.035);
        line-height:1.45;
        font-size:12px;
      }

      #${ID} .v3541-actions{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin-top:11px;
      }

      #${ID} button{
        min-height:36px;
        padding:8px 12px;
        border-radius:10px;
        cursor:pointer;
        font:inherit;
        font-weight:750;
      }

      #${ID} .v3541-status{
        margin-top:8px;
        opacity:.72;
        font-size:11px;
      }

      @media(max-width:700px){
        #${ID} .v3541-grid{
          grid-template-columns:1fr;
        }

        #${ID}{
          padding:11px;
          border-radius:13px;
        }

        #${ID} button{
          width:100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function render() {
    const old = document.getElementById(ID);
    if (old) old.remove();

    styles();

    const text = t();
    const section = document.createElement("section");
    section.id = ID;
    section.dataset.hegevaVersion = VERSION;
    section.dataset.hegevaModule = MODULE;

    section.innerHTML = `
      <h3 class="v3541-title">${text.title}</h3>

      <div class="v3541-grid">
        <div class="v3541-card">
          <span class="v3541-label">${text.plan}</span>
          <div class="v3541-value" data-v3541="plan"></div>
        </div>

        <div class="v3541-card">
          <span class="v3541-label">${text.chats}</span>
          <div class="v3541-value" data-v3541="chats"></div>
        </div>

        <div class="v3541-card">
          <span class="v3541-label">${text.notes}</span>
          <div class="v3541-value" data-v3541="notes"></div>
        </div>

        <div class="v3541-card">
          <span class="v3541-label">${text.language}</span>
          <div class="v3541-value" data-v3541="language"></div>
        </div>

        <div class="v3541-card">
          <span class="v3541-label">${text.storage}</span>
          <div class="v3541-value" data-v3541="storage"></div>
        </div>

        <div class="v3541-card">
          <span class="v3541-label">${text.usage}</span>
          <div class="v3541-value">${text.local}</div>
        </div>
      </div>

      <div class="v3541-info">
        <strong>${text.limits}</strong><br>
        ${text.limitsText}
      </div>

      <div class="v3541-info">
        🔒 ${text.privacy}
      </div>

      <div class="v3541-actions">
        <button type="button" data-v3541-action="refresh">
          ${text.refresh}
        </button>
      </div>

      <div class="v3541-status" data-v3541="status">
        ✓ ${text.ready}
      </div>
    `;

    host().appendChild(section);

    update();
  }

  function update() {
    const root = document.getElementById(ID);
    if (!root) return;

    const text = t();

    const plan = root.querySelector('[data-v3541="plan"]');
    const chats = root.querySelector('[data-v3541="chats"]');
    const notes = root.querySelector('[data-v3541="notes"]');
    const lang = root.querySelector('[data-v3541="language"]');
    const storage = root.querySelector('[data-v3541="storage"]');
    const status = root.querySelector('[data-v3541="status"]');

    if (plan) plan.textContent = detectPlan();
    if (chats) chats.textContent = String(savedChatCount());

    if (notes) {
      notes.textContent =
        notesStatus()
          ? `✓ ${text.available}`
          : `• ${text.unavailable}`;
    }

    if (lang) {
      lang.textContent = language().toUpperCase();
    }

    if (storage) {
      storage.textContent =
        localStorageWorks()
          ? `✓ ${text.available}`
          : `× ${text.unavailable}`;
    }

    if (status) {
      status.textContent = `✓ ${text.ready}`;
    }
  }

  function events() {
    document.addEventListener("click", event => {
      const button = event.target.closest(
        '[data-v3541-action="refresh"]'
      );

      if (!button) return;

      update();
    });

    const languageSelect =
      document.getElementById("languageSelect");

    languageSelect?.addEventListener(
      "change",
      () => {
        setTimeout(render, 80);
      }
    );

    window.addEventListener(
      "storage",
      event => {
        if (
          !event.key ||
          /hegeva|saved|workspace|note/i.test(event.key)
        ) {
          setTimeout(update, 40);
        }
      }
    );
  }

  function boot() {
    render();
    events();

    window.hegevaV3541PlansUsage = {
      version: VERSION,
      module: MODULE,
      refresh: update,
      render,
      localOnly: true,
      extraAIRequest: false,
      changesAIBackend: false,
      changesStripe: false,
      changesBilling: false,
      changesAuthentication: false
    };

    console.log(
      "HEGEVA AI V35.4.1 Plans & Usage active."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      { once: true }
    );
  } else {
    boot();
  }
})();
