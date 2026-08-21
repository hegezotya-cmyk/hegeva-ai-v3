/* =========================================================
   HEGEVA AI V35.4.1
   MODULE 6/8 — MOBILE + 5-LANGUAGE POLISH
   RESPONSIVE UI + LANGUAGE CONSISTENCY
   EN / HU / DE / FR / ES
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.1";
  const MODULE = "MOBILE_I18N";
  const LANGS = ["en","hu","de","fr","es"];

  function language(){
    const raw = String(
      document.getElementById("languageSelect")?.value ||
      localStorage.getItem("hegeva_language") ||
      document.documentElement.lang ||
      "en"
    ).toLowerCase().slice(0,2);

    return LANGS.includes(raw) ? raw : "en";
  }

  function installStyle(){
    if(document.getElementById("v3541MobileI18nStyle")) return;

    const style = document.createElement("style");
    style.id = "v3541MobileI18nStyle";

    style.textContent = `
      html,body{
        max-width:100%;
        overflow-x:hidden;
      }

      img,svg,video,canvas{
        max-width:100%;
        height:auto;
      }

      textarea,
      input,
      select,
      button{
        max-width:100%;
      }

      [id^="v3540"],
      [id^="v3541"],
      #aiChatMessages,
      #savedChatsList{
        overflow-wrap:anywhere;
        word-break:break-word;
      }

      @media(max-width:900px){
        [class*="grid"],
        [class*="columns"]{
          min-width:0;
        }
      }

      @media(max-width:720px){
        body{
          font-size:14px;
        }

        main,
        .main,
        .content,
        .page,
        .app-main{
          width:100% !important;
          max-width:100% !important;
          min-width:0 !important;
        }

        #v3540BusinessTools,
        #v3540Workspace,
        #v3540Security,
        #hegevaV3541PlansUsage{
          margin-left:0 !important;
          margin-right:0 !important;
          width:100% !important;
        }

        button,
        select,
        input[type="text"],
        input[type="search"],
        textarea{
          min-height:42px;
        }

        #aiChatInput{
          min-height:120px;
        }

        #v3540ChatProBar,
        #v3540WorkspaceActions,
        #v3540SecurityActions,
        .v3540-business-actions{
          width:100%;
        }
      }

      @media(max-width:480px){
        body{
          font-size:13px;
        }

        button{
          padding-left:10px !important;
          padding-right:10px !important;
        }

        #v3540ChatProBar,
        #v3540WorkspaceActions,
        #v3540SecurityActions,
        .v3540-business-actions{
          display:grid !important;
          grid-template-columns:1fr !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function syncLanguage(){
    const lang = language();

    document.documentElement.lang = lang;

    if(document.body){
      document.body.dataset.hegevaLanguage = lang;
    }

    const selectors = [
      "#aiChatInput",
      "#aiChatMessages",
      "#savedChatsList",
      "#v3540DocumentType",
      "#v3540DocumentDetails",
      "#v3540WorkspaceNotes",
      "#v3540Security",
      "#hegevaV3541PlansUsage"
    ];

    selectors.forEach(selector => {
      document
        .querySelectorAll(selector)
        .forEach(el => {
          el.setAttribute("lang",lang);
        });
    });

    document
      .querySelectorAll(
        '[data-role="user"],[data-role="assistant"],.message,.saved-chat'
      )
      .forEach(el => {
        if(!el.getAttribute("lang")){
          el.setAttribute("lang",lang);
        }
      });
  }
  function boot(){

    installStyle();
    syncLanguage();

    document
      .getElementById("languageSelect")
      ?.addEventListener(
        "change",
        () => {
          setTimeout(
            syncLanguage,
            50
          );
        }
      );

    window.addEventListener(
      "storage",
      event => {
        if(
          event.key === "hegeva_language" ||
          event.key === "hegeva_language_v1"
        ){
          setTimeout(syncLanguage,30);
        }
      }
    );

    window.hegevaV3541MobileI18n = {
      version:VERSION,
      module:MODULE,
      responsive:true,
      touchFriendly:true,
      overflowGuard:true,
      languageSync:true,
      languages:[...LANGS],
      changesAIBackend:false,
      changesStripe:false,
      changesBilling:false,
      changesAuthentication:false
    };

    console.log(
      "HEGEVA AI V35.4.1 Mobile + 5-language polish active."
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
