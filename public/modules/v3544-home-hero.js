/* HEGEVA AI — Premium UI Rebuild + Direct Male Robot */
(() => {
  "use strict";

  const STYLE_ID = "hegeva-premium-rebuild-v2";
  const BADGE_TEXT = "HEGEVA AI • SMART BUSINESS WORKSPACE";

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
:root{
  --hg-lime:#aaff00;
  --hg-green:#62ef00;
  --hg-gold:#ffc73d;
  --hg-gold-soft:#ffe49a;
  --hg-ink:#020604;
  --hg-panel:#07110c;
  --hg-text:#f5fbf6;
  --hg-muted:#9eb0a5;
}
html,body{
  background:
    radial-gradient(circle at 73% 4%,rgba(112,255,0,.08),transparent 25%),
    radial-gradient(circle at 18% 16%,rgba(255,199,61,.055),transparent 20%),
    linear-gradient(180deg,#020604 0%,#06100b 52%,#020604 100%)!important;
  color:var(--hg-text)!important;
}
header,.topbar,.app-header{
  background:rgba(2,7,5,.97)!important;
  border-bottom:1px solid rgba(170,255,0,.15)!important;
  backdrop-filter:blur(16px);
}
.sidebar{
  background:linear-gradient(180deg,#020805 0%,#04100b 100%)!important;
  border-right:1px solid rgba(170,255,0,.13)!important;
  box-shadow:18px 0 45px rgba(0,0,0,.15)!important;
}
.main{
  background:
    radial-gradient(circle at 72% 0%,rgba(94,255,0,.05),transparent 28%),
    transparent!important;
}

/* ONE PRIMARY BRAND */
.hegeva-primary-brand{
  display:flex!important;
  align-items:center!important;
  min-width:250px!important;
  overflow:visible!important;
}
.hegeva-primary-brand>.hegeva-brand-logo{
  display:block!important;
  width:255px!important;
  max-width:26vw!important;
  height:72px!important;
  object-fit:contain!important;
  object-position:left center!important;
  margin:0!important;
  filter:drop-shadow(0 0 16px rgba(255,199,61,.16));
}
.hegeva-primary-brand>*:not(.hegeva-brand-logo){display:none!important}
.hegeva-duplicate-brand{display:none!important}

.nav-button{
  border:1px solid transparent!important;
  border-radius:12px!important;
  margin:4px 8px!important;
  color:#c1cec5!important;
  transition:transform .16s ease,border-color .16s ease,background .16s ease!important;
}
.nav-button:hover{
  color:#fff!important;
  background:rgba(170,255,0,.055)!important;
  border-color:rgba(170,255,0,.17)!important;
  transform:translateX(2px);
}
.nav-button.active{
  color:#fff!important;
  background:linear-gradient(90deg,rgba(170,255,0,.15),rgba(255,199,61,.05))!important;
  border-color:rgba(170,255,0,.42)!important;
  box-shadow:inset 3px 0 0 var(--hg-gold),0 0 24px rgba(110,255,0,.08)!important;
}

.card,.panel,.tool-card,.pricing-card,.stat-card,.metric-card,.feature-card,.v28-action,
#v3540Workspace,#v3540Security,#hegevaV3541PlansUsage{
  background:linear-gradient(145deg,rgba(10,24,17,.97),rgba(3,10,7,.96))!important;
  border:1px solid rgba(255,199,61,.17)!important;
  border-radius:15px!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 16px 38px rgba(0,0,0,.19)!important;
}
button,.primary-button,.secondary-button,.btn,a.button{border-radius:10px!important;font-weight:800!important}
.primary-button,.btn-primary,button.primary,.hero-buttons a:first-child,.hero-buttons button:first-child{
  color:#061004!important;
  background:linear-gradient(135deg,#dbff3d 0%,#8af500 54%,#ffd04f 100%)!important;
  border:1px solid rgba(255,228,105,.78)!important;
  box-shadow:0 9px 24px rgba(117,241,0,.18),inset 0 1px 0 rgba(255,255,255,.55)!important;
}

/* MAIN HERO */
section.hero{
  position:relative!important;
  display:block!important;
  isolation:isolate!important;
  overflow:hidden!important;
  min-height:540px!important;
  padding:48px 50% 46px 46px!important;
  border:1px solid rgba(255,199,61,.31)!important;
  border-radius:22px!important;
  background:
    radial-gradient(circle at 78% 48%,rgba(111,255,0,.20),transparent 24%),
    radial-gradient(circle at 91% 16%,rgba(255,199,61,.10),transparent 20%),
    linear-gradient(116deg,rgba(2,7,5,.995),rgba(5,15,9,.985) 50%,rgba(3,10,7,.965))!important;
  box-shadow:0 28px 70px rgba(0,0,0,.40),inset 0 1px 0 rgba(255,255,255,.04)!important;
}
section.hero::before{
  content:"";
  position:absolute;
  inset:0;
  z-index:0;
  pointer-events:none;
  background:
    linear-gradient(rgba(170,255,0,.025) 1px,transparent 1px),
    linear-gradient(90deg,rgba(170,255,0,.022) 1px,transparent 1px);
  background-size:38px 38px;
  mask-image:linear-gradient(90deg,transparent 0%,black 50%,black 100%);
}
section.hero::after{
  content:"";
  position:absolute;
  z-index:1;
  right:5%;
  top:50%;
  width:39%;
  aspect-ratio:1;
  transform:translateY(-50%);
  border-radius:50%;
  border:1px solid rgba(170,255,0,.20);
  box-shadow:0 0 0 28px rgba(170,255,0,.025),0 0 80px rgba(91,255,0,.11);
  pointer-events:none;
}
section.hero>.badge,section.hero>h2,section.hero>p,section.hero>.hero-buttons{
  position:relative!important;
  z-index:7!important;
}
section.hero>.badge{
  display:inline-flex!important;
  width:auto!important;
  border:1px solid rgba(255,199,61,.32)!important;
  background:rgba(255,199,61,.08)!important;
  color:#ffe7a4!important;
  border-radius:999px!important;
  padding:8px 12px!important;
  font-size:11px!important;
  font-weight:900!important;
  letter-spacing:.035em!important;
}
section.hero>h2{
  max-width:690px!important;
  margin-top:18px!important;
  font-size:clamp(42px,5vw,74px)!important;
  line-height:.97!important;
  letter-spacing:-.055em!important;
  color:#fff!important;
}
section.hero>h2 strong,section.hero>h2 span{
  background:linear-gradient(180deg,#e6ff61 0%,#91f900 56%,#ffc63d 100%);
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
}
section.hero>p{
  max-width:620px!important;
  color:#b8c8be!important;
  font-size:15px!important;
  line-height:1.65!important;
}
.hero-buttons{display:flex!important;flex-wrap:wrap!important;gap:12px!important;margin-top:24px!important}

/* RETIRE OLD HERO VISUAL COMPLETELY */
html.hegeva-premium-ui body section.hero .vision-visual,
html.hegeva-premium-ui body section.hero .vision-visual *{
  display:none!important;
  visibility:hidden!important;
  opacity:0!important;
  pointer-events:none!important;
}

/* DIRECT ROBOT IMG — NEVER CSS BACKGROUND */
.hegeva-robot-wrap{
  position:absolute!important;
  z-index:4!important;
  right:-2%!important;
  top:50%!important;
  width:54%!important;
  height:108%!important;
  transform:translateY(-50%)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  pointer-events:none!important;
}
.hegeva-robot-wrap::before{
  content:"";
  position:absolute;
  width:74%;
  aspect-ratio:1;
  border-radius:50%;
  background:radial-gradient(circle,rgba(152,255,0,.25) 0%,rgba(73,255,0,.075) 44%,transparent 70%);
  filter:blur(8px);
}
.hegeva-robot-img{
  position:relative!important;
  z-index:2!important;
  display:block!important;
  width:100%!important;
  height:100%!important;
  object-fit:contain!important;
  object-position:center center!important;
  opacity:1!important;
  visibility:visible!important;
  filter:saturate(1.12) contrast(1.07) drop-shadow(0 28px 34px rgba(0,0,0,.50))!important;
}

.hegeva-hero-tools{
  position:absolute!important;
  z-index:6!important;
  right:22px!important;
  bottom:18px!important;
  width:min(350px,42%)!important;
  display:grid!important;
  grid-template-columns:repeat(2,minmax(130px,1fr))!important;
  gap:8px!important;
  pointer-events:none!important;
}
.hegeva-hero-tool{
  padding:9px 11px!important;
  border-radius:10px!important;
  border:1px solid rgba(170,255,0,.21)!important;
  background:rgba(2,10,7,.86)!important;
  color:#edf6ef!important;
  font-size:11px!important;
  font-weight:850!important;
  box-shadow:0 8px 22px rgba(0,0,0,.22)!important;
}
.hegeva-hero-tool small{display:block!important;margin-top:3px!important;color:#8da194!important;font-size:9px!important;font-weight:600!important}

@media(max-width:1100px){
  section.hero{padding-right:45%!important;min-height:500px!important}
  .hegeva-robot-wrap{width:50%!important;right:-4%!important}
  .hegeva-hero-tools{display:none!important}
  .hegeva-primary-brand>.hegeva-brand-logo{width:220px!important}
}
@media(max-width:780px){
  .main{padding:16px!important}
  .hegeva-primary-brand{min-width:180px!important}
  .hegeva-primary-brand>.hegeva-brand-logo{width:190px!important;height:58px!important;max-width:55vw!important}
  section.hero{min-height:auto!important;padding:30px 22px 365px!important;border-radius:18px!important}
  section.hero>h2{font-size:clamp(37px,12vw,55px)!important}
  .hegeva-robot-wrap{width:100%!important;height:350px!important;right:0!important;top:auto!important;bottom:0!important;transform:none!important}
  .hegeva-robot-img{object-position:center bottom!important}
  .hegeva-hero-tools{display:none!important}
}
`;
    document.head.appendChild(s);
  }

  function headerRoot(){
    return document.querySelector("header,.topbar,.app-header") || document.body;
  }

  function setupBrand(){
    const root=headerRoot();
    if(!root) return;

    let primary=root.querySelector(".hegeva-primary-brand");
    if(!primary){
      const candidates=[...root.querySelectorAll("div,a,section")].filter(el=>{
        const t=(el.textContent||"").replace(/\s+/g," ").trim().toUpperCase();
        return t.includes("HEGEVA AI") && t.length<120 && el.children.length<=6;
      });
      primary=candidates[0] || root.firstElementChild;
      if(!primary) return;
      primary.classList.add("hegeva-primary-brand");
    }

    let logo=primary.querySelector(".hegeva-brand-logo");
    if(!logo){
      logo=document.createElement("img");
      logo.className="hegeva-brand-logo";
      logo.src="/assets/hegeva-wing-logo.svg";
      logo.alt="HEGEVA AI";
      logo.decoding="async";
      primary.prepend(logo);
    }

    [...root.querySelectorAll("div,a,section")].forEach(el=>{
      if(el===primary || el.contains(primary) || primary.contains(el)) return;
      const t=(el.textContent||"").replace(/\s+/g," ").trim().toUpperCase();
      if((t.includes("SMART BUSINESS HUB") || /^H\s*HEGEVA AI/.test(t)) && t.length<140){
        el.classList.add("hegeva-duplicate-brand");
      }
    });
  }

  function setupHero(){
    const hero=document.querySelector("section.hero");
    if(!hero) return false;
    hero.classList.add("hegeva-premium-hero");

    const badge=hero.querySelector(".badge,[data-i18n='home.badge']");
    if(badge){
      badge.textContent=BADGE_TEXT;
      badge.removeAttribute("data-i18n");
    }

    hero.querySelectorAll(".vision-visual,.hegeva-robot-layer").forEach(el=>el.remove());

    let wrap=hero.querySelector(".hegeva-robot-wrap");
    if(!wrap){
      wrap=document.createElement("div");
      wrap.className="hegeva-robot-wrap";
      wrap.setAttribute("aria-hidden","true");

      const img=document.createElement("img");
      img.className="hegeva-robot-img";
      img.src="/assets/hegeva-home-hero.png?v=direct-robot-1";
      img.alt="";
      img.decoding="async";
      img.fetchPriority="high";

      wrap.appendChild(img);
      hero.appendChild(wrap);
    }

    if(!hero.querySelector(".hegeva-hero-tools")){
      const tools=document.createElement("div");
      tools.className="hegeva-hero-tools";
      tools.setAttribute("aria-hidden","true");
      tools.innerHTML=`
        <div class="hegeva-hero-tool">AI Assistant<small>Working AI chat</small></div>
        <div class="hegeva-hero-tool">Documents<small>Workspace documents</small></div>
        <div class="hegeva-hero-tool">Customers & CRM<small>Saved customer records</small></div>
        <div class="hegeva-hero-tool">Reports<small>Business reporting tools</small></div>`;
      hero.appendChild(tools);
    }
    return true;
  }

  function install(){
    document.documentElement.classList.add("hegeva-premium-ui");
    addStyle();
    setupBrand();
    setupHero();
    setTimeout(()=>{setupBrand();setupHero();},350);
    setTimeout(()=>{setupBrand();setupHero();},1100);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();
