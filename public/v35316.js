/* =========================================================
   HEGEVA AI V35.3.16
   SAVED CHAT SEARCH + FILTER + LANGUAGE LOCK
   EN / HU / DE / FR / ES
   LOCAL ONLY — NO EXTRA AI REQUEST
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.3.16";
  const LANGS = ["en", "hu", "de", "fr", "es"];

  const TEXT = {
    en: {
      search: "Search saved chats...",
      all: "All categories",
      favourite: "Favourite",
      business: "Business",
      finance: "Finance",
      document: "Document",
      idea: "Idea",
      empty: "No saved chats match your search.",
      shown: (a,b) => `${a} of ${b} shown`
    },
    hu: {
      search: "Keresés a mentett beszélgetésekben...",
      all: "Minden kategória",
      favourite: "Kedvencek",
      business: "Üzlet",
      finance: "Pénzügy",
      document: "Dokumentum",
      idea: "Ötlet",
      empty: "Nincs a keresésnek megfelelő mentett beszélgetés.",
      shown: (a,b) => `${a} / ${b} látható`
    },
    de: {
      search: "Gespeicherte Chats durchsuchen...",
      all: "Alle Kategorien",
      favourite: "Favoriten",
      business: "Geschäft",
      finance: "Finanzen",
      document: "Dokument",
      idea: "Idee",
      empty: "Keine gespeicherten Chats entsprechen der Suche.",
      shown: (a,b) => `${a} von ${b} angezeigt`
    },
    fr: {
      search: "Rechercher dans les discussions enregistrées...",
      all: "Toutes les catégories",
      favourite: "Favoris",
      business: "Entreprise",
      finance: "Finance",
      document: "Document",
      idea: "Idée",
      empty: "Aucune discussion enregistrée ne correspond à la recherche.",
      shown: (a,b) => `${a} sur ${b} affichées`
    },
    es: {
      search: "Buscar en chats guardados...",
      all: "Todas las categorías",
      favourite: "Favoritos",
      business: "Negocios",
      finance: "Finanzas",
      document: "Documento",
      idea: "Idea",
      empty: "Ningún chat guardado coincide con la búsqueda.",
      shown: (a,b) => `${a} de ${b} mostrados`
    }
  };

  function getLanguage() {
    const select = document.getElementById("languageSelect");

    const value = String(
      select?.value ||
      localStorage.getItem("hegeva_language") ||
      document.documentElement.lang ||
      "en"
    ).toLowerCase().slice(0, 2);

    return LANGS.includes(value) ? value : "en";
  }

  function lockLanguage() {
    const lang = getLanguage();

    localStorage.setItem("hegeva_language", lang);
    document.documentElement.lang = lang;

    [
      "aiChatInput",
      "aiChatMessages",
      "savedChatsList",
      "hegevaV35316Search",
      "hegevaV35316Filter"
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.setAttribute("lang", lang);
    });

    return lang;
  }

  function normalize(value) {
    return String(value || "")
      .toLocaleLowerCase(getLanguage())
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function categoryOf(card) {
    const direct = String(
      card.dataset.category ||
      card.dataset.chatCategory ||
      ""
    ).toLowerCase();

    const keys = [
      "favourite",
      "business",
      "finance",
      "document",
      "idea"
    ];

    for (const key of keys) {
      if (
        direct.includes(key) ||
        card.classList.contains(key) ||
        card.classList.contains(`category-${key}`)
      ) {
        return key;
      }
    }

    return "";
  }

  function installStyle() {
    if (document.getElementById("hegevaV35316Style")) return;

    const style = document.createElement("style");
    style.id = "hegevaV35316Style";

    style.textContent = `
      #hegevaV35316Toolbar{
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:10px;
        margin:12px 0;
      }

      #hegevaV35316Toolbar input,
      #hegevaV35316Toolbar select{
        min-height:42px;
        border:1px solid rgba(212,175,55,.35);
        border-radius:12px;
        background:rgba(10,10,12,.9);
        color:#f5e7aa;
        padding:0 12px;
        outline:none;
      }

      #hegevaV35316Search{
        flex:1 1 230px;
        min-width:180px;
      }

      #hegevaV35316Filter{
        flex:0 1 190px;
      }

      #hegevaV35316Count{
        font-size:12px;
        opacity:.78;
        white-space:nowrap;
      }

      #hegevaV35316Empty{
        display:none;
        padding:12px;
        margin:8px 0;
        text-align:center;
        border:1px dashed rgba(212,175,55,.3);
        border-radius:12px;
        opacity:.78;
      }

      #savedChatsList .saved-chat[data-v35316-hidden="true"]{
        display:none !important;
      }
    `;

    document.head.appendChild(style);
  }

  function installToolbar() {
    const list = document.getElementById("savedChatsList");
    if (!list) return null;

    let toolbar =
      document.getElementById("hegevaV35316Toolbar");

    if (toolbar) return toolbar;

    toolbar = document.createElement("div");
    toolbar.id = "hegevaV35316Toolbar";

    toolbar.innerHTML = `
      <input
        id="hegevaV35316Search"
        type="search"
        autocomplete="off"
        spellcheck="false"
      >

      <select id="hegevaV35316Filter">
        <option value="all"></option>
        <option value="favourite"></option>
        <option value="business"></option>
        <option value="finance"></option>
        <option value="document"></option>
        <option value="idea"></option>
      </select>

      <span id="hegevaV35316Count"></span>
    `;

    const empty = document.createElement("div");
    empty.id = "hegevaV35316Empty";

    list.parentNode?.insertBefore(toolbar, list);
    list.parentNode?.insertBefore(empty, list.nextSibling);

    document
      .getElementById("hegevaV35316Search")
      ?.addEventListener("input", filterChats);

    document
      .getElementById("hegevaV35316Filter")
      ?.addEventListener("change", filterChats);

    return toolbar;
  }

  function translate() {
    lockLanguage();
    installToolbar();

    const t = TEXT[getLanguage()] || TEXT.en;

    const search =
      document.getElementById("hegevaV35316Search");

    const filter =
      document.getElementById("hegevaV35316Filter");

    const empty =
      document.getElementById("hegevaV35316Empty");

    if (search) {
      search.placeholder = t.search;
    }

    if (filter) {
      const labels = {
        all: t.all,
        favourite: t.favourite,
        business: t.business,
        finance: t.finance,
        document: t.document,
        idea: t.idea
      };

      [...filter.options].forEach(option => {
        option.textContent =
          labels[option.value] || option.value;
      });
    }

    if (empty) {
      empty.textContent = t.empty;
    }

    filterChats();
  }

  function filterChats() {
    const list =
      document.getElementById("savedChatsList");

    if (!list) return;

    const query = normalize(
      document.getElementById("hegevaV35316Search")?.value
    );

    const selected =
      document.getElementById("hegevaV35316Filter")?.value ||
      "all";

    const cards = [
      ...list.querySelectorAll(".saved-chat")
    ];

    let visible = 0;

    cards.forEach(card => {
      const textMatch =
        !query ||
        normalize(card.textContent).includes(query);

      const categoryMatch =
        selected === "all" ||
        categoryOf(card) === selected;

      const show =
        textMatch && categoryMatch;

      card.dataset.v35316Hidden =
        show ? "false" : "true";

      card.hidden = !show;

      if (show) visible++;
    });

    const count =
      document.getElementById("hegevaV35316Count");

    const empty =
      document.getElementById("hegevaV35316Empty");

    const t = TEXT[getLanguage()] || TEXT.en;

    if (count) {
      count.textContent =
        t.shown(visible, cards.length);
    }

    if (empty) {
      empty.style.display =
        cards.length > 0 && visible === 0
          ? "block"
          : "none";
    }
  }

  function observeSavedChats() {
    const list =
      document.getElementById("savedChatsList");

    if (
      !list ||
      list.dataset.v35316Observed === "true"
    ) return;

    list.dataset.v35316Observed = "true";

    let scheduled = false;

    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        scheduled = false;
        filterChats();
      });
    }).observe(list, {
      childList: true,
      subtree: true
    });
  }

  function boot() {
    installStyle();
    lockLanguage();
    installToolbar();
    translate();
    observeSavedChats();

    document
      .getElementById("languageSelect")
      ?.addEventListener("change", () => {
        setTimeout(translate, 50);
      });

    window.hegevaV35316 = {
      version: VERSION,
      savedChatSearch: true,
      savedChatFilter: true,
      languageLock: true,
      languages: [...LANGS],
      localOnly: true,
      extraAiRequest: false,
      changesAIBackend: false,
      changesStripe: false,
      changesBilling: false,
      changesAuthentication: false
    };

    console.log(
      "HEGEVA AI V35.3.16 Saved Chat Search + Filter + Language Lock active."
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
