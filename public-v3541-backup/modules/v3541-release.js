/* =========================================================
   HEGEVA AI V35.4.1
   MODULE 8/8 — RELEASE CANDIDATE / FINAL QA
   MODULE HEALTH + RELEASE STATUS + SAFE VALIDATION
   EN / HU / DE / FR / ES
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.1";
  const MODULE = "RELEASE_CANDIDATE";
  const LANGS = ["en","hu","de","fr","es"];

  const REQUIRED = [
    {
      key: "chat",
      label: "AI Chat Pro",
      test: () => Boolean(window.hegevaV3540ChatPro)
    },
    {
      key: "business",
      label: "Business & Document Tools",
      test: () => Boolean(window.hegevaV3540BusinessTools)
    },
    {
      key: "workspace",
      label: "Workspace Pro",
      test: () => Boolean(window.hegevaV3540Workspace)
    },
    {
      key: "security",
      label: "Account & Security",
      test: () => Boolean(window.hegevaV3540Security)
    },
    {
      key: "plans",
      label: "Plans & Usage",
      test: () => Boolean(window.hegevaV3541PlansUsage)
    },
    {
      key: "mobile",
      label: "Mobile + i18n",
      test: () => Boolean(window.hegevaV3541MobileI18n)
    },
    {
      key: "performance",
      label: "Performance + Cleanup",
      test: () => Boolean(window.hegevaV3541Performance)
    }
  ];

  const TEXT = {
    en:{
      title:"Release Candidate Status",
      ready:"Release candidate ready",
      warning:"Some modules need attention",
      passed:"Passed",
      failed:"Missing",
      language:"Language",
      secure:"Secure context",
      yes:"Yes",
      no:"No",
      refresh:"Run final check",
      note:"This status panel checks whether the HEGEVA frontend modules are loaded. It does not claim that billing, authentication or legal/compliance testing is complete."
    },
    hu:{
      title:"Release Candidate állapot",
      ready:"Release candidate kész",
      warning:"Néhány modul ellenőrzést igényel",
      passed:"Rendben",
      failed:"Hiányzik",
      language:"Nyelv",
      secure:"Biztonságos kapcsolat",
      yes:"Igen",
      no:"Nem",
      refresh:"Végső ellenőrzés",
      note:"Ez a panel azt ellenőrzi, hogy a HEGEVA frontend moduljai betöltődtek-e. Nem állítja, hogy a számlázási, hitelesítési vagy jogi/compliance tesztelés teljes."
    },
    de:{
      title:"Release-Candidate-Status",
      ready:"Release Candidate bereit",
      warning:"Einige Module benötigen Aufmerksamkeit",
      passed:"Bestanden",
      failed:"Fehlt",
      language:"Sprache",
      secure:"Sicherer Kontext",
      yes:"Ja",
      no:"Nein",
      refresh:"Finale Prüfung",
      note:"Dieses Panel prüft, ob die HEGEVA-Frontend-Module geladen sind. Es behauptet nicht, dass Abrechnung, Authentifizierung oder rechtliche/compliancebezogene Tests abgeschlossen sind."
    },
    fr:{
      title:"Statut Release Candidate",
      ready:"Release candidate prêt",
      warning:"Certains modules nécessitent une vérification",
      passed:"Validé",
      failed:"Manquant",
      language:"Langue",
      secure:"Contexte sécurisé",
      yes:"Oui",
      no:"Non",
      refresh:"Lancer la vérification finale",
      note:"Ce panneau vérifie si les modules frontend HEGEVA sont chargés. Il ne prétend pas que les tests de facturation, d’authentification ou juridiques/conformité sont terminés."
    },
    es:{
      title:"Estado Release Candidate",
      ready:"Release candidate listo",
      warning:"Algunos módulos requieren atención",
      passed:"Correcto",
      failed:"Falta",
      language:"Idioma",
      secure:"Contexto seguro",
      yes:"Sí",
      no:"No",
      refresh:"Ejecutar comprobación final",
      note:"Este panel comprueba si los módulos frontend de HEGEVA están cargados. No afirma que las pruebas de facturación, autenticación o legales/compliance estén completas."
    }
  };

  function language(){
    const raw = String(
      document.getElementById("languageSelect")?.value ||
      localStorage.getItem("hegeva_language") ||
      document.documentElement.lang ||
      "en"
    ).toLowerCase().slice(0,2);

    return LANGS.includes(raw) ? raw : "en";
  }

  function text(){
    return TEXT[language()] || TEXT.en;
  }

  function installStyle(){
    if(document.getElementById("v3541ReleaseStyle")) return;

    const style = document.createElement("style");
    style.id = "v3541ReleaseStyle";

    style.textContent = `
      #v3541ReleasePanel{
        margin:14px 0;
        padding:14px;
        border:1px solid rgba(212,175,55,.28);
        border-radius:16px;
        background:rgba(12,25,44,.82);
      }

      #v3541ReleasePanel h3{
        margin:0 0 10px;
        font-size:16px;
      }

      .v3541-release-summary{
        margin-bottom:10px;
        font-weight:800;
      }

      .v3541-release-grid{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px;
      }

      .v3541-release-item{
        padding:9px 10px;
        border-radius:10px;
        border:1px solid rgba(255,255,255,.08);
        background:rgba(255,255,255,.025);
        display:flex;
        justify-content:space-between;
        gap:10px;
      }

      .v3541-release-ok{
        color:#b7f7c7;
      }

      .v3541-release-bad{
        color:#ffd0d0;
      }

      #v3541ReleaseMeta{
        margin-top:10px;
        font-size:11px;
        line-height:1.5;
        opacity:.74;
      }

      #v3541ReleaseButton{
        margin-top:10px;
        min-height:38px;
        padding:7px 12px;
        border-radius:10px;
        border:1px solid rgba(212,175,55,.34);
        background:rgba(27,43,70,.92);
        color:inherit;
        cursor:pointer;
        font:inherit;
        font-weight:700;
      }

      @media(max-width:720px){
        .v3541-release-grid{
          grid-template-columns:1fr;
        }

        #v3541ReleaseButton{
          width:100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createUI(){
    if(document.getElementById("v3541ReleasePanel")) return;

    const anchor =
      document.getElementById("hegevaV3541PlansUsage") ||
      document.getElementById("v3540Security") ||
      document.querySelector("main") ||
      document.body;

    const panel = document.createElement("section");
    panel.id = "v3541ReleasePanel";

    panel.innerHTML = `
      <h3 id="v3541ReleaseTitle"></h3>
      <div
        id="v3541ReleaseSummary"
        class="v3541-release-summary"
      ></div>

      <div
        id="v3541ReleaseGrid"
        class="v3541-release-grid"
      ></div>

      <div id="v3541ReleaseMeta"></div>

      <button
        id="v3541ReleaseButton"
        type="button"
      ></button>
    `;

    anchor.insertAdjacentElement(
      "afterend",
      panel
    );

    document
      .getElementById("v3541ReleaseButton")
      ?.addEventListener(
        "click",
        check
      );

    translate();
    check();
  }

  function check(){
    const t = text();

    const grid =
      document.getElementById("v3541ReleaseGrid");

    const summary =
      document.getElementById("v3541ReleaseSummary");

    const meta =
      document.getElementById("v3541ReleaseMeta");

    if(!grid) return;

    grid.innerHTML = "";

    let passed = 0;

    REQUIRED.forEach(item => {
      let ok = false;

      try{
        ok = Boolean(item.test());
      }catch(_error){
        ok = false;
      }

      if(ok) passed += 1;

      const row =
        document.createElement("div");

      row.className =
        "v3541-release-item";

      row.innerHTML = `
        <span>${item.label}</span>
        <strong class="${
          ok
            ? "v3541-release-ok"
            : "v3541-release-bad"
        }">
          ${
            ok
              ? "✓ " + t.passed
              : "× " + t.failed
          }
        </strong>
      `;

      grid.appendChild(row);
    });

    const allGood =
      passed === REQUIRED.length;

    if(summary){
      summary.textContent =
        allGood
          ? "✓ " + t.ready
          : "⚠ " + t.warning;
    }

    if(meta){
      meta.innerHTML = `
        ${t.language}: <strong>${language().toUpperCase()}</strong><br>
        ${t.secure}: <strong>${
          window.isSecureContext
            ? t.yes
            : t.no
        }</strong><br><br>
        ${t.note}
      `;
    }

    document.documentElement.dataset
      .hegevaReleaseCandidate =
        allGood
          ? "ready"
          : "attention";

    window.hegevaV3541ReleaseState = {
      checkedAt:
        new Date().toISOString(),
      passed,
      total:REQUIRED.length,
      ready:allGood
    };

    return allGood;
  }

  function translate(){
    const t = text();

    const title =
      document.getElementById("v3541ReleaseTitle");

    const button =
      document.getElementById("v3541ReleaseButton");

    if(title){
      title.textContent =
        "🚀 " + t.title;
    }

    if(button){
      button.textContent =
        "✓ " + t.refresh;
    }

    check();
  }

  function boot(){
    installStyle();

    let attempts = 0;

    const start = () => {
      attempts += 1;

      createUI();

      if(
        !document.getElementById("v3541ReleasePanel") &&
        attempts < 80
      ){
        setTimeout(start,100);
      }
    };

    start();

    document
      .getElementById("languageSelect")
      ?.addEventListener(
        "change",
        () => {
          setTimeout(
            translate,
            70
          );
        }
      );

    window.hegevaV3541Release = {
      version:VERSION,
      module:MODULE,
      check,
      requiredModules:
        REQUIRED.map(item => item.key),
      releaseCandidate:true,
      frontendValidation:true,
      extraAIRequest:false,
      changesAIBackend:false,
      changesStripe:false,
      changesBilling:false,
      changesAuthentication:false
    };

    console.log(
      "HEGEVA AI V35.4.1 Release Candidate QA active."
    );
  }

  if(document.readyState === "loading"){
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {once:true}
    );
  }else{
    boot();
  }

})();
