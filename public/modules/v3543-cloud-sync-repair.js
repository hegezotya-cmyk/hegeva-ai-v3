/* =========================================================
   HEGEVA AI V35.4.3
   CLOUD SYNC REPAIR
   BUSINESS TOOLS ONLY
   WORKSPACE PRO USES ITS OWN /api/workspace/notes SYNC
   ========================================================= */

(() => {
  "use strict";

  const VERSION = "V35.4.3";

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

    let bound = 0;

    ids.forEach(id => {
      const button =
        document.getElementById(id);

      if(!button) return;

      if(
        button.dataset.v3543CloudBound ===
        "true"
      ){
        bound += 1;
        return;
      }

      button.dataset.v3543CloudBound =
        "true";

      button.addEventListener(
        "click",
        () => {
          setTimeout(
            saveBusinessTools,
            120
          );
        }
      );

      bound += 1;
    });

    return bound;
  }

  function boot(){
    let attempts = 0;

    const bind = () => {
      attempts += 1;

      const bound =
        bindBusinessTools();

      if(
        bound >= 2 ||
        attempts >= 12
      ){
        return;
      }

      setTimeout(bind,250);
    };

    bind();

    window.hegevaV3543CloudSyncRepair = {
      version:VERSION,
      workspacePro:false,
      workspaceSyncOwner:"v3540-workspace",
      businessTools:true,
      d1Workspace:true,
      localCache:true,
      saveBusinessTools,
      finiteRetry:true,
      duplicateWorkspaceRequests:false,
      changesAIBackend:false,
      changesStripe:false,
      changesBilling:false
    };

    console.log(
      "HEGEVA AI V35.4.3 Cloud Sync Repair active — Workspace duplicate sync removed."
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
