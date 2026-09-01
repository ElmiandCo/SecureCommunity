/* OneMuslim My Profile cleanup — keep only the saved/tabbed profile card. */
(function(){
  'use strict';

  function cleanup(){
    const panel=document.getElementById('profilePanel');
    if(!panel)return;

    // The legacy profile summary is rendered directly into #profilePanel by app.js.
    // The real My Profile presentation is .om-my-profile-card from profile-view.js.
    // Keep that card and remove every other top-level element.
    panel.querySelectorAll(':scope > *').forEach(el=>{
      if(!el.classList.contains('om-my-profile-card')) el.remove();
    });
  }

  function init(){
    cleanup();
    const panel=document.getElementById('profilePanel');
    if(panel&&!panel.dataset.omProfileCleanupV3){
      panel.dataset.omProfileCleanupV3='1';
      new MutationObserver(cleanup).observe(panel,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.OneMuslimProfilePageCleanup={render:cleanup};
})();
