/* =========================================================
   HEGEVA AI V35.4.3
   CLOUD WORKSPACE SYNC REPAIR
   REUSES EXISTING V46 D1 WORKSPACE API
   LOCAL STORAGE = CACHE / FALLBACK
   D1 = CLOUD COPY FOR AUTHENTICATED USERS
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.3";

  const WORKSPACE_KEYS = [
    "hegeva_v3540_workspace_notes",
    "hegeva_v3540_workspace_updated"
  ];

  function loggedIn(){
    return Boolean(
      window.hegevaCurrentUser ||
      window.currentUser ||
      document.body?.dataset?.authenticated === "true"
    );
  }

  async function put(type,data){
    try{
      const response = await fetch(
        `/api/workspace/${encodeURIComponent(type)}`,
        {
          method:"PUT",
          credentials:"include",
          headers:{
            "Content-Type":"application/json",
            "Accept":"application/json"
          },
          body:JSON.stringify({data})
        }
      );

      if(response.status === 401) return false;

      if(!response.ok){
        throw new Error(`HTTP ${response.status}`);
      }

      return true;
    }catch(error){
      console.warn(
        `HEGEVA ${type} cloud save failed`,
        error
      );
      return false;
    }
  }

  async function get(type){
    try{
      const response = await fetch(
        `/api/workspace/${encodeURIComponent(type)}`,
        {
          method:"GET",
          credentials:"include",
          headers:{
            "Accept":"application/json"
          }
        }
      );

      if(response.status === 401) return null;

      if(!response.ok){
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      return result?.found
        ? result.data
        : null;

    }catch(error){
      console.warn(
        `HEGEVA ${type} cloud load failed`,
        error
      );
      return null;
    }
  }

  function workspaceLocalData(){
    const data = {};

    WORKSPACE_KEYS.forEach(key => {
      try{
        data[key] =
          localStorage.getItem(key);
      }catch(_error){}
    });

    return data;
  }

  async function saveWorkspace(){
    return put(
      "workspace_pro",
      workspaceLocalData()
    );
  }

  async function restoreWorkspace(){
    const cloud =
      await get("workspace_pro");

    if(
      !cloud ||
      typeof cloud !== "object"
    ){
      return false;
    }

    WORKSPACE_KEYS.forEach(key => {
      if(
        Object.prototype
          .hasOwnProperty.call(
            cloud,
            key
          )
      ){
        try{
          const value = cloud[key];

          if(value === null){
            localStorage.removeItem(key);
          }else{
            localStorage.setItem(
              key,
              String(value)
            );
          }
        }catch(_error){}
      }
    });

    const notes =
      document.getElementById(
        "v3540WorkspaceNotes"
      );

    if(notes){
      try{
        notes.value =
          localStorage.getItem(
            "hegeva_v3540_workspace_notes"
          ) || "";
      }catch(_error){}
    }

    window.hegevaV3540Workspace
      ?.refresh?.();

    return true;
  }

  function saveBusinessTools(){
    if(
      typeof window.v46SaveBucket ===
      "function"
    ){
      return window.v46SaveBucket(
        "business_tools"
      );
    }

    return false;
  }

  function bindBusinessTools(){
    const ids = [
      "btSaveDoc",
      "btAddClient"
    ];

    ids.forEach(id => {
      const button =
        document.getElementById(id);

      if(
        !button ||
        button.dataset
          .v3543CloudBound === "true"
      ){
        return;
      }

      button.dataset
        .v3543CloudBound = "true";

      button.addEventListener(
        "click",
        () => {
          setTimeout(
            saveBusinessTools,
            120
          );
        }
      );
    });
  }

  function bindWorkspace(){
    const save =
      document.getElementById(
        "v3540WorkspaceSave"
      );

    const clear =
      document.getElementById(
        "v3540WorkspaceClear"
      );

    if(
      save &&
      save.dataset
        .v3543CloudBound !== "true"
    ){
      save.dataset
        .v3543CloudBound = "true";

      save.addEventListener(
        "click",
        () => {
          setTimeout(
            saveWorkspace,
            100
          );
        }
      );
    }

    if(
      clear &&
      clear.dataset
        .v3543CloudBound !== "true"
    ){
      clear.dataset
        .v3543CloudBound = "true";

      clear.addEventListener(
        "click",
        () => {
          setTimeout(
            saveWorkspace,
            100
          );
        }
      );
    }
  }

  async function boot(){
    bindBusinessTools();
    bindWorkspace();

    // Some HEGEVA modules render their controls after DOMContentLoaded.
    // Retry binding for a short, finite period without MutationObserver loops.
    let bindAttempts = 0;

    const bindTimer = setInterval(() => {
      bindAttempts += 1;

      bindBusinessTools();
      bindWorkspace();

      const workspaceReady =
        document.getElementById("v3540WorkspaceSave");

      const businessReady =
        document.getElementById("btSaveDoc");

      if(
        (workspaceReady && businessReady) ||
        bindAttempts >= 20
      ){
        clearInterval(bindTimer);
      }
    }, 250);

    // Allow Workspace Pro to finish rendering before cloud restore.
    setTimeout(
      () => restoreWorkspace(),
      700
    );

    window.hegevaV3543CloudSyncRepair = {
      version:VERSION,
      workspacePro:true,
      businessTools:true,
      d1Workspace:true,
      localCache:true,
      saveWorkspace,
      restoreWorkspace,
      saveBusinessTools,
      changesAIBackend:false,
      changesStripe:false,
      changesBilling:false
    };

    console.log(
      "HEGEVA AI V35.4.3 Cloud Sync Repair active."
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
