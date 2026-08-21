/* HEGEVA AI — Premium Home Rebuild V3: direct brand + direct male robot */
(() => {
  "use strict";

  const STYLE_ID = "hegeva-premium-home-v3";

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
:root{--hg-lime:#aaff00;--hg-green:#63f000;--hg-gold:#ffc83d;--hg-text:#f7fbf8;--hg-muted:#9eb0a6}
html,body{background:radial-gradient(circle at 78% 5%,rgba(91,255,0,.075),transparent 24%),radial-gradient(circle at 15% 14%,rgba(255,200,61,.055),transparent 20%),linear-gradient(180deg,#020504,#07110b 58%,#020504)!important;color:var(--hg-text)!important}
header{background:rgba(1,6,4,.98)!important;border-bottom:1px solid rgba(170,255,0,.14)!important;backdrop-filter:blur(16px)!important}
.header-inner{max-width:1400px!important}
.brand{display:flex!important;align-items:center!important;min-width:260px!important}
.brand>*{display:none!important}
.brand .hegeva-v3-logo{display:block!important;width:260px!important;height:68px!important;object-fit:contain!important;object-position:left center!important;filter:drop-shadow(0 0 14px rgba(255,200,61,.13))}
.sidebar{background:linear-gradient(180deg,#020805,#031009)!important;border-right:1px solid rgba(170,255,0,.13)!important}
.main{background:radial-gradient(circle at 72% 0%,rgba(90,255,0,.045),transparent 28%)!important}
.nav-button{border:1px solid transparent!important;border-radius:12px!important;color:#c4d0c8!important;transition:.18s ease!important}
.nav-button:hover{color:#fff!important;background:rgba(170,255,0,.05)!important;border-color:rgba(170,255,0,.18)!important;transform:translateX(2px)}
.nav-button.active{color:#fff!important;background:linear-gradient(90deg,rgba(170,255,0,.14),rgba(255,200,61,.05))!important;border-color:rgba(170,255,0,.36)!important;box-shadow:inset 3px 0 0 var(--hg-gold),0 0 22px rgba(100,255,0,.08)!important}
.card,.panel,.tool-card,.pricing-card,.stat-card,.metric-card,.feature-card,.v28-action,#v3540Workspace,#v3540Security,#hegevaV3541PlansUsage{background:linear-gradient(145deg,rgba(8,22,15,.97),rgba(3,10,7,.96))!important;border:1px solid rgba(255,200,61,.16)!important;border-radius:15px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 16px 38px rgba(0,0,0,.18)!important}
button,.primary-button,.secondary-button,.btn,a.button{border-radius:10px!important;font-weight:800!important}
.primary-button,.btn-primary,button.primary{color:#061004!important;background:linear-gradient(135deg,#dfff43 0%,#8ef600 54%,#ffd04c 100%)!important;border:1px solid rgba(255,229,105,.8)!important;box-shadow:0 9px 24px rgba(116,241,0,.18),inset 0 1px 0 rgba(255,255,255,.55)!important}

section.hero{position:relative!important;display:grid!important;grid-template-columns:minmax(0,1.02fr) minmax(360px,.98fr)!important;align-items:center!important;gap:18px!important;overflow:hidden!important;isolation:isolate!important;min-height:560px!important;padding:48px 42px 42px 46px!important;border:1px solid rgba(255,200,61,.30)!important;border-radius:24px!important;background:radial-gradient(circle at 79% 50%,rgba(115,255,0,.20),transparent 24%),radial-gradient(circle at 92% 18%,rgba(255,200,61,.10),transparent 19%),linear-gradient(115deg,#020705 0%,#07120c 49%,#031008 100%)!important;box-shadow:0 30px 80px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.035)!important}
section.hero::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(rgba(170,255,0,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(170,255,0,.02) 1px,transparent 1px);background-size:40px 40px;mask-image:linear-gradient(90deg,transparent 0%,black 52%,black 100%)}
.hegeva-v3-copy{position:relative!important;z-index:6!important;max-width:680px!important}
.hegeva-v3-badge{display:inline-flex!important;padding:8px 12px!important;border-radius:999px!important;border:1px solid rgba(255,200,61,.33)!important;background:rgba(255,200,61,.08)!important;color:#ffe6a0!important;font-size:11px!important;font-weight:900!important;letter-spacing:.04em!important;margin-bottom:17px!important}
.hegeva-v3-title{margin:0!important;font-size:clamp(42px,5vw,72px)!important;line-height:.97!important;letter-spacing:-.055em!important;color:#fff!important}
.hegeva-v3-title span:first-child{display:block!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
.hegeva-v3-title .gradient-text{display:block!important;background:linear-gradient(90deg,#dfff4a 0%,#8df600 54%,#ffc63d 100%)!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important}
.hegeva-v3-sub{margin-top:18px!important;max-width:620px!important;color:#b8c8be!important;font-size:15px!important;line-height:1.65!important}
.hegeva-v3-actions{display:flex!important;flex-wrap:wrap!important;gap:12px!important;margin-top:25px!important}
.hegeva-v3-visual{position:relative!important;z-index:4!important;min-height:470px!important;display:flex!important;align-items:center!important;justify-content:center!important}
.hegeva-v3-visual::before{content:"";position:absolute;width:82%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(160,255,0,.24) 0%,rgba(70,255,0,.075) 43%,transparent 70%);filter:blur(8px)}
.hegeva-v3-visual::after{content:"";position:absolute;width:72%;aspect-ratio:1;border-radius:50%;border:1px solid rgba(170,255,0,.22);box-shadow:0 0 0 28px rgba(170,255,0,.025),0 0 80px rgba(93,255,0,.12)}
.hegeva-v3-robot{position:relative!important;z-index:3!important;display:block!important;width:112%!important;height:500px!important;object-fit:contain!important;object-position:center bottom!important;opacity:1!important;visibility:visible!important;filter:saturate(1.12) contrast(1.06) drop-shadow(0 30px 36px rgba(0,0,0,.52))!important}
.hegeva-v3-tools{position:absolute!important;z-index:7!important;right:8px!important;bottom:8px!important;width:min(360px,92%)!important;display:grid!important;grid-template-columns:repeat(2,minmax(130px,1fr))!important;gap:8px!important}
.hegeva-v3-tool{padding:10px 11px!important;border-radius:11px!important;border:1px solid rgba(170,255,0,.22)!important;background:rgba(2,10,7,.88)!important;color:#edf7ef!important;font-size:11px!important;font-weight:850!important;box-shadow:0 8px 22px rgba(0,0,0,.24)!important}
.hegeva-v3-tool small{display:block!important;margin-top:3px!important;color:#8fa197!important;font-size:9px!important;font-weight:600!important}

@media(max-width:1100px){section.hero{grid-template-columns:minmax(0,1fr) minmax(300px,.8fr)!important;min-height:520px!important}.hegeva-v3-robot{height:430px!important}.hegeva-v3-tools{display:none!important}.brand .hegeva-v3-logo{width:220px!important}}
@media(max-width:780px){.main{padding:16px!important}.brand{min-width:185px!important}.brand .hegeva-v3-logo{width:190px!important;height:58px!important}section.hero{grid-template-columns:1fr!important;padding:30px 22px 18px!important;min-height:auto!important}.hegeva-v3-title{font-size:clamp(37px,12vw,55px)!important}.hegeva-v3-visual{min-height:340px!important}.hegeva-v3-robot{width:100%!important;height:340px!important}.hegeva-v3-tools{display:none!important}}
`;
    document.head.appendChild(s);
  }

  function rebuildBrand(){
    const brand=document.querySelector("header .brand");
    if(!brand) return;
    brand.innerHTML='';
    const logo=document.createElement('img');
    logo.className='hegeva-v3-logo';
    logo.src='/assets/hegeva-wing-logo.svg?v=brand-v3';
    logo.alt='HEGEVA AI';
    logo.decoding='async';
    brand.appendChild(logo);
  }

  function rebuildHero(){
    const hero=document.querySelector('section.hero');
    if(!hero) return false;
    hero.innerHTML=`
      <div class="hegeva-v3-copy">
        <div class="hegeva-v3-badge">HEGEVA AI • SMART BUSINESS WORKSPACE</div>
        <h2 class="hegeva-v3-title">
          <span data-i18n="home.title1">Save time. Work smarter.</span>
          <span class="gradient-text" data-i18n="home.title2">Focus on what matters most.</span>
        </h2>
        <p class="hegeva-v3-sub" data-i18n="home.subtitle">Hegeva AI is a human-first business workspace designed to reduce admin, organize everyday work and give you more time to focus. Only working features are marked as available.</p>
        <div class="hegeva-v3-actions">
          <button class="primary-button" type="button" data-go="settings" data-i18n="home.start">Set up my workspace</button>
          <button class="secondary-button" type="button" data-go="assistant" data-i18n="home.aiStatus">See AI status</button>
        </div>
      </div>
      <div class="hegeva-v3-visual" aria-hidden="true">
        <img class="hegeva-v3-robot" src="/assets/hegeva-home-hero.png?v=robot-v3" alt="" decoding="async" fetchpriority="high" />
        <div class="hegeva-v3-tools">
          <div class="hegeva-v3-tool">AI Assistant<small>Working AI chat</small></div>
          <div class="hegeva-v3-tool">Documents<small>Workspace documents</small></div>
          <div class="hegeva-v3-tool">Customers & CRM<small>Saved customer records</small></div>
          <div class="hegeva-v3-tool">Reports<small>Business reporting tools</small></div>
        </div>
      </div>`;
    return true;
  }

  function install(){
    document.documentElement.classList.add('hegeva-premium-ui-v3');
    addStyle();
    rebuildBrand();
    rebuildHero();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
