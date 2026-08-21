/* =========================================================
   HEGEVA AI V35.3.17
   SMART SAVED CHAT CONTROL CENTER
   SEARCH MEMORY + FILTER MEMORY + SORT + RESET
   MOBILE UI + LANGUAGE SYNC + STABILITY
   EN / HU / DE / FR / ES
   LOCAL ONLY — NO EXTRA AI REQUEST
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.3.17";

  const LANGS = [
    "en",
    "hu",
    "de",
    "fr",
    "es"
  ];

  const STORAGE = {
    search: "hegeva_v35317_search",
    filter: "hegeva_v35317_filter",
    sort: "hegeva_v35317_sort"
  };

  const TEXT = {
    en: {
      sort: "Sort",
      newest: "Newest first",
      oldest: "Oldest first",
      nameAZ: "Name A–Z",
      nameZA: "Name Z–A",
      reset: "Reset",
      active: "Filters active",
      ready: "Saved chats ready"
    },

    hu: {
      sort: "Rendezés",
      newest: "Legújabb elöl",
      oldest: "Legrégebbi elöl",
      nameAZ: "Név A–Z",
      nameZA: "Név Z–A",
      reset: "Alaphelyzet",
      active: "Szűrők aktívak",
      ready: "Mentett chatek készen"
    },

    de: {
      sort: "Sortieren",
      newest: "Neueste zuerst",
      oldest: "Älteste zuerst",
      nameAZ: "Name A–Z",
      nameZA: "Name Z–A",
      reset: "Zurücksetzen",
      active: "Filter aktiv",
      ready: "Gespeicherte Chats bereit"
    },

    fr: {
      sort: "Trier",
      newest: "Plus récents",
      oldest: "Plus anciens",
      nameAZ: "Nom A–Z",
      nameZA: "Nom Z–A",
      reset: "Réinitialiser",
      active: "Filtres actifs",
      ready: "Discussions enregistrées prêtes"
    },

    es: {
      sort: "Ordenar",
      newest: "Más recientes",
      oldest: "Más antiguos",
      nameAZ: "Nombre A–Z",
      nameZA: "Nombre Z–A",
      reset: "Restablecer",
      active: "Filtros activos",
      ready: "Chats guardados listos"
    }
  };

  function language() {
    const select =
      document.getElementById("languageSelect");

    const raw = String(
      select?.value ||
      localStorage.getItem("hegeva_language") ||
      document.documentElement.lang ||
      "en"
    )
      .toLowerCase()
      .slice(0, 2);

    return LANGS.includes(raw)
      ? raw
      : "en";
  }

  function text() {
    return TEXT[language()] || TEXT.en;
  }

  function saveState() {
    const search =
      document.getElementById(
        "hegevaV35316Search"
      );

    const filter =
      document.getElementById(
        "hegevaV35316Filter"
      );

    const sort =
      document.getElementById(
        "hegevaV35317Sort"
      );

    if (search) {
      localStorage.setItem(
        STORAGE.search,
        search.value || ""
      );
    }

    if (filter) {
      localStorage.setItem(
        STORAGE.filter,
        filter.value || "all"
      );
    }

    if (sort) {
      localStorage.setItem(
        STORAGE.sort,
        sort.value || "newest"
      );
    }
  }

  function restoreState() {
    const search =
      document.getElementById(
        "hegevaV35316Search"
      );

    const filter =
      document.getElementById(
        "hegevaV35316Filter"
      );

    const sort =
      document.getElementById(
        "hegevaV35317Sort"
      );

    if (search) {
      search.value =
        localStorage.getItem(
          STORAGE.search
        ) || "";
    }

    if (filter) {
      const saved =
        localStorage.getItem(
          STORAGE.filter
        ) || "all";

      const exists =
        [...filter.options]
          .some(
            option =>
              option.value === saved
          );

      filter.value =
        exists ? saved : "all";
    }

    if (sort) {
      const saved =
        localStorage.getItem(
          STORAGE.sort
        ) || "newest";

      sort.value = saved;
    }
  }

  function installStyle() {
    if (
      document.getElementById(
        "hegevaV35317Style"
      )
    ) return;

    const style =
      document.createElement("style");

    style.id =
      "hegevaV35317Style";

    style.textContent = `
      #hegevaV35317Controls{
        display:flex;
        align-items:center;
        gap:8px;
        flex-wrap:wrap;
        margin:8px 0 10px;
      }

      #hegevaV35317Sort,
      #hegevaV35317Reset{
        min-height:38px;
        border-radius:10px;
        border:1px solid rgba(212,175,55,.34);
        background:rgba(9,15,28,.94);
        color:#f6e7a8;
        padding:0 10px;
        outline:none;
      }

      #hegevaV35317Sort{
        flex:1 1 145px;
      }

      #hegevaV35317Reset{
        cursor:pointer;
        font-weight:700;
      }

      #hegevaV35317Reset:hover{
        border-color:rgba(244,197,66,.72);
      }

      #hegevaV35317Status{
        width:100%;
        min-height:18px;
        font-size:11px;
        opacity:.72;
        padding:1px 2px;
      }

      #savedChatsList .saved-chat{
        transition:
          opacity .16s ease,
          transform .16s ease,
          border-color .16s ease;
      }

      #savedChatsList .saved-chat:not([hidden]):hover{
        transform:translateY(-1px);
      }

      body[data-hegeva-language] #aiChatMessages,
      body[data-hegeva-language] #aiChatInput,
      body[data-hegeva-language] #savedChatsList{
        unicode-bidi:plaintext;
      }

      @media (max-width:720px){
        #hegevaV35316Toolbar{
          display:grid !important;
          grid-template-columns:1fr !important;
          gap:8px !important;
        }

        #hegevaV35316Search,
        #hegevaV35316Filter,
        #hegevaV35317Sort,
        #hegevaV35317Reset{
          width:100% !important;
          max-width:none !important;
          min-width:0 !important;
        }

        #hegevaV35317Controls{
          display:grid;
          grid-template-columns:1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureControls() {
    const toolbar =
      document.getElementById(
        "hegevaV35316Toolbar"
      );

    if (!toolbar) return null;

    let controls =
      document.getElementById(
        "hegevaV35317Controls"
      );

    if (controls) return controls;

    controls =
      document.createElement("div");

    controls.id =
      "hegevaV35317Controls";

    controls.innerHTML = `
      <select
        id="hegevaV35317Sort"
        aria-label="Saved chat sort"
      >
        <option value="newest"></option>
        <option value="oldest"></option>
        <option value="az"></option>
        <option value="za"></option>
      </select>

      <button
        id="hegevaV35317Reset"
        type="button"
      ></button>

      <div
        id="hegevaV35317Status"
        aria-live="polite"
      ></div>
    `;

    toolbar.insertAdjacentElement(
      "afterend",
      controls
    );

    document
      .getElementById(
        "hegevaV35317Sort"
      )
      ?.addEventListener(
        "change",
        () => {
          saveState();
          refresh();
        }
      );

    document
      .getElementById(
        "hegevaV35317Reset"
      )
      ?.addEventListener(
        "click",
        resetAll
      );

    document
      .getElementById(
        "hegevaV35316Search"
      )
      ?.addEventListener(
        "input",
        () => {
          saveState();
          updateStatus();
        }
      );

    document
      .getElementById(
        "hegevaV35316Filter"
      )
      ?.addEventListener(
        "change",
        () => {
          saveState();
          updateStatus();
        }
      );

    return controls;
  }

  function timestamp(card) {
    const possible = [
      card.dataset.timestamp,
      card.dataset.savedAt,
      card.dataset.createdAt,
      card.dataset.updatedAt,
      card.getAttribute(
        "data-time"
      ),
      card.getAttribute(
        "data-date"
      )
    ];

    for (
      const value of possible
    ) {
      if (!value) continue;

      const numeric =
        Number(value);

      if (
        Number.isFinite(numeric) &&
        numeric > 0
      ) {
        return numeric;
      }

      const parsed =
        Date.parse(value);

      if (
        Number.isFinite(parsed)
      ) {
        return parsed;
      }
    }

    return Number(
      card.dataset.v35317Order ||
      0
    );
  }

  function title(card) {
    const target =
      card.querySelector(
        [
          "[data-chat-title]",
          ".saved-chat-title",
          ".chat-title",
          "strong",
          "b"
        ].join(",")
      );

    return String(
      target?.textContent ||
      card.dataset.title ||
      card.textContent ||
      ""
    )
      .trim()
      .toLocaleLowerCase(
        language()
      );
  }

  function rememberOriginalOrder() {
    const list =
      document.getElementById(
        "savedChatsList"
      );

    if (!list) return;

    [
      ...list.querySelectorAll(
        ".saved-chat"
      )
    ].forEach(
      (card, index) => {
        if (
          !card.dataset
            .v35317Order
        ) {
          card.dataset
            .v35317Order =
              String(index + 1);
        }
      }
    );
  }

  function sortChats() {
    const list =
      document.getElementById(
        "savedChatsList"
      );

    const sort =
      document.getElementById(
        "hegevaV35317Sort"
      )?.value || "newest";

    if (!list) return;

    rememberOriginalOrder();

    const cards = [
      ...list.querySelectorAll(
        ".saved-chat"
      )
    ];

    cards.sort(
      (a, b) => {
        if (sort === "az") {
          return title(a)
            .localeCompare(
              title(b),
              language()
            );
        }

        if (sort === "za") {
          return title(b)
            .localeCompare(
              title(a),
              language()
            );
        }

        const ta =
          timestamp(a);

        const tb =
          timestamp(b);

        if (sort === "oldest") {
          return ta - tb;
        }

        return tb - ta;
      }
    );

    const fragment =
      document
        .createDocumentFragment();

    cards.forEach(
      card =>
        fragment.appendChild(card)
    );

    list.appendChild(fragment);
  }

  function lockLanguage() {
    const lang =
      language();

    localStorage.setItem(
      "hegeva_language",
      lang
    );

    document
      .documentElement
      .setAttribute(
        "lang",
        lang
      );

    if (document.body) {
      document.body.dataset
        .hegevaLanguage =
          lang;
    }

    [
      "aiChatInput",
      "aiChatMessages",
      "savedChatsList",
      "hegevaV35316Search",
      "hegevaV35316Filter",
      "hegevaV35317Sort"
    ].forEach(
      id => {
        const el =
          document
            .getElementById(id);

        if (el) {
          el.setAttribute(
            "lang",
            lang
          );
        }
      }
    );
  }

  function translate() {
    lockLanguage();

    const t = text();

    const sort =
      document.getElementById(
        "hegevaV35317Sort"
      );

    const reset =
      document.getElementById(
        "hegevaV35317Reset"
      );

    if (sort) {
      sort.setAttribute(
        "aria-label",
        t.sort
      );

      const options =
        sort.options;

      if (options[0]) {
        options[0].textContent =
          t.newest;
      }

      if (options[1]) {
        options[1].textContent =
          t.oldest;
      }

      if (options[2]) {
        options[2].textContent =
          t.nameAZ;
      }

      if (options[3]) {
        options[3].textContent =
          t.nameZA;
      }
    }

    if (reset) {
      reset.textContent =
        "↺ " + t.reset;
    }

    updateStatus();
  }

  function updateStatus() {
    const status =
      document.getElementById(
        "hegevaV35317Status"
      );

    if (!status) return;

    const search =
      document.getElementById(
        "hegevaV35316Search"
      );

    const filter =
      document.getElementById(
        "hegevaV35316Filter"
      );

    const sort =
      document.getElementById(
        "hegevaV35317Sort"
      );

    const active =
      Boolean(
        search?.value?.trim()
      ) ||
      Boolean(
        filter &&
        filter.value !== "all"
      ) ||
      Boolean(
        sort &&
        sort.value !== "newest"
      );

    status.textContent =
      active
        ? "● " + text().active
        : "✓ " + text().ready;
  }

  function resetAll() {
    const search =
      document.getElementById(
        "hegevaV35316Search"
      );

    const filter =
      document.getElementById(
        "hegevaV35316Filter"
      );

    const sort =
      document.getElementById(
        "hegevaV35317Sort"
      );

    if (search) {
      search.value = "";
    }

    if (filter) {
      filter.value = "all";
    }

    if (sort) {
      sort.value = "newest";
    }

    localStorage.removeItem(
      STORAGE.search
    );

    localStorage.removeItem(
      STORAGE.filter
    );

    localStorage.removeItem(
      STORAGE.sort
    );

    window.hegevaV35316
      ?.applyFilters
      ?.();

    refresh();
  }

  function refresh() {
    lockLanguage();

    sortChats();

    const search =
      document.getElementById(
        "hegevaV35316Search"
      );

    if (search) {
      search.dispatchEvent(
        new Event(
          "input",
          {
            bubbles: true
          }
        )
      );
    }

    updateStatus();
  }

  function observe() {
    const list =
      document.getElementById(
        "savedChatsList"
      );

    if (
      !list ||
      list.dataset
        .v35317Observed ===
          "true"
    ) return;

    list.dataset
      .v35317Observed =
        "true";

    let timer = null;

    new MutationObserver(
      () => {
        clearTimeout(timer);

        timer =
          setTimeout(
            () => {
              rememberOriginalOrder();
              sortChats();
              updateStatus();
            },
            80
          );
      }
    ).observe(
      list,
      {
        childList: true,
        subtree: true
      }
    );
  }

  function boot() {
    installStyle();

    let waitAttempts = 0;
    const maxWaitAttempts = 40;

    const waitForV35316 =
      () => {
        waitAttempts += 1;

        const toolbar =
          document.getElementById(
            "hegevaV35316Toolbar"
          );

        const list =
          document.getElementById(
            "savedChatsList"
          );

        if (
          !toolbar ||
          !list
        ) {
          if (
            waitAttempts <
            maxWaitAttempts
          ) {
            setTimeout(
              waitForV35316,
              120
            );
          } else {
            console.warn(
              "HEGEVA V35.3.17 saved-chat controls were not available during startup."
            );
          }

          return;
        }

        ensureControls();
        restoreState();
        rememberOriginalOrder();
        translate();
        observe();
        refresh();

        document
          .getElementById(
            "languageSelect"
          )
          ?.addEventListener(
            "change",
            () => {
              setTimeout(
                () => {
                  translate();
                  refresh();
                },
                70
              );
            }
          );

        window.addEventListener(
          "storage",
          event => {
            if (
              event.key ===
              "hegeva_language"
            ) {
              setTimeout(
                translate,
                30
              );
            }
          }
        );

        window.hegevaV35317 = {
          version: VERSION,
          savedChatSort: true,
          persistentSearch: true,
          persistentFilter: true,
          persistentSort: true,
          resetControls: true,
          mobileToolbar: true,
          languageSync: true,
          autoRefresh: true,
          localOnly: true,
          extraAiRequest: false,
          changesAIBackend: false,
          changesStripe: false,
          changesBilling: false,
          changesAuthentication: false
        };

        console.log(
          "HEGEVA AI V35.3.17 Smart Saved Chat Control Center active."
        );
      };

    waitForV35316();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once: true
      }
    );
  } else {
    boot();
  }

})();
