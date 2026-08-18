/* =========================================================
   HEGEVA AI V35.4.0
   MODULE 4/4 — ACCOUNT & SECURITY
   LOCAL SECURITY STATUS + PRIVACY + SESSION HELPERS
   EN / HU / DE / FR / ES
   NO AUTH BACKEND CHANGES
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.0";
  const MODULE = "ACCOUNT_SECURITY";
  const LANGS = ["en","hu","de","fr","es"];

  const TEXT = {
    en:{
      title:"Account & Security",
      secure:"Secure browser context",
      insecure:"Connection security could not be confirmed",
      storage:"Local storage available",
      storageOff:"Local storage unavailable",
      session:"Session status",
      active:"Active",
      unknown:"Unknown",
      language:"Current language",
      privacy:"Privacy",
      privacyText:"HEGEVA stores some workspace preferences locally in this browser. Do not store passwords, API tokens or sensitive secrets in notes or chat fields.",
      logout:"Sign out",
      refresh:"Refresh security check",
      checked:"Security check complete"
    },

    hu:{
      title:"Fiók és biztonság",
      secure:"Biztonságos böngészőkapcsolat",
      insecure:"A kapcsolat biztonsága nem erősíthető meg",
      storage:"Helyi tárhely elérhető",
      storageOff:"Helyi tárhely nem érhető el",
      session:"Munkamenet állapota",
      active:"Aktív",
      unknown:"Ismeretlen",
      language:"Jelenlegi nyelv",
      privacy:"Adatvédelem",
      privacyText:"A HEGEVA néhány munkaterület-beállítást helyben, ebben a böngészőben tárol. Jelszót, API tokent vagy érzékeny titkot ne tárolj jegyzetben vagy chatmezőben.",
      logout:"Kijelentkezés",
      refresh:"Biztonsági ellenőrzés frissítése",
      checked:"Biztonsági ellenőrzés kész"
    },

    de:{
      title:"Konto & Sicherheit",
      secure:"Sicherer Browser-Kontext",
      insecure:"Verbindungssicherheit konnte nicht bestätigt werden",
      storage:"Lokaler Speicher verfügbar",
      storageOff:"Lokaler Speicher nicht verfügbar",
      session:"Sitzungsstatus",
      active:"Aktiv",
      unknown:"Unbekannt",
      language:"Aktuelle Sprache",
      privacy:"Datenschutz",
      privacyText:"HEGEVA speichert einige Workspace-Einstellungen lokal in diesem Browser. Speichere keine Passwörter, API-Tokens oder vertraulichen Geheimnisse in Notizen oder Chatfeldern.",
      logout:"Abmelden",
      refresh:"Sicherheitsprüfung aktualisieren",
      checked:"Sicherheitsprüfung abgeschlossen"
    },

    fr:{
      title:"Compte et sécurité",
      secure:"Contexte de navigation sécurisé",
      insecure:"La sécurité de la connexion n’a pas pu être confirmée",
      storage:"Stockage local disponible",
      storageOff:"Stockage local indisponible",
      session:"État de la session",
      active:"Active",
      unknown:"Inconnu",
      language:"Langue actuelle",
      privacy:"Confidentialité",
      privacyText:"HEGEVA stocke certains paramètres de l’espace de travail localement dans ce navigateur. Ne stockez pas de mots de passe, de jetons API ou de secrets sensibles dans les notes ou les champs de chat.",
      logout:"Se déconnecter",
      refresh:"Actualiser le contrôle de sécurité",
      checked:"Contrôle de sécurité terminé"
    },

    es:{
      title:"Cuenta y seguridad",
      secure:"Contexto de navegación seguro",
      insecure:"No se pudo confirmar la seguridad de la conexión",
      storage:"Almacenamiento local disponible",
      storageOff:"Almacenamiento local no disponible",
      session:"Estado de la sesión",
      active:"Activa",
      unknown:"Desconocido",
      language:"Idioma actual",
      privacy:"Privacidad",
      privacyText:"HEGEVA guarda algunas preferencias del espacio de trabajo localmente en este navegador. No guardes contraseñas, tokens API ni secretos sensibles en notas o campos de chat.",
      logout:"Cerrar sesión",
      refresh:"Actualizar comprobación de seguridad",
      checked:"Comprobación de seguridad completada"
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

  function localStorageAvailable(){
    try{
      const key = "__hegeva_security_test__";
      localStorage.setItem(key,"1");
      localStorage.removeItem(key);
      return true;
    }catch(_error){
      return false;
    }
  }

  function secureContext(){
    return Boolean(
      window.isSecureContext ||
      location.protocol === "https:"
    );
  }

  function sessionState(){
    const possible = [
      document.querySelector("[data-user-email]"),
      document.querySelector("[data-auth-user]"),
      document.querySelector(".user-menu"),
      document.querySelector("[data-user-menu]")
    ];

    return possible.some(Boolean)
      ? "active"
      : "unknown";
  }

  function findLogoutButton(){
    return (
      document.querySelector(
        '[data-action="logout"],[data-action="signout"],#logoutButton,#signOutButton'
      ) ||
      [...document.querySelectorAll("button,a")]
        .find(el => {
          const value =
            String(el.textContent || "")
              .toLowerCase();

          return (
            value.includes("logout") ||
            value.includes("log out") ||
            value.includes("kijelentkez") ||
            value.includes("abmelden") ||
            value.includes("déconnect") ||
            value.includes("cerrar sesión")
          );
        })
    );
  }

  function installStyle(){
    if(document.getElementById("v3540SecurityStyle")) return;

    const style =
      document.createElement("style");

    style.id =
      "v3540SecurityStyle";

    style.textContent = `
      #v3540Security{
        margin:14px 0;
        padding:14px;
        border:1px solid rgba(212,175,55,.24);
        border-radius:16px;
        background:rgba(13,24,42,.78);
      }

      #v3540Security h3{
        margin:0 0 12px;
        font-size:16px;
      }

      .v3540-security-grid{
        display:grid;
        grid-template-columns:
          repeat(2,minmax(0,1fr));
        gap:9px;
      }

      .v3540-security-card{
        padding:10px;
        border-radius:11px;
        border:1px solid rgba(255,255,255,.08);
        background:rgba(255,255,255,.025);
      }

      .v3540-security-label{
        display:block;
        font-size:11px;
        opacity:.65;
        margin-bottom:4px;
      }

      .v3540-security-value{
        font-size:13px;
        font-weight:700;
      }

      #v3540SecurityPrivacy{
        margin-top:10px;
        padding:10px;
        border-radius:11px;
        background:rgba(255,255,255,.025);
        font-size:11px;
        line-height:1.5;
        opacity:.78;
      }

      #v3540SecurityActions{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:10px;
      }

      .v3540-security-btn{
        min-height:36px;
        padding:7px 12px;
        border-radius:10px;
        border:1px solid rgba(212,175,55,.32);
        background:rgba(27,43,70,.92);
        color:inherit;
        cursor:pointer;
        font:inherit;
        font-weight:700;
      }

      #v3540SecurityStatus{
        margin-top:8px;
        font-size:11px;
        opacity:.7;
      }

      @media(max-width:720px){
        .v3540-security-grid{
          grid-template-columns:1fr;
        }

        #v3540SecurityActions{
          display:grid;
          grid-template-columns:1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createUI(){
    if(document.getElementById("v3540Security")) return;

    const anchor =
      document.getElementById("v3540Workspace") ||
      document.getElementById("aiChatInput");

    if(!anchor) return;

    const section =
      document.createElement("section");

    section.id =
      "v3540Security";

    section.innerHTML = `
      <h3 id="v3540SecurityTitle"></h3>

      <div class="v3540-security-grid">

        <div class="v3540-security-card">
          <span
            id="v3540SecurityConnectionLabel"
            class="v3540-security-label"
          ></span>
          <span
            id="v3540SecurityConnection"
            class="v3540-security-value"
          ></span>
        </div>

        <div class="v3540-security-card">
          <span
            id="v3540SecurityStorageLabel"
            class="v3540-security-label"
          ></span>
          <span
            id="v3540SecurityStorage"
            class="v3540-security-value"
          ></span>
        </div>

        <div class="v3540-security-card">
          <span
            id="v3540SecuritySessionLabel"
            class="v3540-security-label"
          ></span>
          <span
            id="v3540SecuritySession"
            class="v3540-security-value"
          ></span>
        </div>

        <div class="v3540-security-card">
          <span
            id="v3540SecurityLanguageLabel"
            class="v3540-security-label"
          ></span>
          <span
            id="v3540SecurityLanguage"
            class="v3540-security-value"
          ></span>
        </div>
      </div>

      <div id="v3540SecurityPrivacy"></div>

      <div id="v3540SecurityActions">
        <button
          id="v3540SecurityRefresh"
          class="v3540-security-btn"
          type="button"
        ></button>

        <button
          id="v3540SecurityLogout"
          class="v3540-security-btn"
          type="button"
          hidden
        ></button>
      </div>

      <div id="v3540SecurityStatus"></div>
    `;

    anchor.insertAdjacentElement(
      "afterend",
      section
    );

    document
      .getElementById("v3540SecurityRefresh")
      ?.addEventListener(
        "click",
        refresh
      );

    document
      .getElementById("v3540SecurityLogout")
      ?.addEventListener(
        "click",
        () => {
          const original =
            findLogoutButton();

          if(
            original &&
            original !==
            document.getElementById("v3540SecurityLogout")
          ){
            original.click();
          }
        }
      );

    translate();
    refresh();
  }

  function refresh(){
    const t = text();

    const connection =
      document.getElementById("v3540SecurityConnection");

    const storage =
      document.getElementById("v3540SecurityStorage");

    const session =
      document.getElementById("v3540SecuritySession");

    const lang =
      document.getElementById("v3540SecurityLanguage");

    const status =
      document.getElementById("v3540SecurityStatus");

    const logout =
      document.getElementById("v3540SecurityLogout");

    if(connection){
      connection.textContent =
        secureContext()
          ? "✓ " + t.secure
          : "⚠ " + t.insecure;
    }

    if(storage){
      storage.textContent =
        localStorageAvailable()
          ? "✓ " + t.storage
          : "⚠ " + t.storageOff;
    }

    if(session){
      session.textContent =
        sessionState() === "active"
          ? "✓ " + t.active
          : "• " + t.unknown;
    }

    if(lang){
      lang.textContent =
        language().toUpperCase();
    }

    const originalLogout =
      findLogoutButton();

    if(logout){
      logout.hidden =
        !originalLogout;
    }

    if(status){
      status.textContent =
        "✓ " + t.checked;
    }
  }

  function translate(){
    const t = text();

    const title =
      document.getElementById("v3540SecurityTitle");

    const connectionLabel =
      document.getElementById("v3540SecurityConnectionLabel");

    const storageLabel =
      document.getElementById("v3540SecurityStorageLabel");

    const sessionLabel =
      document.getElementById("v3540SecuritySessionLabel");

    const languageLabel =
      document.getElementById("v3540SecurityLanguageLabel");

    const privacy =
      document.getElementById("v3540SecurityPrivacy");

    const refreshButton =
      document.getElementById("v3540SecurityRefresh");

    const logout =
      document.getElementById("v3540SecurityLogout");

    if(title){
      title.textContent =
        "🛡️ " + t.title;
    }

    if(connectionLabel){
      connectionLabel.textContent =
        "HTTPS";
    }

    if(storageLabel){
      storageLabel.textContent =
        "Local Storage";
    }

    if(sessionLabel){
      sessionLabel.textContent =
        t.session;
    }

    if(languageLabel){
      languageLabel.textContent =
        t.language;
    }

    if(privacy){
      privacy.textContent =
        `🔐 ${t.privacy}: ${t.privacyText}`;
    }

    if(refreshButton){
      refreshButton.textContent =
        "↻ " + t.refresh;
    }

    if(logout){
      logout.textContent =
        "↪ " + t.logout;
    }

    refresh();
  }

  function boot(){
    installStyle();

    let attempts = 0;

    const start = () => {
      attempts += 1;

      createUI();
      translate();

      if(
        !document.getElementById("v3540Security") &&
        attempts < 80
      ){
        setTimeout(
          start,
          100
        );
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
            60
          );
        }
      );

    window.hegevaV3540Security = {
      version:VERSION,
      module:MODULE,
      secureContextCheck:true,
      localStorageCheck:true,
      sessionIndicator:true,
      privacyNotice:true,
      logoutHelper:true,
      fiveLanguages:true,
      localOnly:true,
      changesAuthentication:false,
      changesAIBackend:false,
      changesStripe:false,
      changesBilling:false
    };

    console.log(
      "HEGEVA AI V35.4.0 — Account & Security active."
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
