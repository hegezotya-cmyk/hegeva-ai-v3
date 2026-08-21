/* HEGEVA AI — Premium Home V4: finite, stable takeover */
(() => {
  "use strict";

  const STYLE_ID = "hegeva-premium-home-v4";
  const ROBOT_SRC = "/assets/hegeva-home-hero.png?v=robot-v4";
  const LOGO_SRC = "/assets/hegeva-wing-logo.svg?v=brand-v4";

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
:root{--hg-lime:#adff16;--hg-green:#66ef00;--hg-gold:#ffc83d;--hg-text:#f7fbf8;--hg-muted:#a9b9af}
html,body{background:radial-gradient(circle at 76% 5%,rgba(91,255,0,.085),transparent 24%),radial-gradient(circle at 14% 16%,rgba(255,200,61,.06),transparent 20%),linear-gradient(180deg,#010503,#07110b 58%,#020604)!important;color:var(--hg-text)!important}
header{background:rgba(1,6,4,.985)!important;border-bottom:1px solid rgba(173,255,22,.16)!important;backdrop-filter:blur(16px)!important}
.brand{display:flex!important;align-items:center!important;min-width:250px!important}
.brand>*{display:none!important}.brand .hegeva-v4-logo{display:block!important;width:255px!important;height:68px!important;object-fit:contain!important;object-position:left center!important;filter:drop-shadow(0 0 15px rgba(255,200,61,.16))}
.sidebar{background:linear-gradient(180deg,#020805,#031009)!important;border-right:1px solid rgba(173,255,22,.14)!important;box-shadow:18px 0 46px rgba(0,0,0,.16)!important}
.main{background:radial-gradient(circle at 72% 0%,rgba(95,255,0,.05),transparent 28%)!important}
.nav-button{border:1px solid transparent!important;border-radius:12px!important;color:#c6d2ca!important;transition:.18s ease!important}.nav-button:hover{color:#fff!important;background:rgba(173,255,22,.055)!important;border-color:rgba(173,255,22,.18)!important;transform:translateX(2px)}.nav-button.active{color:#fff!important;background:linear-gradient(90deg,rgba(173,255,22,.15),rgba(255,200,61,.055))!important;border-color:rgba(173,255,22,.40)!important;box-shadow:inset 3px 0 0 var(--hg-gold),0 0 24px rgba(100,255,0,.09)!important}
.card,.panel,.tool-card,.pricing-card,.stat-card,.metric-card,.feature-card,.v28-action,#v3540Workspace,#v3540Security,#hegevaV3541PlansUsage{background:linear-gradient(145deg,rgba(9,23,16,.97),rgba(3,10,7,.96))!important;border:1px solid rgba(255,200,61,.17)!important;border-radius:15px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 16px 38px rgba(0,0,0,.19)!important}
button,.primary-button,.secondary-button,.btn,a.button{border-radius:10px!important;font-weight:800!important}.primary-button,.btn-primary,button.primary{color:#061004!important;background:linear-gradient(135deg,#e2ff4c 0%,#91f800 54%,#ffd04c 100%)!important;border:1px solid rgba(255,229,105,.82)!important;box-shadow:0 9px 24px rgba(116,241,0,.19),inset 0 1px 0 rgba(255,255,255,.55)!important}

section.hero.hegeva-v4-hero{position:relative!important;display:grid!important;grid-template-columns:minmax(0,1.03fr) minmax(370px,.97fr)!important;align-items:center!important;gap:18px!important;overflow:hidden!important;isolation:isolate!important;min-height:575px!important;padding:48px 40px 42px 48px!important;border:1px solid rgba(255,200,61,.32)!important;border-radius:24px!important;background:radial-gradient(circle at 78% 48%,rgba(115,255,0,.23),transparent 24%),radial-gradient(circle at 92% 16%,rgba(255,200,61,.11),transparent 19%),linear-gradient(116deg,#020705 0%,#07140c 48%,#021008 100%)!important;box-shadow:0 30px 82px rgba(0,0,0,.44),inset 0 1px 0 rgba(255,255,255,.04)!important}
section.hero.hegeva-v4-hero::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(rgba(173,255,22,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(173,255,22,.024) 1px,transparent 1px);background-size:38px 38px;mask-image:linear-gradient(90deg,transparent 0%,black 49%,black 100%)}
.hegeva-v4-copy{position:relative!important;z-index:6!important;max-width:680px!important}.hegeva-v4-badge{display:inline-flex!important;padding:8px 12px!important;border-radius:999px!important;border:1px solid rgba(255,200,61,.36)!important;background:rgba(255,200,61,.09)!important;color:#ffe7a4!important;font-size:11px!important;font-weight:900!important;letter-spacing:.04em!important;margin-bottom:18px!important}.hegeva-v4-title{margin:0!important;font-size:clamp(43px,5vw,73px)!important;line-height:.97!important;letter-spacing:-.055em!important;color:#fff!important}.hegeva-v4-title span:first-child{display:block!important;color:#fff!important;-webkit-text-fill-color:#fff!important}.hegeva-v4-title .gradient-text{display:block!important;background:linear-gradient(90deg,#e4ff55 0%,#96fa00 52%,#ffc83d 100%)!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important}.hegeva-v4-sub{margin-top:18px!important;max-width:620px!important;color:#b9c9bf!important;font-size:15px!important;line-height:1.65!important}.hegeva-v4-actions{display:flex!important;flex-wrap:wrap!important;gap:12px!important;margin-top:25px!important}
.hegeva-v4-visual{position:relative!important;z-index:4!important;min-height:485px!important;display:flex!important;align-items:center!important;justify-content:center!important}.hegeva-v4-visual::before{content:"";position:absolute;width:84%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(164,255,0,.27) 0%,rgba(72,255,0,.085) 43%,transparent 70%);filter:blur(9px)}.hegeva-v4-visual::after{content:"";position:absolute;width:74%;aspect-ratio:1;border-radius:50%;border:1px solid rgba(173,255,22,.24);box-shadow:0 0 0 30px rgba(173,255,22,.027),0 0 88px rgba(93,255,0,.14)}.hegeva-v4-robot{position:relative!important;z-index:3!important;display:block!important;width:116%!important;height:520px!important;object-fit:contain!important;object-position:center bottom!important;opacity:1!important;visibility:visible!important;filter:saturate(1.14) contrast(1.07) drop-shadow(0 30px 38px rgba(0,0,0,.54))!important}.hegeva-v4-tools{position:absolute!important;z-index:7!important;right:6px!important;bottom:6px!important;width:min(365px,92%)!important;display:grid!important;grid-template-columns:repeat(2,minmax(130px,1fr))!important;gap:8px!important}.hegeva-v4-tool{padding:10px 11px!important;border-radius:11px!important;border:1px solid rgba(173,255,22,.23)!important;background:rgba(2,10,7,.89)!important;color:#eef7f0!important;font-size:11px!important;font-weight:850!important;box-shadow:0 8px 22px rgba(0,0,0,.25)!important}.hegeva-v4-tool small{display:block!important;margin-top:3px!important;color:#91a399!important;font-size:9px!important;font-weight:600!important}
@media(max-width:1100px){section.hero.hegeva-v4-hero{grid-template-columns:minmax(0,1fr) minmax(300px,.82fr)!important;min-height:525px!important}.hegeva-v4-robot{height:440px!important}.hegeva-v4-tools{display:none!important}.brand .hegeva-v4-logo{width:220px!important}}
@media(max-width:780px){.main{padding:16px!important}.brand{min-width:185px!important}.brand .hegeva-v4-logo{width:190px!important;height:58px!important}section.hero.hegeva-v4-hero{grid-template-columns:1fr!important;padding:30px 22px 18px!important;min-height:auto!important}.hegeva-v4-title{font-size:clamp(37px,12vw,55px)!important}.hegeva-v4-visual{min-height:350px!important}.hegeva-v4-robot{width:100%!important;height:350px!important}.hegeva-v4-tools{display:none!important}}
`;
    document.head.appendChild(s);
  }

  function rebuildBrand() {
    const brand = document.querySelector("header .brand");
    if (!brand) return;
    if (brand.querySelector(".hegeva-v4-logo")) return;
    brand.innerHTML = "";
    const logo = document.createElement("img");
    logo.className = "hegeva-v4-logo";
    logo.src = LOGO_SRC;
    logo.alt = "HEGEVA AI";
    logo.decoding = "async";
    brand.appendChild(logo);
  }

  function rebuildHero() {
    const hero = document.querySelector("#home section.hero, section.hero");
    if (!hero) return false;
    if (hero.classList.contains("hegeva-v4-hero") && hero.querySelector(".hegeva-v4-robot")) return true;

    hero.className = "hero hegeva-v4-hero";
    hero.innerHTML = `
      <div class="hegeva-v4-copy">
        <div class="hegeva-v4-badge">HEGEVA AI • SMART BUSINESS WORKSPACE</div>
        <h2 class="hegeva-v4-title">
          <span data-i18n="home.title1">Save time. Work smarter.</span>
          <span class="gradient-text" data-i18n="home.title2">Focus on what matters most.</span>
        </h2>
        <p class="hegeva-v4-sub" data-i18n="home.subtitle">Hegeva AI is a human-first business workspace designed to reduce admin, organize everyday work and give you more time to focus. Only working features are marked as available.</p>
        <div class="hegeva-v4-actions hero-buttons">
          <button class="primary-button" type="button" data-go="settings" data-i18n="home.start">Set up my workspace</button>
          <button class="secondary-button" type="button" data-go="assistant" data-i18n="home.aiStatus">See AI status</button>
        </div>
      </div>
      <div class="hegeva-v4-visual" aria-hidden="true">
        <img class="hegeva-v4-robot" src="${ROBOT_SRC}" alt="" decoding="async" fetchpriority="high" />
        <div class="hegeva-v4-tools">
          <div class="hegeva-v4-tool">AI Assistant<small>Working AI chat</small></div>
          <div class="hegeva-v4-tool">Documents<small>Workspace documents</small></div>
          <div class="hegeva-v4-tool">Customers & CRM<small>Saved customer records</small></div>
          <div class="hegeva-v4-tool">Reports<small>Business reporting tools</small></div>
        </div>
      </div>`;
    return true;
  }

  function apply() {
    addStyle();
    rebuildBrand();
    rebuildHero();
  }

  function finiteTakeover() {
    [0, 80, 250, 700, 1500, 3000].forEach(ms => setTimeout(apply, ms));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", finiteTakeover, { once: true });
  } else {
    finiteTakeover();
  }
  window.addEventListener("load", finiteTakeover, { once: true });
  window.addEventListener("pageshow", () => { setTimeout(apply, 60); });

  const languageSelect = document.getElementById("languageSelect");
  if (languageSelect) languageSelect.addEventListener("change", () => { setTimeout(apply, 120); setTimeout(apply, 500); });

  document.addEventListener("click", e => {
    const go = e.target.closest?.("[data-go]")?.getAttribute("data-go");
    if (go === "home") { setTimeout(apply, 80); setTimeout(apply, 500); }
  });
})();
