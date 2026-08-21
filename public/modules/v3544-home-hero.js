/* HEGEVA AI — Premium Neon Business UI + Male Robot Hero */
(() => {
  "use strict";

  const STYLE_ID = "hegeva-premium-neon-ui";

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      :root{
        --hegeva-bg:#030806;
        --hegeva-panel:#07110d;
        --hegeva-panel-2:#0a1711;
        --hegeva-line:rgba(174,255,0,.24);
        --hegeva-line-gold:rgba(255,196,62,.32);
        --hegeva-lime:#a9ff00;
        --hegeva-green:#67f300;
        --hegeva-gold:#ffc63d;
        --hegeva-cyan:#25d7ff;
        --hegeva-purple:#d05cff;
        --hegeva-pink:#ff477e;
        --hegeva-text:#f7fbf8;
        --hegeva-muted:#9eada5;
        --hegeva-shadow:0 18px 55px rgba(0,0,0,.38);
      }

      html,body{
        background:
          radial-gradient(circle at 72% 8%, rgba(88,255,0,.09), transparent 24%),
          radial-gradient(circle at 20% 26%, rgba(255,198,61,.05), transparent 22%),
          linear-gradient(180deg,#020504,#06100c 58%,#020504) !important;
        color:var(--hegeva-text) !important;
      }

      body{
        min-height:100vh;
      }

      header,
      .topbar,
      .app-header{
        background:rgba(2,7,5,.94) !important;
        border-bottom:1px solid rgba(169,255,0,.13) !important;
        backdrop-filter:blur(16px);
        box-shadow:0 10px 34px rgba(0,0,0,.26);
      }

      .sidebar{
        background:
          linear-gradient(180deg,rgba(4,12,9,.99),rgba(3,8,6,.99)) !important;
        border-right:1px solid rgba(169,255,0,.14) !important;
        box-shadow:16px 0 45px rgba(0,0,0,.20);
      }

      .nav-button{
        border:1px solid transparent !important;
        border-radius:13px !important;
        margin:4px 8px !important;
        color:#b8c8bf !important;
        transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease,color .18s ease !important;
      }

      .nav-button:hover{
        color:#fff !important;
        background:rgba(169,255,0,.055) !important;
        border-color:rgba(169,255,0,.18) !important;
        transform:translateX(2px);
      }

      .nav-button.active{
        color:#fff !important;
        background:
          linear-gradient(90deg,rgba(169,255,0,.15),rgba(255,198,61,.055)) !important;
        border-color:rgba(169,255,0,.36) !important;
        box-shadow:
          inset 3px 0 0 var(--hegeva-gold),
          0 0 24px rgba(105,243,0,.08) !important;
      }

      .main{
        background:
          radial-gradient(circle at 70% 0%,rgba(104,255,0,.045),transparent 25%),
          transparent !important;
      }

      .page-heading h1,
      .page-title h1,
      .page h1{
        letter-spacing:-.03em;
        text-shadow:0 0 28px rgba(169,255,0,.08);
      }

      .card,
      .panel,
      .tool-card,
      .pricing-card,
      .stat-card,
      .metric-card,
      .feature-card,
      .v28-action,
      #v3540Workspace,
      #v3540Security,
      #hegevaV3541PlansUsage{
        background:
          linear-gradient(145deg,rgba(10,23,17,.96),rgba(4,11,8,.94)) !important;
        border:1px solid rgba(255,198,61,.20) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.025),
          0 14px 38px rgba(0,0,0,.20) !important;
      }

      .card:hover,
      .tool-card:hover,
      .pricing-card:hover,
      .feature-card:hover{
        border-color:rgba(169,255,0,.34) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.035),
          0 18px 42px rgba(0,0,0,.30),
          0 0 25px rgba(105,243,0,.055) !important;
      }

      button,
      .primary-button,
      .secondary-button,
      .btn,
      a.button{
        border-radius:11px !important;
        font-weight:800 !important;
      }

      .primary-button,
      .btn-primary,
      button.primary,
      .hero-buttons a:first-child,
      .hero-buttons button:first-child{
        color:#071004 !important;
        background:
          linear-gradient(135deg,#e0ff52 0%,#8ef400 52%,#ffd04d 100%) !important;
        border:1px solid rgba(255,228,105,.8) !important;
        box-shadow:
          0 8px 22px rgba(121,241,0,.17),
          inset 0 1px 0 rgba(255,255,255,.55) !important;
      }

      .secondary-button,
      .btn-secondary,
      .hero-buttons a:not(:first-child),
      .hero-buttons button:not(:first-child){
        color:#f7fbf8 !important;
        background:rgba(8,22,15,.86) !important;
        border:1px solid rgba(255,198,61,.26) !important;
      }

      input,
      textarea,
      select{
        background:#020a07 !important;
        color:#eef8f0 !important;
        border-color:rgba(255,198,61,.24) !important;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.01) !important;
      }

      input:focus,
      textarea:focus,
      select:focus{
        border-color:rgba(169,255,0,.58) !important;
        box-shadow:0 0 0 3px rgba(133,255,0,.08) !important;
        outline:none !important;
      }

      .badge,
      .status-badge,
      .pill{
        border-color:rgba(169,255,0,.28) !important;
        background:rgba(8,24,13,.82) !important;
      }

      section.hero{
        position:relative !important;
        display:block !important;
        box-sizing:border-box !important;
        overflow:hidden !important;
        isolation:isolate;
        min-height:500px !important;
        padding:46px 49% 42px 46px !important;
        border:1px solid rgba(255,198,61,.30) !important;
        border-radius:22px !important;
        background:
          radial-gradient(circle at 74% 46%,rgba(140,255,0,.19),transparent 19%),
          radial-gradient(circle at 86% 24%,rgba(255,198,61,.09),transparent 20%),
          radial-gradient(circle at 32% 98%,rgba(50,215,255,.05),transparent 26%),
          linear-gradient(115deg,rgba(2,7,5,.995) 0%,rgba(4,14,8,.985) 48%,rgba(2,8,6,.96) 100%) !important;
        box-shadow:
          0 26px 70px rgba(0,0,0,.42),
          inset 0 1px 0 rgba(255,255,255,.035),
          0 0 0 1px rgba(169,255,0,.035) !important;
      }

      section.hero::before{
        content:"";
        position:absolute;
        inset:0;
        z-index:0;
        pointer-events:none;
        opacity:.9;
        background:
          linear-gradient(rgba(169,255,0,.025) 1px,transparent 1px),
          linear-gradient(90deg,rgba(169,255,0,.02) 1px,transparent 1px);
        background-size:42px 42px;
        mask-image:linear-gradient(90deg,transparent 0%,black 58%,black 100%);
      }

      section.hero::after{
        content:"";
        position:absolute;
        inset:0;
        z-index:2;
        pointer-events:none;
        background:
          linear-gradient(90deg,rgba(2,7,5,.08) 0%,rgba(2,7,5,.04) 45%,rgba(2,7,5,0) 72%),
          radial-gradient(circle at 76% 49%,transparent 0 20%,rgba(2,7,5,.06) 42%,rgba(2,7,5,.30) 78%);
      }

      section.hero > .badge,
      section.hero > h2,
      section.hero > p,
      section.hero > .hero-buttons{
        position:relative !important;
        z-index:4 !important;
      }

      section.hero > h2{
        max-width:690px;
        margin-top:14px !important;
        font-size:clamp(38px,5vw,72px) !important;
        line-height:.98 !important;
        letter-spacing:-.055em !important;
        color:#fff !important;
        text-shadow:0 6px 28px rgba(0,0,0,.4) !important;
      }

      section.hero > h2 strong,
      section.hero > h2 span{
        color:var(--hegeva-lime) !important;
        background:linear-gradient(180deg,#dcff4d 0%,#8ff600 58%,#ffc83c 100%);
        -webkit-background-clip:text;
        background-clip:text;
        -webkit-text-fill-color:transparent;
      }

      section.hero > p{
        max-width:610px !important;
        color:#b7c7bc !important;
        font-size:15px !important;
        line-height:1.65 !important;
      }

      section.hero .vision-visual{
        position:absolute !important;
        right:1.4% !important;
        top:50% !important;
        transform:translateY(-50%) !important;
        width:49% !important;
        height:98% !important;
        max-width:none !important;
        background:url("/assets/hegeva-home-hero.png") center center / contain no-repeat !important;
        border:0 !important;
        border-radius:0 !important;
        box-shadow:none !important;
        filter:saturate(1.07) contrast(1.04) drop-shadow(0 24px 30px rgba(0,0,0,.45));
        z-index:1 !important;
      }

      section.hero .vision-visual::after{
        content:"H";
        position:absolute;
        left:8%;
        top:38%;
        width:86px;
        height:86px;
        display:grid;
        place-items:center;
        border-radius:50%;
        color:#ffdc63;
        font:900 48px/1 Georgia,serif;
        border:2px solid rgba(255,213,78,.72);
        background:
          radial-gradient(circle,rgba(255,197,43,.22),rgba(7,20,9,.78) 60%,rgba(2,8,5,.92));
        box-shadow:
          0 0 28px rgba(166,255,0,.26),
          0 0 60px rgba(255,196,62,.18),
          inset 0 0 18px rgba(255,211,73,.16);
        text-shadow:0 0 18px rgba(255,210,72,.55);
      }

      section.hero .vision-visual .orb-ring,
      section.hero .vision-visual .ai-core,
      section.hero .vision-visual .vision-chip{
        display:none !important;
      }

      .hero-buttons{
        display:flex !important;
        flex-wrap:wrap;
        gap:12px !important;
        margin-top:24px !important;
      }

      .hero-buttons a,
      .hero-buttons button{
        min-height:46px !important;
        padding:0 20px !important;
        display:inline-flex !important;
        align-items:center;
        justify-content:center;
      }

      .page > .card,
      .page > section,
      .page > .panel{
        border-radius:18px;
      }

      .pricing-card{
        position:relative;
        overflow:hidden;
      }

      .pricing-card::before{
        content:"";
        position:absolute;
        left:0;right:0;top:0;
        height:2px;
        background:linear-gradient(90deg,transparent,var(--hegeva-lime),var(--hegeva-gold),transparent);
        opacity:.65;
      }

      @media (max-width:1100px){
        section.hero{
          min-height:470px !important;
          padding-right:43% !important;
        }
        section.hero .vision-visual{
          width:45% !important;
        }
      }

      @media (max-width:780px){
        .main{padding:16px !important;}
        section.hero{
          min-height:auto !important;
          padding:30px 22px 335px !important;
          border-radius:18px !important;
        }
        section.hero > h2{
          font-size:clamp(36px,12vw,54px) !important;
        }
        section.hero .vision-visual{
          width:100% !important;
          height:320px !important;
          right:0 !important;
          top:auto !important;
          bottom:0 !important;
          transform:none !important;
          background-position:center bottom !important;
        }
        section.hero .vision-visual::after{
          width:66px;
          height:66px;
          left:16%;
          top:42%;
          font-size:36px;
        }
        .hero-buttons > *{
          flex:1 1 160px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function markHero() {
    const hero = document.querySelector("section.hero");
    if (!hero) return false;
    hero.classList.add("hegeva-premium-hero");

    const visual = hero.querySelector(".vision-visual");
    if (visual) visual.classList.add("hegeva-home-robot");
    return true;
  }

  function install() {
    addStyle();
    markHero();
    document.documentElement.classList.add("hegeva-premium-ui");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  } else {
    install();
  }
})();
