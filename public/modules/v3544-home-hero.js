/* HEGEVA AI — Premium Neon Business UI + Male Robot Hero */
(() => {
  "use strict";
  const STYLE_ID="hegeva-premium-neon-ui";

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
:root{--hegeva-lime:#a9ff00;--hegeva-green:#67f300;--hegeva-gold:#ffc63d;--hegeva-cyan:#2bdcff;--hegeva-purple:#c46aff;--hegeva-text:#f7fbf8}
html,body{background:radial-gradient(circle at 74% 8%,rgba(91,255,0,.08),transparent 25%),radial-gradient(circle at 18% 28%,rgba(255,198,61,.05),transparent 22%),linear-gradient(180deg,#020504,#06100c 58%,#020504)!important;color:var(--hegeva-text)!important}
body{min-height:100vh}
header,.topbar,.app-header{background:rgba(2,7,5,.96)!important;border-bottom:1px solid rgba(169,255,0,.14)!important;backdrop-filter:blur(16px);box-shadow:0 12px 32px rgba(0,0,0,.28)}
.sidebar{background:linear-gradient(180deg,rgba(4,12,9,.995),rgba(3,8,6,.995))!important;border-right:1px solid rgba(169,255,0,.14)!important;box-shadow:14px 0 34px rgba(0,0,0,.18)}
.main{background:radial-gradient(circle at 70% 0%,rgba(104,255,0,.045),transparent 25%),transparent!important}
.hegeva-brand-logo{display:block!important;width:min(285px,30vw)!important;max-height:88px!important;object-fit:contain!important;object-position:left center!important;margin:4px 14px 4px 0!important;filter:drop-shadow(0 0 14px rgba(255,198,61,.12))}
.nav-button{border:1px solid transparent!important;border-radius:13px!important;margin:4px 8px!important;color:#b8c8bf!important;transition:.18s ease!important}.nav-button:hover{color:#fff!important;background:rgba(169,255,0,.055)!important;border-color:rgba(169,255,0,.18)!important;transform:translateX(2px)}.nav-button.active{color:#fff!important;background:linear-gradient(90deg,rgba(169,255,0,.15),rgba(255,198,61,.055))!important;border-color:rgba(169,255,0,.36)!important;box-shadow:inset 3px 0 0 var(--hegeva-gold),0 0 24px rgba(105,243,0,.08)!important}
.card,.panel,.tool-card,.pricing-card,.stat-card,.metric-card,.feature-card,.v28-action,#v3540Workspace,#v3540Security,#hegevaV3541PlansUsage{background:linear-gradient(145deg,rgba(10,23,17,.97),rgba(4,11,8,.95))!important;border:1px solid rgba(255,198,61,.20)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 14px 38px rgba(0,0,0,.20)!important;border-radius:16px!important}
.card:hover,.tool-card:hover,.pricing-card:hover,.feature-card:hover{border-color:rgba(169,255,0,.34)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 18px 42px rgba(0,0,0,.28),0 0 24px rgba(105,243,0,.055)!important}
button,.primary-button,.secondary-button,.btn,a.button{border-radius:11px!important;font-weight:800!important}.primary-button,.btn-primary,button.primary,.hero-buttons a:first-child,.hero-buttons button:first-child{color:#071004!important;background:linear-gradient(135deg,#e0ff52 0%,#8ef400 52%,#ffd04d 100%)!important;border:1px solid rgba(255,228,105,.8)!important;box-shadow:0 8px 22px rgba(121,241,0,.17),inset 0 1px 0 rgba(255,255,255,.55)!important}
input,textarea,select{background:#020a07!important;color:#eef8f0!important;border-color:rgba(255,198,61,.24)!important}
input:focus,textarea:focus,select:focus{border-color:rgba(169,255,0,.58)!important;box-shadow:0 0 0 3px rgba(133,255,0,.08)!important;outline:none!important}

section.hero{position:relative!important;display:block!important;box-sizing:border-box!important;overflow:hidden!important;isolation:isolate;min-height:540px!important;padding:48px 53% 44px 48px!important;border:1px solid rgba(255,198,61,.30)!important;border-radius:24px!important;background:radial-gradient(circle at 72% 48%,rgba(140,255,0,.21),transparent 20%),radial-gradient(circle at 88% 20%,rgba(255,198,61,.09),transparent 20%),radial-gradient(circle at 84% 78%,rgba(43,220,255,.07),transparent 24%),linear-gradient(115deg,rgba(2,7,5,.997),rgba(4,14,8,.99) 51%,rgba(2,8,6,.97))!important;box-shadow:0 28px 76px rgba(0,0,0,.44),inset 0 1px 0 rgba(255,255,255,.04)!important}
section.hero::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(rgba(169,255,0,.027) 1px,transparent 1px),linear-gradient(90deg,rgba(169,255,0,.022) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(90deg,transparent 0%,black 54%,black 100%)}
section.hero>.badge,section.hero>h2,section.hero>p,section.hero>.hero-buttons{position:relative!important;z-index:6!important}
section.hero>.badge{background:linear-gradient(90deg,rgba(255,199,63,.13),rgba(169,255,0,.08))!important;border:1px solid rgba(255,202,75,.34)!important;color:#ffe59a!important;box-shadow:0 0 20px rgba(255,198,61,.06)!important}
section.hero>h2{max-width:690px;margin-top:16px!important;font-size:clamp(38px,4.7vw,68px)!important;line-height:.99!important;letter-spacing:-.052em!important;color:#fff!important;text-shadow:0 8px 28px rgba(0,0,0,.34)}
section.hero>h2 strong,section.hero>h2 span{background:linear-gradient(180deg,#ecff70 0%,#9bff0a 54%,#ffc83c 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
section.hero>p{max-width:590px!important;color:#b8c8be!important;font-size:15px!important;line-height:1.7!important}
.hero-buttons{display:flex!important;flex-wrap:wrap;gap:12px!important;margin-top:26px!important}

section.hero .vision-visual{display:none!important}
.hegeva-robot-layer{position:absolute;z-index:2;right:-2%;top:50%;width:54%;height:105%;transform:translateY(-50%);pointer-events:none;background:url("/assets/hegeva-home-hero.png") center center/contain no-repeat;filter:saturate(1.12) contrast(1.06) drop-shadow(0 30px 38px rgba(0,0,0,.5))}
.hegeva-robot-layer::before{content:"";position:absolute;inset:9% 7% 11% 5%;z-index:-1;border-radius:50%;background:radial-gradient(circle,rgba(150,255,0,.20),rgba(58,255,0,.06) 42%,transparent 70%);filter:blur(8px)}
.hegeva-robot-layer::after{content:"H";position:absolute;left:9%;top:38%;width:82px;height:82px;display:grid;place-items:center;border-radius:50%;color:#ffdc63;font:900 46px/1 Georgia,serif;border:2px solid rgba(255,213,78,.78);background:radial-gradient(circle,rgba(255,197,43,.22),rgba(7,20,9,.82) 60%,rgba(2,8,5,.94));box-shadow:0 0 28px rgba(166,255,0,.30),0 0 60px rgba(255,196,62,.18),inset 0 0 18px rgba(255,211,73,.16);text-shadow:0 0 18px rgba(255,210,72,.55)}

.hegeva-feature-rail{position:absolute;right:18px;top:22px;z-index:5;width:min(245px,24%);display:grid;gap:8px;pointer-events:none}
.hegeva-feature-chip{display:grid;grid-template-columns:32px 1fr;gap:10px;align-items:center;padding:9px 11px;border-radius:12px;background:linear-gradient(135deg,rgba(4,12,8,.88),rgba(7,18,12,.78));border:1px solid rgba(255,198,61,.22);box-shadow:0 8px 22px rgba(0,0,0,.19),inset 0 1px 0 rgba(255,255,255,.025);backdrop-filter:blur(8px)}
.hegeva-feature-chip i{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-style:normal;font-size:16px;background:rgba(169,255,0,.08);border:1px solid rgba(169,255,0,.18)}
.hegeva-feature-chip b{display:block;color:#f8fff9;font-size:11px;line-height:1.1;letter-spacing:.01em}.hegeva-feature-chip span{display:block;margin-top:3px;color:#91a69a;font-size:9px;line-height:1.25}
.hegeva-feature-chip:nth-child(2) i{color:var(--hegeva-purple);background:rgba(196,106,255,.08);border-color:rgba(196,106,255,.20)}
.hegeva-feature-chip:nth-child(3) i{color:var(--hegeva-cyan);background:rgba(43,220,255,.08);border-color:rgba(43,220,255,.20)}
.hegeva-feature-chip:nth-child(4) i{color:var(--hegeva-gold);background:rgba(255,198,61,.08);border-color:rgba(255,198,61,.20)}

@media(max-width:1180px){section.hero{padding-right:47%!important;min-height:500px!important}.hegeva-robot-layer{width:49%!important;right:-2%!important}.hegeva-feature-rail{display:none}}
@media(max-width:780px){.main{padding:16px!important}.hegeva-brand-logo{width:205px!important;max-height:70px!important}section.hero{min-height:auto!important;padding:30px 22px 350px!important;border-radius:18px!important}section.hero>h2{font-size:clamp(36px,12vw,54px)!important}.hegeva-robot-layer{width:100%!important;height:335px!important;right:0!important;top:auto!important;bottom:0!important;transform:none!important;background-position:center bottom!important}.hegeva-robot-layer::after{width:64px;height:64px;left:17%;top:43%;font-size:35px}.hegeva-feature-rail{display:none}}
`;
    document.head.appendChild(s);
  }

  function addBrandLogo(){
    if(document.querySelector(".hegeva-brand-logo"))return;
    const candidates=[...document.querySelectorAll("header *, .topbar *, .app-header *, .sidebar *")];
    const target=candidates.find(el=>{if(el.children.length>4)return false;const t=(el.textContent||"").replace(/\s+/g," ").trim().toUpperCase();return t.includes("HEGEVA AI")&&t.length<90;});
    if(!target)return;
    const img=document.createElement("img");img.className="hegeva-brand-logo";img.src="/assets/hegeva-wing-logo.svg";img.alt="HEGEVA AI";img.decoding="async";target.prepend(img);
  }

  function addRobot(){
    const hero=document.querySelector("section.hero");if(!hero)return false;
    hero.classList.add("hegeva-premium-hero");
    if(!hero.querySelector(".hegeva-robot-layer")){const layer=document.createElement("div");layer.className="hegeva-robot-layer";layer.setAttribute("aria-hidden","true");hero.appendChild(layer);}
    if(!hero.querySelector(".hegeva-feature-rail")){
      const rail=document.createElement("div");
      rail.className="hegeva-feature-rail";
      rail.setAttribute("aria-hidden","true");
      rail.innerHTML=`
        <div class="hegeva-feature-chip"><i>🤖</i><div><b>AI Assistant</b><span>Business help inside HEGEVA</span></div></div>
        <div class="hegeva-feature-chip"><i>📄</i><div><b>Documents</b><span>Saved business paperwork</span></div></div>
        <div class="hegeva-feature-chip"><i>👥</i><div><b>Customers & CRM</b><span>Clients and follow-ups</span></div></div>
        <div class="hegeva-feature-chip"><i>📈</i><div><b>Reports</b><span>Workspace-based summaries</span></div></div>`;
      hero.appendChild(rail);
    }
    return true;
  }

  function cleanStaleBadge(){
    const hero=document.querySelector("section.hero");
    const badge=hero?.querySelector(".badge,[data-i18n='home.badge']");
    if(badge && /V30\.0/i.test(badge.textContent||"")) badge.textContent="HEGEVA AI • SMART BUSINESS WORKSPACE";
  }

  function install(){addStyle();addBrandLogo();addRobot();cleanStaleBadge();document.documentElement.classList.add("hegeva-premium-ui");}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
