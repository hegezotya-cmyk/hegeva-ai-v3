export function applyHardcoreVisualPolish(html: string) {
  if (!html || html.includes('data-hegeva-hardcore="v4"')) return html

  const style = `<style data-hegeva-hardcore="v4">
:root{--hw-bg:#050b08;--hw-surface:#0a1711;--hw-surface2:#0f2118;--hw-surface3:#132a20;--hw-line:rgba(111,238,190,.16);--hw-line-strong:rgba(111,238,190,.30);--hw-text:#f7fbf9;--hw-muted:#9fb5ac;--hw-green:#2be3a1;--hw-green2:#7bf3c5;--hw-gold:#e7c66d;--hw-blue:#7bc7ff;--hw-danger:#ff8e8e;--hw-shadow:0 28px 90px rgba(0,0,0,.34);--hw-soft:0 14px 38px rgba(0,0,0,.18)}
html{background:var(--hw-bg)!important}body{background:radial-gradient(circle at 84% -8%,rgba(43,227,161,.16),transparent 30%),radial-gradient(circle at 8% 28%,rgba(231,198,109,.055),transparent 24%),linear-gradient(180deg,#06100c 0%,#040a07 100%)!important;color:var(--hw-text)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;letter-spacing:-.009em!important}
body::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.28;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:36px 36px;mask-image:linear-gradient(to bottom,black,transparent 70%)}
.shell,.layout,.dashboard-layout{position:relative;z-index:1}.main,main,.content,.page{position:relative;z-index:1}
aside,.side,.sidebar{background:linear-gradient(180deg,rgba(3,13,9,.97),rgba(5,18,13,.95))!important;border-color:var(--hw-line)!important;box-shadow:12px 0 45px rgba(0,0,0,.18)!important}
nav button,nav a,.nav button,.nav a{transition:transform .18s ease,background .18s ease,border-color .18s ease,color .18s ease!important}nav button:hover,nav a:hover,.nav button:hover,.nav a:hover{transform:translateX(2px)!important}
header,.header,.hero,.top,.page-header{position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(18,50,37,.97),rgba(7,25,18,.97))!important;border:1px solid var(--hw-line-strong)!important;box-shadow:var(--hw-shadow)!important}
header::after,.header::after,.hero::after,.top::after,.page-header::after{content:"";position:absolute;width:280px;height:280px;right:-120px;top:-165px;border-radius:999px;background:radial-gradient(circle,rgba(43,227,161,.17),transparent 66%);pointer-events:none}
h1{letter-spacing:-.055em!important;line-height:1.02!important}h2,h3{letter-spacing:-.025em!important}
.card,.panel,.widget,article,section{border-color:var(--hw-line)!important;box-shadow:var(--hw-soft)!important}.card,.panel,.widget{background:linear-gradient(180deg,rgba(17,42,32,.94),rgba(8,25,18,.97))!important}
.stats .card,.kpi,.metric-card{min-height:116px!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease!important}.stats .card:hover,.kpi:hover,.metric-card:hover{transform:translateY(-2px)!important;border-color:var(--hw-line-strong)!important;box-shadow:0 22px 60px rgba(0,0,0,.26)!important}
.stats .card strong,.kpi strong,.metric-card strong{font-variant-numeric:tabular-nums!important}
button,.action,[role="button"]{transition:transform .16s ease,box-shadow .16s ease,filter .16s ease!important}button:hover,.action:hover,[role="button"]:hover{transform:translateY(-1px)!important}button:active,.action:active,[role="button"]:active{transform:translateY(0)!important}
button.action,.primary,.btn-primary{background:linear-gradient(135deg,var(--hw-green),var(--hw-green2))!important;color:#021109!important;box-shadow:0 12px 34px rgba(43,227,161,.18)!important}
input,select,textarea{background:rgba(4,16,11,.92)!important;border-color:rgba(255,255,255,.11)!important;color:var(--hw-text)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.02)!important}input:focus,select:focus,textarea:focus{border-color:rgba(43,227,161,.62)!important;box-shadow:0 0 0 3px rgba(43,227,161,.10)!important}
.tablewrap{background:rgba(2,11,7,.28)!important;border-color:rgba(255,255,255,.06)!important}.table thead,.table th,thead th{background:rgba(255,255,255,.025)!important}.table tbody tr,tbody tr{transition:background .14s ease!important}.table tbody tr:hover,tbody tr:hover{background:rgba(43,227,161,.035)!important}
.badge,[class*="badge"]{backdrop-filter:blur(10px)!important}.empty{min-height:86px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;border:1px dashed rgba(111,238,190,.16)!important;border-radius:14px!important;background:linear-gradient(135deg,rgba(43,227,161,.025),rgba(231,198,109,.02))!important;color:var(--hw-muted)!important}.empty::before{content:"✦";margin-right:8px;color:var(--hw-green)!important;opacity:.8}
.chart,.bars{border-radius:16px!important;background:linear-gradient(180deg,rgba(255,255,255,.015),transparent)!important;padding-inline:12px!important}.bar{box-shadow:0 14px 34px rgba(43,227,161,.10)!important}
.activity>div,.dueItem{transition:transform .16s ease,border-color .16s ease!important}.activity>div:hover,.dueItem:hover{transform:translateX(2px)!important;border-color:var(--hw-line-strong)!important}
.quick button{background:linear-gradient(180deg,rgba(43,227,161,.08),rgba(43,227,161,.035))!important;border-color:var(--hw-line)!important}.quick button:hover{border-color:var(--hw-line-strong)!important;box-shadow:0 12px 30px rgba(0,0,0,.18)!important}
:focus-visible{outline:3px solid rgba(123,243,197,.85)!important;outline-offset:3px!important}
@media(min-width:1180px){.main,main,.content,.page{max-width:1480px!important}.grid.three{gap:16px!important}}
@media(max-width:800px){body::before{display:none}.main,main,.content,.page{padding-left:12px!important;padding-right:12px!important}header,.header,.hero,.top,.page-header{border-radius:18px!important}.stats{gap:9px!important}.stats .card,.kpi,.metric-card{min-height:98px!important}.tablewrap{border-radius:12px!important}nav,.nav{scroll-snap-type:x proximity!important}nav>* ,.nav>*{scroll-snap-align:start!important}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>`

  const script = `<script data-hegeva-hardcore="v4">(()=>{document.documentElement.classList.add('hegeva-hardcore-v4');const enhance=()=>{document.querySelectorAll('button').forEach(b=>{if(!b.hasAttribute('type')&&!b.closest('form'))b.setAttribute('type','button')});document.querySelectorAll('table').forEach(t=>{const p=t.parentElement;if(p&&!p.classList.contains('tablewrap')){const w=document.createElement('div');w.className='tablewrap';p.insertBefore(w,t);w.appendChild(t)}})};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance()})();</script>`

  let next = html
  next = /<\/head>/i.test(next) ? next.replace(/<\/head>/i, `${style}\n</head>`) : `${style}\n${next}`
  next = /<\/body>/i.test(next) ? next.replace(/<\/body>/i, `${script}\n</body>`) : `${next}\n${script}`
  return next
}
