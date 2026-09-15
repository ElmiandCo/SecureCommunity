/* OneMuslim My Profile cleanup — TEMPORARY IDENTIFICATION TEST. */
(function(){
  'use strict';
  const legacyMarkers=['Tell the community a little about yourself.','Profile XP','PRIVATE PROFILE'];
  function isLegacy(el){const text=String(el.textContent||'').replace(/\s+/g,' ').trim();return legacyMarkers.some(marker=>text.includes(marker));}
  function markLegacy(el){if(el.dataset.omLegacyTestMarker)return;const marker=document.createElement('div');marker.dataset.omLegacyTestMarker='1';marker.textContent='👍 TEST — THIS IS THE SECTION';marker.style.cssText='display:block!important;margin:12px 0!important;padding:10px 14px!important;border:2px solid #c89d3c!important;border-radius:12px!important;background:#fff8e8!important;color:#18392f!important;font:800 14px/1.2 Arial,sans-serif!important;text-align:center!important;position:relative!important;z-index:99999!important;';el.insertBefore(marker,el.firstChild);el.dataset.omLegacyTestMarker='1';}
  function cleanup(){
    const page=document.getElementById('profilePage'),panel=document.getElementById('profilePanel');
    if(!page||!panel)return;
    if(page.classList.contains('om-viewed-profile-page'))return;
    page.querySelectorAll(':scope > .page-head').forEach(el=>el.remove());
    panel.querySelectorAll(':scope > *').forEach(el=>{
      if(el.classList.contains('om-my-profile-card')||el.classList.contains('om-viewed-profile-card'))return;
      if(isLegacy(el))markLegacy(el); else el.remove();
    });
  }
  function init(){cleanup();const page=document.getElementById('profilePage');if(!page)return;if(!page.dataset.omProfileCleanupTestV1){page.dataset.omProfileCleanupTestV1='1';new MutationObserver(cleanup).observe(page,{childList:true,subtree:true})}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.OneMuslimProfilePageCleanup={render:cleanup};
})();
