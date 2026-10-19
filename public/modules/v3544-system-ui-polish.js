/* =========================================================
   HEGEVA AI V35.4.4
   SYSTEM CHECK + UI FINAL POLISH
   HONEST CLOUD STATUS + COMPACT UI + VERSION CLEANUP
   EN / HU / DE / FR / ES
   NO AI / BILLING / AUTH BACKEND CHANGES
   NO MUTATION OBSERVER
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.4";
  const LANGS = ["en","hu","de","fr","es"];

  const TEXT = {
    en:{
      cloud:"Cloud workspace",
      checking:"Checking cloud sync...",
      active:"Cloud sync active",
      local:"Local cache + cloud sync",
      localHelp:"Signed-in workspace data is synced to HEGEVA cloud storage. This browser also keeps a local cache.",
      unavailable:"Cloud sync unavailable",
      manual:"Manual check",
      pass:"Pass",
      warning:"Warning"
    },

    hu:{
      cloud:"Felhőalapú munkaterület",
      checking:"Felhőszinkron ellenőrzése...",
      active:"Felhőszinkron aktív",
      local:"Helyi gyorsítótár + felhőszinkron",
      localHelp:"Bejelentkezve a munkaterület adatai a HEGEVA felhőbe is szinkronizálódnak. A böngésző helyi gyorsítótárat is használ.",
      unavailable:"A felhőszinkron nem elérhető",
      manual:"Kézi ellenőrzés",
      pass:"Rendben",
      warning:"Figyelmeztetés"
    },

    de:{
      cloud:"Cloud-Arbeitsbereich",
      checking:"Cloud-Synchronisierung wird geprüft...",
      active:"Cloud-Synchronisierung aktiv",
      local:"Lokaler Cache + Cloud-Sync",
      localHelp:"Angemeldete Workspace-Daten werden mit dem HEGEVA-Cloudspeicher synchronisiert. Dieser Browser verwendet zusätzlich einen lokalen Cache.",
      unavailable:"Cloud-Synchronisierung nicht verfügbar",
      manual:"Manuelle Prüfung",
      pass:"Bestanden",
      warning:"Warnung"
    },

    fr:{
      cloud:"Espace de travail cloud",
      checking:"Vérification de la synchronisation cloud...",
      active:"Synchronisation cloud active",
      local:"Cache local + synchronisation cloud",
      localHelp:"Les données de l’espace de travail connecté sont synchronisées avec le stockage cloud HEGEVA. Ce navigateur conserve également un cache local.",
      unavailable:"Synchronisation cloud indisponible",
      manual:"Vérification manuelle",
      pass:"Réussi",
      warning:"Avertissement"
    },

    es:{
      cloud:"Espacio de trabajo en la nube",
      checking:"Comprobando sincronización cloud...",
      active:"Sincronización cloud activa",
      local:"Caché local + sincronización cloud",
      localHelp:"Los datos del espacio de trabajo con sesión iniciada se sincronizan con el almacenamiento cloud de HEGEVA. Este navegador también mantiene una caché local.",
      unavailable:"Sincronización cloud no disponible",
      manual:"Comprobación manual",
      pass:"Correcto",
      warning:"Advertencia"
    }
  };

  function lang(){
    const raw = String(
      document.getElementById("languageSelect")?.value ||
      localStorage.getItem("hegeva_language") ||
      document.documentElement.lang ||
      "en"
    ).toLowerCase().slice(0,2);

    return LANGS.includes(raw) ? raw : "en";
  }

  function tx(){
    return TEXT[lang()] || TEXT.en;
  }

  function installStyle(){
    if(document.getElementById("v3544SystemUiStyle")){
      return;
    }

    const style = document.createElement("style");
    style.id = "v3544SystemUiStyle";

    style.textContent = `
      /* HEGEVA V35.4.4 final visual consistency */

      .v3544-cloud-status{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-top:10px;
        padding:11px 13px;
        border:1px solid rgba(227,189,85,.25);
        border-radius:12px;
        background:rgba(5,15,28,.48);
        color:#dce7f5;
        font-size:12px;
      }

      .v3544-cloud-status strong{
        color:#f3f7fc;
      }

      .v3544-cloud-pill{
        display:inline-flex;
        align-items:center;
        gap:6px;
        white-space:nowrap;
        padding:5px 9px;
        border-radius:999px;
        border:1px solid rgba(72,214,149,.35);
        background:rgba(32,170,112,.12);
        color:#8ff0bf;
        font-weight:800;
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.04em;
      }

      .v3544-cloud-pill.warn{
        border-color:rgba(230,185,75,.35);
        background:rgba(230,185,75,.10);
        color:#f1d379;
      }

      /* Make large status/check rows tighter */
      [class*="check-row"],
      [class*="system-row"],
      [class*="launch-row"]{
        min-height:auto !important;
      }

      /* General HEGEVA premium panel cleanup */
      .card,
      .panel{
        border-radius:16px !important;
      }

      button,
      .primary-button,
      .secondary-button{
        border-radius:11px !important;
      }

      /* Reduce excessive empty vertical space */
      .page-section{
        margin-bottom:18px !important;
      }

      /* Better muted text contrast */
      small,
      .muted,
      .helper-text,
      [class*="subtitle"]{
        color:#9fb0c7;
      }

      /* Avoid old internal version labels dominating UI */
      .v3544-internal-version-clean{
        opacity:.72 !important;
        font-size:10px !important;
        letter-spacing:.08em !important;
      }

      @media(max-width:760px){
        .v3544-cloud-status{
          align-items:flex-start;
          flex-direction:column;
        }

        .v3544-cloud-pill{
          align-self:flex-start;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function cleanVersionLabels(){
    const selectors = [
      "small",
      ".eyebrow",
      ".version",
      "[class*='version']"
    ];

    document
      .querySelectorAll(selectors.join(","))
      .forEach(el => {
        const text = String(el.textContent || "").trim();

        if(
          /^V\d+(?:\.\d+){1,3}\b/i.test(text) ||
          /^V\d+\.\d+\s+/i.test(text)
        ){
          el.classList.add(
            "v3544-internal-version-clean"
          );
        }
      });
  }

  function updateWorkspaceLocalCopy(){
    const root =
      document.getElementById(
        "v3540WorkspaceSave"
      )?.closest("section,article,.card,.panel,div");

    if(!root) return;

    const nodes =
      root.querySelectorAll(
        "small,span,div,p"
      );

    nodes.forEach(node => {
      const value =
        String(node.textContent || "")
          .trim()
          .toLowerCase();

      if(
        value ===
          "stored locally in this browser" ||
        value.includes(
          "helyben, ebben a böngészőben"
        )
      ){
        node.textContent =
          tx().local;
      }
    });
  }

  async function checkCloud(){
    try{
      const response =
        await fetch(
          "/api/workspace",
          {
            method:"GET",
            credentials:"include",
            headers:{
              "Accept":
                "application/json"
            }
          }
        );

      if(response.status === 401){
        return {
          ok:false,
          authenticated:false
        };
      }

      if(!response.ok){
        return {
          ok:false,
          authenticated:false
        };
      }

      const data =
        await response.json();

      return {
        ok:
          Boolean(
            data?.available &&
            data?.authenticated
          ),
        authenticated:
          Boolean(data?.authenticated)
      };

    }catch(_error){
      return {
        ok:false,
        authenticated:false
      };
    }
  }

  function statusTarget(){
    const save =
      document.getElementById(
        "v3540WorkspaceSave"
      );

    if(!save) return null;

    let parent = save.parentElement;

    for(let i=0;i<5 && parent;i++){
      if(
        parent.querySelector(
          "#v3540WorkspaceNotes"
        )
      ){
        return parent;
      }

      parent = parent.parentElement;
    }

    return save.parentElement;
  }

  async function renderCloudStatus(){
    const target =
      statusTarget();

    if(!target) return false;

    let box =
      document.getElementById(
        "v3544CloudStatus"
      );

    if(!box){
      box =
        document.createElement("div");

      box.id =
        "v3544CloudStatus";

      box.className =
        "v3544-cloud-status";

      target.appendChild(box);
    }

    box.innerHTML = `
      <div>
        <strong>${tx().cloud}</strong><br>
        <span>${tx().checking}</span>
      </div>
      <span class="v3544-cloud-pill warn">…</span>
    `;

    const status =
      await checkCloud();

    if(status.ok){
      box.innerHTML = `
        <div>
          <strong>${tx().cloud}</strong><br>
          <span>${tx().localHelp}</span>
        </div>

        <span class="v3544-cloud-pill">
          ● ${tx().active}
        </span>
      `;
    }else{
      box.innerHTML = `
        <div>
          <strong>${tx().cloud}</strong><br>
          <span>${tx().local}</span>
        </div>

        <span class="v3544-cloud-pill warn">
          ● ${tx().unavailable}
        </span>
      `;
    }

    return true;
  }

  function polish(){
    cleanVersionLabels();
    updateWorkspaceLocalCopy();
  }

  function boot(){
    installStyle();
    polish();

    // Finite retries only.
    // No MutationObserver = no runaway DOM loop.
    let attempts = 0;

    const timer =
      setInterval(
        async () => {
          attempts += 1;

          polish();

          const done =
            await renderCloudStatus();

          if(
            done ||
            attempts >= 20
          ){
            clearInterval(timer);
          }
        },
        250
      );

    document
      .getElementById(
        "languageSelect"
      )
      ?.addEventListener(
        "change",
        () => {
          setTimeout(
            async () => {
              polish();
              await renderCloudStatus();
            },
            100
          );
        }
      );

    window.hegevaV3544SystemUiPolish = {
      version:VERSION,
      honestCloudStatus:true,
      systemUiPolish:true,
      finiteRetry:true,
      mutationObserver:false,
      changesAIBackend:false,
      changesDatabase:false,
      changesBilling:false,
      changesStripe:false,
      changesAuthentication:false
    };

    console.log(
      "HEGEVA AI V35.4.4 System Check + UI Final Polish active."
    );
  }

  if(
    document.readyState ===
    "loading"
  ){
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {once:true}
    );
  }else{
    boot();
  }

})();
