/* OneMuslim My Profile cleanup — preserve the real editable card and the public visited-profile card. */
(function(){
  'use strict';
  function removeLegacySummary(panel){
    const legacyMarkers=['Tell the community a little about yourself.','Profile XP','PRIVATE PROFILE'];
    const candidates=[...panel.querySelectorAll('*')].filter(el=>{
      if(el.closest('.om-my-profile-card,.om-viewed-profile-card'))return false;
      const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
      return legacyMarkers.some(marker=>text.includes(marker));
    });
    const removed=new Set();
    candidates.forEach(node=>{
      let owner=node;while(owner.parentElement&&owner.parentElement!==panel)owner=owner.parentElement;
      if(owner!==panel&&!owner.classList.contains('om-my-profile-card')&&!owner.classList.contains('om-viewed-profile-card')&&!removed.has(owner)){owner.remove();removed.add(owner)}
    });
  }
  function cleanup(){
    const page=document.getElementById('profilePage'),panel=document.getElementById('profilePanel');
    if(!page||!panel)return;
    if(page.classList.contains('om-viewed-profile-page'))return;
    page.querySelectorAll(':scope > .page-head').forEach(el=>el.remove());
    panel.querySelectorAll(':scope > *').forEach(el=>{if(!el.classList.contains('om-my-profile-card')&&!el.classList.contains('om-viewed-profile-card'))el.remove()});
    removeLegacySummary(panel);
  }
  function init(){cleanup();const page=document.getElementById('profilePage');if(!page)return;if(!page.dataset.omProfileCleanupV8){page.dataset.omProfileCleanupV8='1';new MutationObserver(cleanup).observe(page,{childList:true,subtree:true})}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.OneMuslimProfilePageCleanup={render:cleanup};
})();
