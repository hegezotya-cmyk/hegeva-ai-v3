/* =========================================================
   HEGEVA AI V35.4.0
   MODULE 3/4 — WORKSPACE PRO
   NOTES + AUTOSAVE + STATUS + LOCAL EXPORT
   EN / HU / DE / FR / ES
   LOCAL ONLY — NO EXTRA AI REQUEST
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.0";
  const MODULE = "WORKSPACE_PRO";
  const LANGS = ["en","hu","de","fr","es"];

  const KEYS = {
    notes: "hegeva_v3540_workspace_notes",
    updated: "hegeva_v3540_workspace_updated"
  };

  const TEXT = {
    en:{
      title:"Workspace Pro",
      notes:"Workspace notes",
      placeholder:"Write project notes, tasks or reminders here...",
      save:"Save",
      clear:"Clear",
      export:"Export notes",
      saved:"Saved",
      empty:"Nothing to export yet.",
      updated:"Last updated",
      local:"Stored locally in this browser"
    },
    hu:{
      title:"Workspace Pro",
      notes:"Munkaterület jegyzetek",
      placeholder:"Írj ide projektjegyzeteket, feladatokat vagy emlékeztetőket...",
      save:"Mentés",
      clear:"Törlés",
      export:"Jegyzet exportálása",
      saved:"Mentve",
      empty:"Még nincs mit exportálni.",
      updated:"Utolsó módosítás",
      local:"Helyben, ebben a böngészőben tárolva"
    },
    de:{
      title:"Workspace Pro",
      notes:"Arbeitsbereich-Notizen",
      placeholder:"Projektinformationen, Aufgaben oder Erinnerungen hier eintragen...",
      save:"Speichern",
      clear:"Löschen",
      export:"Notizen exportieren",
      saved:"Gespeichert",
      empty:"Noch nichts zu exportieren.",
      updated:"Zuletzt geändert",
      local:"Lokal in diesem Browser gespeichert"
    },
    fr:{
      title:"Workspace Pro",
      notes:"Notes de l’espace de travail",
      placeholder:"Écrivez ici vos notes de projet, tâches ou rappels...",
      save:"Enregistrer",
      clear:"Effacer",
      export:"Exporter les notes",
      saved:"Enregistré",
      empty:"Rien à exporter pour le moment.",
      updated:"Dernière modification",
      local:"Stocké localement dans ce navigateur"
    },
    es:{
      title:"Workspace Pro",
      notes:"Notas del espacio de trabajo",
      placeholder:"Escribe aquí notas del proyecto, tareas o recordatorios...",
      save:"Guardar",
      clear:"Limpiar",
      export:"Exportar notas",
      saved:"Guardado",
      empty:"Aún no hay nada para exportar.",
      updated:"Última actualización",
      local:"Guardado localmente en este navegador"
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

  function safeGet(key){
    try{
      return localStorage.getItem(key) || "";
    }catch(_error){
      return "";
    }
  }

  function safeSet(key,value){
    try{
      localStorage.setItem(key,value);
      return true;
    }catch(_error){
      return false;
    }
  }

  function safeRemove(key){
    try{
      localStorage.removeItem(key);
    }catch(_error){}
  }

  function nowISO(){
    return new Date().toISOString();
  }

  function installStyle(){
    if(document.getElementById("v3540WorkspaceStyle")) return;

    const style = document.createElement("style");
    style.id = "v3540WorkspaceStyle";

    style.textContent = `
      #v3540Workspace{
        margin:14px 0;
        padding:14px;
        border:1px solid rgba(212,175,55,.24);
        border-radius:16px;
        background:rgba(14,26,45,.78);
      }

      #v3540WorkspaceHeader{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:10px;
      }

      #v3540WorkspaceTitle{
        margin:0;
        font-size:16px;
      }

      #v3540WorkspaceBadge{
        font-size:11px;
        opacity:.7;
      }

      #v3540WorkspaceNotes{
        width:100%;
        min-height:120px;
        resize:vertical;
        border:1px solid rgba(212,175,55,.30);
        border-radius:11px;
        background:rgba(8,15,27,.94);
        color:inherit;
        padding:11px;
        font:inherit;
        box-sizing:border-box;
      }

      #v3540WorkspaceActions{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:9px;
      }

      .v3540-workspace-btn{
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

      #v3540WorkspaceSave{
        background:linear-gradient(
          135deg,
          #f6c952,
          #ffd979
        );
        color:#111827;
      }

      #v3540WorkspaceMeta{
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        margin-top:9px;
        font-size:11px;
        opacity:.68;
      }

      @media(max-width:720px){
        #v3540WorkspaceHeader{
          align-items:flex-start;
          flex-direction:column;
        }

        #v3540WorkspaceActions{
          display:grid;
          grid-template-columns:1fr;
        }

        .v3540-workspace-btn{
          width:100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createUI(){
    if(document.getElementById("v3540Workspace")) return;

    const anchor =
      document.getElementById("savedChatsList") ||
      document.getElementById("aiChatInput");

    if(!anchor) return;

    const section = document.createElement("section");
    section.id = "v3540Workspace";

    section.innerHTML = `
      <div id="v3540WorkspaceHeader">
        <h3 id="v3540WorkspaceTitle"></h3>
        <span id="v3540WorkspaceBadge"></span>
      </div>

      <label
        id="v3540WorkspaceLabel"
        for="v3540WorkspaceNotes"
      ></label>

      <textarea
        id="v3540WorkspaceNotes"
        spellcheck="true"
      ></textarea>

      <div id="v3540WorkspaceActions">
        <button
          id="v3540WorkspaceSave"
          class="v3540-workspace-btn"
          type="button"
        ></button>

        <button
          id="v3540WorkspaceExport"
          class="v3540-workspace-btn"
          type="button"
        ></button>

        <button
          id="v3540WorkspaceClear"
          class="v3540-workspace-btn"
          type="button"
        ></button>
      </div>

      <div id="v3540WorkspaceMeta">
        <span id="v3540WorkspaceUpdated"></span>
        <span id="v3540WorkspaceLocal"></span>
      </div>
    `;

    const parent =
      anchor.closest("section") ||
      anchor.parentElement;

    parent?.insertAdjacentElement(
      "afterend",
      section
    );

    const notes =
      document.getElementById("v3540WorkspaceNotes");

    if(notes){
      notes.value = safeGet(KEYS.notes);

      let timer = null;

      notes.addEventListener("input",() => {
        clearTimeout(timer);

        timer = setTimeout(
          saveNotes,
          450
        );
      });
    }

    document
      .getElementById("v3540WorkspaceSave")
      ?.addEventListener("click",saveNotes);

    document
      .getElementById("v3540WorkspaceClear")
      ?.addEventListener("click",clearNotes);

    document
      .getElementById("v3540WorkspaceExport")
      ?.addEventListener("click",exportNotes);

    translate();
    updateMeta();
  }

  function saveNotes(){
    const notes =
      document.getElementById("v3540WorkspaceNotes");

    if(!notes) return;

    const value = notes.value || "";

    safeSet(KEYS.notes,value);
    safeSet(KEYS.updated,nowISO());

    const badge =
      document.getElementById("v3540WorkspaceBadge");

    if(badge){
      badge.textContent = "✓ " + text().saved;
    }

    updateMeta();
  }

  function clearNotes(){
    const notes =
      document.getElementById("v3540WorkspaceNotes");

    if(notes){
      notes.value = "";
      notes.focus();
    }

    safeRemove(KEYS.notes);
    safeRemove(KEYS.updated);

    updateMeta();
  }

  function exportNotes(){
    const value =
      String(
        document.getElementById("v3540WorkspaceNotes")
          ?.value || ""
      ).trim();

    if(!value){
      const badge =
        document.getElementById("v3540WorkspaceBadge");

      if(badge){
        badge.textContent = text().empty;
      }

      return;
    }

    const blob = new Blob(
      [value],
      {
        type:"text/plain;charset=utf-8"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    const date =
      new Date()
        .toISOString()
        .slice(0,10);

    a.href = url;
    a.download =
      `hegeva-workspace-${date}.txt`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      500
    );
  }

  function updateMeta(){
    const updated =
      document.getElementById("v3540WorkspaceUpdated");

    const local =
      document.getElementById("v3540WorkspaceLocal");

    const stored =
      safeGet(KEYS.updated);

    if(updated){
      if(stored){
        const date =
          new Date(stored);

        updated.textContent =
          `${text().updated}: ${
            Number.isNaN(date.getTime())
              ? "-"
              : date.toLocaleString(language())
          }`;
      }else{
        updated.textContent =
          `${text().updated}: -`;
      }
    }

    if(local){
      local.textContent =
        "💾 " + text().local;
    }
  }

  function translate(){
    const t = text();

    const title =
      document.getElementById("v3540WorkspaceTitle");

    const badge =
      document.getElementById("v3540WorkspaceBadge");

    const label =
      document.getElementById("v3540WorkspaceLabel");

    const notes =
      document.getElementById("v3540WorkspaceNotes");

    const save =
      document.getElementById("v3540WorkspaceSave");

    const clear =
      document.getElementById("v3540WorkspaceClear");

    const exportButton =
      document.getElementById("v3540WorkspaceExport");

    if(title) title.textContent = "🗂️ " + t.title;
    if(badge) badge.textContent = "";
    if(label) label.textContent = t.notes;

    if(notes){
      notes.placeholder = t.placeholder;
      notes.setAttribute("lang",language());
    }

    if(save) save.textContent = "💾 " + t.save;
    if(clear) clear.textContent = "× " + t.clear;
    if(exportButton) exportButton.textContent = "⬇ " + t.export;

    updateMeta();
  }

  function boot(){
    installStyle();

    let attempts = 0;

    const start = () => {
      attempts += 1;

      createUI();
      translate();

      if(
        !document.getElementById("v3540Workspace") &&
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
        () => setTimeout(translate,60)
      );

    window.hegevaV3540Workspace = {
      version:VERSION,
      module:MODULE,
      notes:true,
      autosave:true,
      localStorage:true,
      localExport:true,
      lastUpdated:true,
      fiveLanguages:true,
      extraAiRequest:false,
      changesAIBackend:false,
      changesStripe:false,
      changesBilling:false,
      changesAuthentication:false
    };

    console.log(
      "HEGEVA AI V35.4.0 — Workspace Pro active."
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
