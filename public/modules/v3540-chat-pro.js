/* =========================================================
   HEGEVA AI V35.4.0
   MODULE 1/4 — AI CHAT PRO
   UX + STATE + SAFETY + STABILITY
   EN / HU / DE / FR / ES
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.0";
  const MODULE = "AI_CHAT_PRO";
  const LANGS = ["en","hu","de","fr","es"];

  const TEXT = {
    en:{
      stop:"Stop",
      retry:"Try again",
      copied:"Copied",
      copy:"Copy",
      sending:"HEGEVA is thinking…",
      ready:"Ready",
      empty:"Write a message first.",
      error:"Something went wrong. Please try again."
    },
    hu:{
      stop:"Leállítás",
      retry:"Próbáld újra",
      copied:"Másolva",
      copy:"Másolás",
      sending:"A HEGEVA gondolkodik…",
      ready:"Kész",
      empty:"Először írj egy üzenetet.",
      error:"Valami hiba történt. Próbáld újra."
    },
    de:{
      stop:"Stoppen",
      retry:"Erneut versuchen",
      copied:"Kopiert",
      copy:"Kopieren",
      sending:"HEGEVA denkt nach…",
      ready:"Bereit",
      empty:"Schreibe zuerst eine Nachricht.",
      error:"Etwas ist schiefgelaufen. Bitte erneut versuchen."
    },
    fr:{
      stop:"Arrêter",
      retry:"Réessayer",
      copied:"Copié",
      copy:"Copier",
      sending:"HEGEVA réfléchit…",
      ready:"Prêt",
      empty:"Écrivez d’abord un message.",
      error:"Une erreur s’est produite. Veuillez réessayer."
    },
    es:{
      stop:"Detener",
      retry:"Intentar de nuevo",
      copied:"Copiado",
      copy:"Copiar",
      sending:"HEGEVA está pensando…",
      ready:"Listo",
      empty:"Escribe primero un mensaje.",
      error:"Algo salió mal. Inténtalo de nuevo."
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

  function input(){
    return (
      document.getElementById("aiChatInput") ||
      document.querySelector(
        'textarea[name="message"], textarea[data-ai-chat-input]'
      )
    );
  }

  function messages(){
    return (
      document.getElementById("aiChatMessages") ||
      document.querySelector("[data-ai-chat-messages]")
    );
  }

  function statusElement(){
    return (
      document.getElementById("aiChatStatus") ||
      document.querySelector("[data-ai-chat-status]")
    );
  }

  function setStatus(value){
    const el = statusElement();
    if(el) el.textContent = value;
  }

  function installStyles(){
    if(document.getElementById("v3540ChatProStyle")) return;

    const style = document.createElement("style");
    style.id = "v3540ChatProStyle";

    style.textContent = `
      #v3540ChatProBar{
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:7px;
        margin:8px 0;
      }

      .v3540-chat-btn{
        border:1px solid rgba(212,175,55,.30);
        background:rgba(18,29,49,.92);
        color:inherit;
        min-height:34px;
        padding:6px 11px;
        border-radius:9px;
        cursor:pointer;
        font:inherit;
        font-size:12px;
        font-weight:700;
      }

      .v3540-chat-btn:hover{
        border-color:rgba(244,197,66,.72);
      }

      #v3540ChatProState{
        margin-left:auto;
        font-size:11px;
        opacity:.72;
      }

      #aiChatInput[data-v3540-busy="true"]{
        opacity:.78;
      }

      @media(max-width:720px){
        #v3540ChatProBar{
          display:grid;
          grid-template-columns:1fr 1fr;
        }

        #v3540ChatProState{
          grid-column:1/-1;
          margin-left:0;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureToolbar(){
    if(document.getElementById("v3540ChatProBar")) return;

    const field = input();
    if(!field) return;

    const bar = document.createElement("div");
    bar.id = "v3540ChatProBar";

    const retry = document.createElement("button");
    retry.type = "button";
    retry.id = "v3540Retry";
    retry.className = "v3540-chat-btn";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.id = "v3540CopyLast";
    copy.className = "v3540-chat-btn";

    const state = document.createElement("span");
    state.id = "v3540ChatProState";

    retry.addEventListener("click", retryLast);
    copy.addEventListener("click", copyLast);

    bar.append(retry, copy, state);

    field.insertAdjacentElement("afterend", bar);

    translate();
  }

  function lastUserMessage(){
    const wrap = messages();
    if(!wrap) return "";

    const candidates = [
      ...wrap.querySelectorAll(
        '.user-message,[data-role="user"],.message.user'
      )
    ];

    return String(
      candidates.at(-1)?.textContent || ""
    ).trim();
  }

  function lastAssistantMessage(){
    const wrap = messages();
    if(!wrap) return null;

    const candidates = [
      ...wrap.querySelectorAll(
        '.assistant-message,[data-role="assistant"],.message.assistant,.coming-item'
      )
    ];

    return candidates.at(-1) || null;
  }

  function retryLast(){
    const field = input();
    if(!field) return;

    const previous = lastUserMessage();

    if(!previous){
      setStatus(text().empty);
      return;
    }

    field.value = previous;
    field.dispatchEvent(
      new Event("input",{bubbles:true})
    );

    field.focus();
  }

  async function copyLast(){
    const answer = lastAssistantMessage();
    const value = String(answer?.textContent || "").trim();

    if(!value) return;

    try{
      await navigator.clipboard.writeText(value);
      const button = document.getElementById("v3540CopyLast");

      if(button){
        button.textContent = "✓ " + text().copied;
        setTimeout(translate,1200);
      }
    }catch(_error){
      /* Existing HEGEVA copy controls remain available. */
    }
  }

  function translate(){
    const t = text();

    const retry = document.getElementById("v3540Retry");
    const copy = document.getElementById("v3540CopyLast");
    const state = document.getElementById("v3540ChatProState");

    if(retry) retry.textContent = "↻ " + t.retry;
    if(copy) copy.textContent = "📋 " + t.copy;
    if(state) state.textContent = "✓ " + t.ready;

    const field = input();
    if(field) field.setAttribute("lang",language());
  }

  function watchChat(){
    const wrap = messages();

    if(!wrap || wrap.dataset.v3540Observed === "true") return;

    wrap.dataset.v3540Observed = "true";

    let scheduled = false;

    const refreshState = () => {
      scheduled = false;

      const field = input();

      if(field){
        field.dataset.v3540Busy = "false";
      }

      const state = document.getElementById("v3540ChatProState");
      if(state) state.textContent = "✓ " + text().ready;
    };

    new MutationObserver(() => {
      if(scheduled) return;
      scheduled = true;
      requestAnimationFrame(refreshState);
    }).observe(wrap,{
      childList:true,
      subtree:true
    });
  }

  function keyboard(){
    const field = input();

    if(!field || field.dataset.v3540Keyboard === "true") return;

    field.dataset.v3540Keyboard = "true";

    field.addEventListener("keydown",event => {
      if(
        event.key === "Escape" &&
        field.value
      ){
        field.blur();
      }
    });
  }

  function boot(){
    installStyles();

    // Core chat elements already exist by DOMContentLoaded.
    // Avoid the old 80 x 100ms startup polling loop.
    ensureToolbar();
    watchChat();
    keyboard();
    translate();

    document
      .getElementById("languageSelect")
      ?.addEventListener("change",() => {
        setTimeout(translate,60);
      });

    window.hegevaV3540ChatPro = {
      version:VERSION,
      module:MODULE,
      retryLast:true,
      copyLast:true,
      keyboardUX:true,
      languageAware:true,
      localEnhancement:true,
      finiteStartup:true,
      observerCoalesced:true,
      extraAiRequest:false,
      changesAIBackend:false,
      changesBilling:false,
      changesStripe:false,
      changesAuthentication:false
    };

    console.log(
      "HEGEVA AI V35.4.0 — AI Chat Pro active."
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
