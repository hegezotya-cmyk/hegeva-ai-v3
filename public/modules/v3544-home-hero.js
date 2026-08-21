/* HEGEVA AI — Premium Neon Business UI + Male Robot Hero */
(() => {
  "use strict";
  const STYLE_ID="hegeva-premium-neon-ui";
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
:root{--hegeva-lime:#a9ff00;--hegeva-green:#67f300;--hegeva-gold:#ffc63d;--hegeva-text:#f7fbf8}
html,body{background:radial-gradient(circle at 74% 8%,rgba(91,255,0,.08),transparent 25%),radial-gradient(circle at 18% 28%,rgba(255,198,61,.05),transparent 22%),linear-gradient(180deg,#020504,#06100c 58%,#020504)!important;color:var(--hegeva-text)!important}
header,.topbar,.app-header{background:rgba(2,7,5,.95)!important;border-bottom:1px solid rgba(169,255,0,.14)!important;backdrop-filter:blur(16px)}
.sidebar{background:linear-gradient(180deg,rgba(4,12,9,.99),rgba(3,8,6,.99))!important;border-right:1px solid rgba(169,255,0,.14)!important}
.main{background:radial-gradient(circle at 70% 0%,rgba(104,255,0,.045),transparent 25%),transparent!important}
.hegeva-brand-logo{display:block!important;width:min(285px,30vw)!important;max-height:88px!important;object-fit:contain!important;object-position:left center!important;margin:4px 14px 4px 0!important;filter:drop-shadow(0 0 14px rgba(255,198,61,.12))}
.nav-button{border:1px solid transparent!important;border-radius:13px!important;margin:4px 8px!important;color:#b8c8bf!important;transition:.18s ease!important}.nav-button:hover{color:#fff!important;background:rgba(169,255,0,.055)!important;border-color:rgba(169,255,0,.18)!important;transform:translateX(2px)}.nav-button.active{color:#fff!important;background:linear-gradient(90deg,rgba(169,255,0,.15),rgba(255,198,61,.055))!important;border-color:rgba(169,255,0,.36)!important;box-shadow:inset 3px 0 0 var(--hegeva-gold),0 0 24px rgba(105,243,0,.08)!important}
.card,.panel,.tool-card,.pricing-card,.stat-card,.metric-card,.feature-card,.v28-action,#v3540Workspace,#v3540Security,#hegevaV3541PlansUsage{background:linear-gradient(145deg,rgba(10,23,17,.96),rgba(4,11,8,.94))!important;border:1px solid rgba(255,198,61,.20)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 14px 38px rgba(0,0,0,.20)!important;border-radius:16px!important}
button,.primary-button,.secondary-button,.btn,a.button{border-radius:11px!important;font-weight:800!important}.primary-button,.btn-primary,button.primary,.hero-buttons a:first-child,.hero-buttons button:first-child{color:#071004!important;background:linear-gradient(135deg,#e0ff52 0%,#8ef400 52%,#ffd04d 100%)!important;border:1px solid rgba(255,228,105,.8)!important;box-shadow:0 8px 22px rgba(121,241,0,.17),inset 0 1px 0 rgba(255,255,255,.55)!important}
section.hero{position:relative!important;display:block!important;box-sizing:border-box!important;overflow:hidden!important;isolation:isolate;min-height:510px!important;padding:46px 48% 42px 46px!important;border:1px solid rgba(255,198,61,.30)!important;border-radius:22px!important;background:radial-gradient(circle at 74% 46%,rgba(140,255,0,.20),transparent 20%),radial-gradient(circle at 88% 22%,rgba(255,198,61,.08),transparent 20%),linear-gradient(115deg,rgba(2,7,5,.995),rgba(4,14,8,.985) 50%,rgba(2,8,6,.96))!important;box-shadow:0 26px 70px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.035)!important}
section.hero::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(rgba(169,255,0,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(169,255,0,.02) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(90deg,transparent 0%,black 58%,black 100%)}
section.hero>.badge,section.hero>h2,section.hero>p,section.hero>.hero-buttons{position:relative!important;z-index:5!important}section.hero>h2{max-width:690px;margin-top:14px!important;font-size:clamp(38px,5vw,72px)!important;line-height:.98!important;letter-spacing:-.055em!important;color:#fff!important}section.hero>h2 strong,section.hero>h2 span{background:linear-gradient(180deg,#dcff4d 0%,#8ff600 58%,#ffc83c 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}section.hero>p{max-width:610px!important;color:#b7c7bc!important;font-size:15px!important;line-height:1.65!important}
section.hero .vision-visual{display:none!important}
.hegeva-robot-layer{position:absolute;z-index:2;right:-1%;top:50%;width:51%;height:102%;transform:translateY(-50%);pointer-events:none;background:url("/assets/hegeva-home-hero.png") center center/contain no-repeat;filter:saturate(1.12) contrast(1.05) drop-shadow(0 28px 36px rgba(0,0,0,.48))}.hegeva-robot-layer::before{content:"";position:absolute;inset:10% 8% 12% 6%;z-index:-1;border-radius:50%;background:radial-gradient(circle,rgba(150,255,0,.20),rgba(58,255,0,.06) 42%,transparent 70%);filter:blur(8px)}.hegeva-robot-layer::after{content:"H";position:absolute;left:9%;top:38%;width:82px;height:82px;display:grid;place-items:center;border-radius:50%;color:#ffdc63;font:900 46px/1 Georgia,serif;border:2px solid rgba(255,213,78,.78);background:radial-gradient(circle,rgba(255,197,43,.22),rgba(7,20,9,.82) 60%,rgba(2,8,5,.94));box-shadow:0 0 28px rgba(166,255,0,.30),0 0 60px rgba(255,196,62,.18),inset 0 0 18px rgba(255,211,73,.16);text-shadow:0 0 18px rgba(255,210,72,.55)}
.hero-buttons{display:flex!important;flex-wrap:wrap;gap:12px!important;margin-top:24px!important}
@media(max-width:1100px){section.hero{padding-right:43%!important;min-height:480px!important}.hegeva-robot-layer{width:47%!important;right:-2%!important}}
@media(max-width:780px){.main{padding:16px!important}.hegeva-brand-logo{width:205px!important;max-height:70px!important}section.hero{min-height:auto!important;padding:30px 22px 335px!important;border-radius:18px!important}section.hero>h2{font-size:clamp(36px,12vw,54px)!important}.hegeva-robot-layer{width:100%!important;height:320px!important;right:0!important;top:auto!important;bottom:0!important;transform:none!important;background-position:center bottom!important}.hegeva-robot-layer::after{width:64px;height:64px;left:17%;top:43%;font-size:35px}}
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
    if(!hero.querySelector(".hegeva-robot-layer")){const layer=document.createElement("div");layer.className="hegeva-robot-layer";layer.setAttribute("aria-hidden","true");hero.appendChild(layer);}return true;
  }
  function install(){addStyle();addBrandLogo();addRobot();document.documentElement.classList.add("hegeva-premium-ui");}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
