/* HEGEVA AI V35.4.5 — Home Robot Hero Fix */
(() => {
  "use strict";

  const STYLE_ID = "hegeva-v3545-home-robot-style";

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      section.hero {
        position: relative !important;
        overflow: hidden !important;
        min-height: 430px;
        padding-right: 47% !important;
        background:
          radial-gradient(circle at 82% 45%, rgba(0,255,160,.12), transparent 30%),
          radial-gradient(circle at 68% 70%, rgba(112,64,255,.14), transparent 35%),
          linear-gradient(120deg, rgba(22,25,34,.98), rgba(12,23,43,.98)) !important;
      }

      section.hero .vision-visual {
        position: absolute !important;
        right: 1.5% !important;
        top: 50% !important;
        transform: translateY(-50%) !important;

        width: 46% !important;
        height: 94% !important;
        max-width: none !important;

        background:
          url("/assets/hegeva-home-hero.png")
          center center / contain no-repeat !important;

        border: 0 !important;
        border-radius: 24px !important;
        box-shadow: none !important;
        z-index: 1 !important;
      }

      section.hero .vision-visual .orb-ring,
      section.hero .vision-visual .ai-core,
      section.hero .vision-visual .vision-chip {
        display: none !important;
      }

      section.hero > .badge,
      section.hero > h2,
      section.hero > p,
      section.hero > .hero-buttons {
        position: relative !important;
        z-index: 3 !important;
      }

      section.hero::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        background:
          linear-gradient(
            90deg,
            rgba(15,18,26,.18) 0%,
            rgba(15,18,26,.05) 46%,
            rgba(15,18,26,0) 70%
          );
      }

      @media (max-width: 1050px) {
        section.hero {
          padding-right: 38% !important;
        }

        section.hero .vision-visual {
          width: 40% !important;
          right: 0 !important;
        }
      }

      @media (max-width: 780px) {
        section.hero {
          min-height: auto;
          padding-right: 24px !important;
          padding-bottom: 310px !important;
        }

        section.hero .vision-visual {
          width: 100% !important;
          height: 300px !important;
          right: 0 !important;
          top: auto !important;
          bottom: 0 !important;
          transform: none !important;
          background-position: center !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function install() {
    addStyle();

    const badge = document.querySelector(
      'section.hero [data-i18n="home.badge"]'
    );

    const hero = badge?.closest("section.hero");

    if (!hero) return false;

    const visual = hero.querySelector(".vision-visual");

    if (!visual) return false;

    visual.classList.add("hegeva-home-robot");

    return true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      install();
      setTimeout(install, 300);
      setTimeout(install, 1000);
    });
  } else {
    install();
    setTimeout(install, 300);
    setTimeout(install, 1000);
  }
})();
