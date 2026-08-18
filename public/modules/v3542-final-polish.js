/* =========================================================
   HEGEVA AI V35.4.2
   FULL AUDIT + FINAL POLISH PATCH
   Runtime stability, Business Tools repair, i18n sync,
   accessibility, visual contrast and stale-state cleanup.
   ========================================================= */
(() => {
  "use strict";

  const VERSION = "V35.4.2";
  const LANGS = ["en","hu","de","fr","es"];
  const DOCS_KEY = "hegeva_v44_documents";
  const CLIENTS_KEY = "hegeva_v44_clients";
  const COUNTER_KEY = "hegeva_v44_doc_counter";

  const T = {
    en:{customer:"Customer",description:"Description",total:"Total",revenue:"Revenue",costs:"Total costs",profit:"Profit / loss",margin:"Margin",needFields:"Please enter the customer and description first.",saved:"Document saved locally.",printHint:"Print dialog opened. Choose “Save as PDF” to create a PDF.",clientNeed:"Please enter a customer name.",clientSaved:"Customer saved locally.",search:"Search saved chats...",all:"All categories",newest:"Newest first",oldest:"Oldest first",az:"Name A–Z",za:"Name Z–A",reset:"Reset",ready:"Saved chats ready",backup:"⬇ Backup chats",restore:"⬆ Restore",inspect:"🔍 Inspect backup",summary:"📝 Summarise this chat",favorite:"⭐ Favorite",business:"💼 Business",finance:"💷 Finance",document:"📄 Document",idea:"💡 Idea",sessionActive:"Active",sessionUnknown:"Unknown"},
    hu:{customer:"Ügyfél",description:"Leírás",total:"Végösszeg",revenue:"Bevétel",costs:"Összes költség",profit:"Eredmény",margin:"Árrés",needFields:"Először add meg az ügyfelet és a leírást.",saved:"A dokumentum helyben elmentve.",printHint:"Megnyílt a nyomtatási ablak. PDF készítéséhez válaszd a „Mentés PDF-ként” lehetőséget.",clientNeed:"Add meg az ügyfél nevét.",clientSaved:"Az ügyfél helyben elmentve.",search:"Keresés a mentett chatekben...",all:"Minden kategória",newest:"Legújabb elöl",oldest:"Legrégebbi elöl",az:"Név A–Z",za:"Név Z–A",reset:"Alaphelyzet",ready:"Mentett chatek készen",backup:"⬇ Chat mentés",restore:"⬆ Visszaállítás",inspect:"🔍 Mentés ellenőrzése",summary:"📝 Chat összefoglalása",favorite:"⭐ Kedvenc",business:"💼 Üzlet",finance:"💷 Pénzügy",document:"📄 Dokumentum",idea:"💡 Ötlet",sessionActive:"Aktív",sessionUnknown:"Ismeretlen"},
    de:{customer:"Kunde",description:"Beschreibung",total:"Gesamt",revenue:"Umsatz",costs:"Gesamtkosten",profit:"Gewinn / Verlust",margin:"Marge",needFields:"Bitte zuerst Kunde und Beschreibung eingeben.",saved:"Dokument lokal gespeichert.",printHint:"Druckdialog geöffnet. Wähle „Als PDF speichern“ für eine PDF-Datei.",clientNeed:"Bitte einen Kundennamen eingeben.",clientSaved:"Kunde lokal gespeichert.",search:"Gespeicherte Chats durchsuchen...",all:"Alle Kategorien",newest:"Neueste zuerst",oldest:"Älteste zuerst",az:"Name A–Z",za:"Name Z–A",reset:"Zurücksetzen",ready:"Gespeicherte Chats bereit",backup:"⬇ Chats sichern",restore:"⬆ Wiederherstellen",inspect:"🔍 Backup prüfen",summary:"📝 Chat zusammenfassen",favorite:"⭐ Favorit",business:"💼 Geschäft",finance:"💷 Finanzen",document:"📄 Dokument",idea:"💡 Idee",sessionActive:"Aktiv",sessionUnknown:"Unbekannt"},
    fr:{customer:"Client",description:"Description",total:"Total",revenue:"Chiffre d’affaires",costs:"Coûts totaux",profit:"Bénéfice / perte",margin:"Marge",needFields:"Saisissez d’abord le client et la description.",saved:"Document enregistré localement.",printHint:"La boîte de dialogue d’impression est ouverte. Choisissez « Enregistrer au format PDF ».",clientNeed:"Saisissez un nom de client.",clientSaved:"Client enregistré localement.",search:"Rechercher dans les chats enregistrés...",all:"Toutes les catégories",newest:"Plus récents",oldest:"Plus anciens",az:"Nom A–Z",za:"Nom Z–A",reset:"Réinitialiser",ready:"Chats enregistrés prêts",backup:"⬇ Sauvegarder",restore:"⬆ Restaurer",inspect:"🔍 Vérifier la sauvegarde",summary:"📝 Résumer ce chat",favorite:"⭐ Favori",business:"💼 Entreprise",finance:"💷 Finance",document:"📄 Document",idea:"💡 Idée",sessionActive:"Active",sessionUnknown:"Inconnue"},
    es:{customer:"Cliente",description:"Descripción",total:"Total",revenue:"Ingresos",costs:"Costes totales",profit:"Beneficio / pérdida",margin:"Margen",needFields:"Primero introduce el cliente y la descripción.",saved:"Documento guardado localmente.",printHint:"Se abrió el diálogo de impresión. Elige « Guardar como PDF » para crear un PDF.",clientNeed:"Introduce un nombre de cliente.",clientSaved:"Cliente guardado localmente.",search:"Buscar en chats guardados...",all:"Todas las categorías",newest:"Más recientes",oldest:"Más antiguos",az:"Nombre A–Z",za:"Nombre Z–A",reset:"Restablecer",ready:"Chats guardados listos",backup:"⬇ Copia chats",restore:"⬆ Restaurar",inspect:"🔍 Revisar copia",summary:"📝 Resumir este chat",favorite:"⭐ Favorito",business:"💼 Negocios",finance:"💷 Finanzas",document:"📄 Documento",idea:"💡 Idea",sessionActive:"Activa",sessionUnknown:"Desconocida"}
  };

  function lang(){
    const v=String(document.getElementById("languageSelect")?.value||localStorage.getItem("hegeva_language")||document.documentElement.lang||"en").toLowerCase().slice(0,2);
    return LANGS.includes(v)?v:"en";
  }
  const tx=()=>T[lang()]||T.en;
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const money=n=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(Number(n)||0);

  function toast(message){
    let box=document.getElementById("v3542Toast");
    if(!box){box=document.createElement("div");box.id="v3542Toast";box.setAttribute("role","status");box.setAttribute("aria-live","polite");document.body.appendChild(box);}
    box.textContent=message;box.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.classList.remove("show"),2200);
  }

  function docData(){
    const qty=Math.max(0,Number(document.getElementById("btQty")?.value||0));
    const price=Math.max(0,Number(document.getElementById("btPrice")?.value||0));
    const vatRate=Math.min(100,Math.max(0,Number(document.getElementById("btVat")?.value||0)));
    const subtotal=qty*price, vat=subtotal*vatRate/100;
    return {type:document.getElementById("btDocType")?.value||"Invoice",number:document.getElementById("btDocNumber")?.value||"",customer:(document.getElementById("btCustomer")?.value||"").trim(),description:(document.getElementById("btDescription")?.value||"").trim(),qty,price,vatRate,subtotal,vat,total:subtotal+vat,createdAt:new Date().toISOString()};
  }
  function nextNumber(type){
    const current=Number(localStorage.getItem(COUNTER_KEY)||"0")+1;
    return `${type==="Quote"?"QUO":type==="Receipt"?"REC":"INV"}-${String(current).padStart(5,"0")}`;
  }
  function refreshNumber(){const el=document.getElementById("btDocNumber");if(el)el.value=nextNumber(document.getElementById("btDocType")?.value||"Invoice");}
  function renderPreview(){
    const d=docData(),x=tx(),box=document.getElementById("btDocPreview");if(!box)return;
    box.style.display="block";box.innerHTML=`<strong>${esc(d.type)} ${esc(d.number)}</strong><br>${esc(x.customer)}: ${esc(d.customer||"—")}<br>${esc(x.description)}: ${esc(d.description||"—")}<br>${d.qty} × ${money(d.price)} = ${money(d.subtotal)}<br>VAT (${d.vatRate}%): ${money(d.vat)}<br><strong>${esc(x.total)}: ${money(d.total)}</strong>`;
  }
  function saveDoc(){
    const d=docData(),x=tx();if(!d.customer||!d.description){toast(x.needFields);return;}
    let docs=[];try{docs=JSON.parse(localStorage.getItem(DOCS_KEY)||"[]");if(!Array.isArray(docs))docs=[];}catch{docs=[];}
    docs.unshift(d);localStorage.setItem(DOCS_KEY,JSON.stringify(docs.slice(0,100)));
    const counter=Number(localStorage.getItem(COUNTER_KEY)||"0")+1;localStorage.setItem(COUNTER_KEY,String(counter));refreshNumber();renderPreview();toast(x.saved);
  }
  function printDoc(){renderPreview();toast(tx().printHint);setTimeout(()=>window.print(),80);}
  function calcProfit(){
    const x=tx(),revenue=Math.max(0,Number(document.getElementById("btRevenue")?.value||0)),stock=Math.max(0,Number(document.getElementById("btStock")?.value||0)),operating=Math.max(0,Number(document.getElementById("btOperating")?.value||0)),other=Math.max(0,Number(document.getElementById("btOther")?.value||0)),costs=stock+operating+other,profit=revenue-costs,margin=revenue>0?(profit/revenue)*100:0,box=document.getElementById("btProfitResult");
    if(box){box.style.display="block";box.innerHTML=`${esc(x.revenue)}: <strong>${money(revenue)}</strong><br>${esc(x.costs)}: <strong>${money(costs)}</strong><br>${esc(x.profit)}: <strong>${money(profit)}</strong><br>${esc(x.margin)}: <strong>${margin.toFixed(1)}%</strong>`;}
  }
  function addClient(){
    const name=(document.getElementById("btClientName")?.value||"").trim(),email=(document.getElementById("btClientEmail")?.value||"").trim(),x=tx();if(!name){toast(x.clientNeed);return;}
    let clients=[];try{clients=JSON.parse(localStorage.getItem(CLIENTS_KEY)||"[]");if(!Array.isArray(clients))clients=[];}catch{clients=[];}
    clients.unshift({name,email,createdAt:new Date().toISOString()});localStorage.setItem(CLIENTS_KEY,JSON.stringify(clients.slice(0,100)));toast(x.clientSaved);
    document.getElementById("btClientName")&&(document.getElementById("btClientName").value="");document.getElementById("btClientEmail")&&(document.getElementById("btClientEmail").value="");
    try{window.hegevaV3540BusinessTools?.refresh?.();}catch{}
  }

  function cleanStaleFields(){
    const desc=document.getElementById("btDescription");if(desc&&/^loading(?:\.{0,3})?$/i.test(desc.value.trim()))desc.value="";
    const vat=document.getElementById("btVat");if(vat){vat.max="100";vat.min="0";vat.inputMode="decimal";if(vat.value==="0.2")vat.value="20";}
    refreshNumber();
  }

  function syncSavedChatI18n(){
    const x=tx();
    const search=document.getElementById("hegevaV35316Search");if(search&&search.placeholder!==x.search)search.placeholder=x.search;
    const filter=document.getElementById("hegevaV35316Filter");if(filter){const m={all:x.all,favourite:x.favorite.replace(/^⭐\s*/,""),business:x.business.replace(/^💼\s*/,""),finance:x.finance.replace(/^💷\s*/,""),document:x.document.replace(/^📄\s*/,""),idea:x.idea.replace(/^💡\s*/,"")};[...filter.options].forEach(o=>(m[o.value]&&o.textContent!==m[o.value])?(o.textContent=m[o.value]):o.textContent);}
    const sort=document.getElementById("hegevaV35317Sort");if(sort){const m={newest:x.newest,oldest:x.oldest,"name-asc":x.az,"name-desc":x.za,nameAZ:x.az,nameZA:x.za};[...sort.options].forEach(o=>(m[o.value]&&o.textContent!==m[o.value])?(o.textContent=m[o.value]):o.textContent);}
    const reset=document.getElementById("hegevaV35317Reset");if(reset&&reset.textContent!=="↻ "+x.reset)reset.textContent="↻ "+x.reset;
    const status=document.getElementById("hegevaV35317Status");if(status&&!/Filters|Szűr|Filter|Filtres|Filtros/i.test(status.textContent))status.textContent="✓ "+x.ready;
    const pairs=[["v35312Backup",x.backup],["v35312Restore",x.restore],["v35313Inspect",x.inspect],["v35314SummaryButton",x.summary]];pairs.forEach(([id,label])=>{const el=document.getElementById(id);if(el&&el.textContent!==label)el.textContent=label;});
    const category=document.querySelectorAll("#v35315Categories button,.v35315-category");const cm={favourite:x.favorite,business:x.business,finance:x.finance,document:x.document,idea:x.idea};category.forEach(btn=>{const val=String(btn.dataset.category||"").toLowerCase();if(val&&cm[val]&&btn.textContent!==cm[val])btn.textContent=cm[val];});
  }

  function syncVisibleBusinessLabels(){
    const l=lang();
    const M={
      hu:{"bt.title":"Üzleti eszközök","bt.subtitle":"Gyakorlati helyi eszközök. Az értékek kizárólag az általad megadott adatokból készülnek.","bt.invoiceTitle":"🧾 Számla / árajánlat készítő","bt.docType":"Dokumentum típusa","bt.invoice":"Számla","bt.quote":"Árajánlat","bt.docNumber":"Dokumentum száma","bt.customerName":"Ügyfél neve","bt.description":"Leírás","bt.quantity":"Mennyiség","bt.unitPrice":"Egységár (£)","bt.preview":"Előnézet","bt.save":"Mentés helyben","bt.print":"Nyomtatás / PDF mentés","bt.profitTitle":"💷 Költség- és profitkövető","bt.revenue":"Bevétel (£)","bt.stock":"Anyag / készlet (£)","bt.operating":"Működési költségek (£)","bt.other":"Egyéb költségek (£)","bt.calculate":"Számítás"},
      de:{"bt.title":"Geschäftstools","bt.invoiceTitle":"🧾 Rechnung / Angebot","bt.docType":"Dokumenttyp","bt.invoice":"Rechnung","bt.quote":"Angebot","bt.docNumber":"Dokumentnummer","bt.customerName":"Kundenname","bt.description":"Beschreibung","bt.quantity":"Menge","bt.unitPrice":"Stückpreis (£)","bt.preview":"Vorschau","bt.save":"Lokal speichern","bt.print":"Drucken / PDF speichern","bt.calculate":"Berechnen"},
      fr:{"bt.title":"Outils professionnels","bt.invoiceTitle":"🧾 Facture / devis","bt.docType":"Type de document","bt.invoice":"Facture","bt.quote":"Devis","bt.docNumber":"Numéro du document","bt.customerName":"Nom du client","bt.description":"Description","bt.quantity":"Quantité","bt.unitPrice":"Prix unitaire (£)","bt.preview":"Aperçu","bt.save":"Enregistrer localement","bt.print":"Imprimer / PDF","bt.calculate":"Calculer"},
      es:{"bt.title":"Herramientas de negocio","bt.invoiceTitle":"🧾 Factura / presupuesto","bt.docType":"Tipo de documento","bt.invoice":"Factura","bt.quote":"Presupuesto","bt.docNumber":"Número de documento","bt.customerName":"Cliente","bt.description":"Descripción","bt.quantity":"Cantidad","bt.unitPrice":"Precio unitario (£)","bt.preview":"Vista previa","bt.save":"Guardar localmente","bt.print":"Imprimir / Guardar PDF","bt.calculate":"Calcular"}
    };
    if(l==="en")return;
    const map=M[l]||{};document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(map[k]&&el.textContent!==map[k])el.textContent=map[k];});
    const ph={hu:"Termék vagy szolgáltatás",de:"Produkt oder Dienstleistung",fr:"Produit ou service",es:"Producto o servicio"};const d=document.getElementById("btDescription");if(d&&ph[l]&&d.placeholder!==ph[l])d.placeholder=ph[l];
  }

  function syncSecuritySession(){
    const box=document.getElementById("authUserBox"),email=document.getElementById("authUserEmail"),signed=Boolean(box&&getComputedStyle(box).display!=="none"&&(email?.textContent||document.getElementById("authUserName")?.textContent));
    const target=document.getElementById("v3540SecuritySession");if(target)target.textContent=signed?"✓ "+tx().sessionActive:"• "+tx().sessionUnknown;
  }

  function polish(){
    document.documentElement.lang=lang();localStorage.setItem("hegeva_language",lang());
    const subtitle=document.querySelector(".brand-subtitle");if(subtitle&&subtitle.textContent!=="V35.4.2 SMART BUSINESS HUB")subtitle.textContent="V35.4.2 SMART BUSINESS HUB";
    cleanStaleFields();syncSavedChatI18n();syncVisibleBusinessLabels();syncSecuritySession();
    document.querySelectorAll("button,input,select,textarea").forEach(el=>{if(!el.getAttribute("aria-label")&&!el.textContent.trim()&&el.placeholder)el.setAttribute("aria-label",el.placeholder);});
  }

  function installStyle(){
    if(document.getElementById("v3542PolishStyle"))return;const s=document.createElement("style");s.id="v3542PolishStyle";s.textContent=`
      #v42FavoritePrompts button,#v42FavoritePrompts .v42-prompt,.v42-favorite-prompts button{color:var(--text,#f7f8fb)!important;background:rgba(255,255,255,.06)!important}
      #v42FavoritePrompts button:hover,.v42-favorite-prompts button:hover{background:rgba(246,196,83,.12)!important}
      #v3542Toast{position:fixed;left:50%;bottom:24px;z-index:99999;transform:translate(-50%,20px);opacity:0;pointer-events:none;padding:10px 14px;border-radius:10px;background:#101827;color:#fff;border:1px solid rgba(246,196,83,.45);box-shadow:0 10px 35px rgba(0,0,0,.35);transition:.18s ease;max-width:min(92vw,620px);text-align:center}#v3542Toast.show{opacity:1;transform:translate(-50%,0)}
      #btDocPreview{line-height:1.55}#btVat:invalid{outline:2px solid #eab308}
      @media(max-width:720px){#businessTools44 .command-grid{grid-template-columns:1fr!important}#businessTools44 .tool-row{display:grid!important;grid-template-columns:1fr!important}#businessTools44 .tool-row button{width:100%!important}}
      @media print{header,.sidebar,.header-actions,.tool-row,#v3542Toast{display:none!important}#businessTools44{display:block!important}.app-layout{display:block!important}body{background:#fff!important;color:#000!important}#btDocPreview{display:block!important;border:0!important;background:#fff!important;color:#000!important;font-size:14pt!important}}
    `;document.head.appendChild(s);
  }

  function delegatedEvents(){
    document.addEventListener("click",e=>{
      const id=e.target.closest("button")?.id;if(!id)return;
      if(["btPreview","btSaveDoc","btPrint","btCalculate","btAddClient"].includes(id)){e.preventDefault();e.stopImmediatePropagation();if(id==="btPreview")renderPreview();if(id==="btSaveDoc")saveDoc();if(id==="btPrint")printDoc();if(id==="btCalculate")calcProfit();if(id==="btAddClient")addClient();}
    },true);
    document.addEventListener("change",e=>{if(e.target?.id==="btDocType"){e.stopImmediatePropagation();refreshNumber();}},true);
  }

  function boot(){installStyle();delegatedEvents();polish();document.getElementById("languageSelect")?.addEventListener("change",()=>setTimeout(polish,30));let timer;
new MutationObserver(mutations=>{
  const meaningful = mutations.some(m =>
    [...m.addedNodes, ...m.removedNodes].some(
      node => node.nodeType === 1
    )
  );

  if(!meaningful) return;

  clearTimeout(timer);
  timer=setTimeout(polish,180);
}).observe(document.body,{
  childList:true,
  subtree:true
});window.hegevaV3542={version:VERSION,businessToolsRepair:true,languagePolish:true,sessionPolish:true,mobilePolish:true,printPolish:true};console.log("HEGEVA AI V35.4.2 full audit polish active.");}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
