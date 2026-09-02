/* OneMuslim My Profile cleanup — remove the legacy profile summary and keep the real card. */
(function(){
  'use strict';

  function removeLegacySummary(panel){
    const legacyMarkers = [
      'Tell the community a little about yourself.',
      'Profile XP',
      'PRIVATE PROFILE'
    ];

    const candidates = [...panel.querySelectorAll('*')].filter(el => {
      if(el.closest('.om-my-profile-card')) return false;
      const text = String(el.textContent || '').replace(/\s+/g,' ').trim();
      return legacyMarkers.some(marker => text.includes(marker));
    });

    // Remove the smallest top-level panel child containing the legacy summary.
    // This avoids touching the real .om-my-profile-card even if the old summary
    // is nested inside a wrapper created by the legacy profile renderer.
    const removed = new Set();
    candidates.forEach(node => {
      let owner = node;
      while(owner.parentElement && owner.parentElement !== panel){
        owner = owner.parentElement;
      }
      if(owner !== panel && !owner.classList.contains('om-my-profile-card') && !removed.has(owner)){
        owner.remove();
        removed.add(owner);
      }
    });
  }

  function cleanup(){
    const page=document.getElementById('profilePage');
    const panel=document.getElementById('profilePanel');
    if(!page || !panel)return;

    // The My Profile page should contain only the actual saved profile card.
    page.querySelectorAll(':scope > .page-head').forEach(el=>el.remove());

    // Remove legacy direct children that are not the real profile card.
    panel.querySelectorAll(':scope > *').forEach(el=>{
      if(!el.classList.contains('om-my-profile-card')) el.remove();
    });

    // Some older renderers wrap the legacy summary, so also remove it by its
    // unmistakable content markers.
    removeLegacySummary(panel);
  }

  function init(){
    cleanup();
    const page=document.getElementById('profilePage');
    if(!page)return;
    if(!page.dataset.omProfileCleanupV7){
      page.dataset.omProfileCleanupV7='1';
      new MutationObserver(cleanup).observe(page,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.OneMuslimProfilePageCleanup={render:cleanup};
})();
