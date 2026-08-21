/* =========================================================
   HEGEVA AI V35.4.1
   MODULE 7/8 — PERFORMANCE + CLEANUP
   DOM OPTIMISATION + SAFE CLEANUP + STABILITY
   NO AI / BILLING / AUTH BACKEND CHANGES
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.1";
  const MODULE = "PERFORMANCE_CLEANUP";

  const state = {
    scheduled: false,
    lastRun: 0,
    runs: 0
  };

  function removeDuplicateIds() {
    const seen = new Set();

    document.querySelectorAll("[id]").forEach(el => {
      const id = el.id;
      if (!id) return;

      if (seen.has(id)) {
        if (
          id.startsWith("v3541") ||
          id.startsWith("v3540")
        ) {
          el.remove();
        }
        return;
      }

      seen.add(id);
    });
  }

  function cleanupEmptyTemporaryNodes() {
    document
      .querySelectorAll(
        [
          "[data-hegeva-temp='true']",
          ".hegeva-temp",
          ".v3541-temp"
        ].join(",")
      )
      .forEach(el => {
        if (
          !el.textContent.trim() &&
          !el.children.length
        ) {
          el.remove();
        }
      });
  }

  function protectExternalLinks() {
    document
      .querySelectorAll('a[target="_blank"]')
      .forEach(link => {
        const rel = new Set(
          String(link.rel || "")
            .split(/\s+/)
            .filter(Boolean)
        );

        rel.add("noopener");
        rel.add("noreferrer");

        link.rel = [...rel].join(" ");
      });
  }

  function optimiseImages() {
    document
      .querySelectorAll("img")
      .forEach((img, index) => {
        if (!img.hasAttribute("decoding")) {
          img.decoding = "async";
        }

        if (
          index > 1 &&
          !img.hasAttribute("loading")
        ) {
          img.loading = "lazy";
        }
      });
  }

  function textareaGuard() {
    document
      .querySelectorAll("textarea")
      .forEach(el => {
        if (!el.style.resize) {
          el.style.resize = "vertical";
        }
      });
  }

  function markReadyModules() {
    const modules = [
      "hegevaV3541PlansUsage",
      "hegevaV3541MobileI18n"
    ];

    modules.forEach(name => {
      if (window[name]) {
        document.documentElement.dataset[
          name
            .replace(/^hegeva/, "")
            .replace(/[^a-z0-9]/gi, "")
            .toLowerCase()
        ] = "ready";
      }
    });
  }

  function runCleanup() {
    state.scheduled = false;
    state.lastRun = Date.now();
    state.runs += 1;

    removeDuplicateIds();
    cleanupEmptyTemporaryNodes();
    protectExternalLinks();
    optimiseImages();
    textareaGuard();
    markReadyModules();
  }

  function scheduleCleanup(force = false) {
    if (state.scheduled) return;

    if (
      !force &&
      state.lastRun &&
      Date.now() - state.lastRun < 1500
    ) {
      return;
    }

    state.scheduled = true;

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(
        runCleanup,
        { timeout: 800 }
      );
    } else {
      setTimeout(runCleanup, 120);
    }
  }

  function boot() {
    // One idle cleanup after initial rendering is enough for normal startup.
    // Dynamic modules may call refresh() explicitly when they add new content.
    scheduleCleanup(true);

    window.hegevaV3541Performance = {
      version: VERSION,
      module: MODULE,
      refresh: () => scheduleCleanup(false),
      state,
      safeCleanup: true,
      lazyImages: true,
      externalLinkProtection: true,
      repeatedVisibilityScan: false,
      extraAIRequest: false,
      changesAIBackend: false,
      changesStripe: false,
      changesBilling: false,
      changesAuthentication: false,
      changesD1: false
    };

    console.log(
      "HEGEVA AI V35.4.1 Performance + Cleanup active."
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
