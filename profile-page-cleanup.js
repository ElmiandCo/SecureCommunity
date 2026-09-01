/* OneMuslim My Profile cleanup — removes the redundant summary above the tabbed profile UI. */
(function(){
  'use strict';
  const REDUNDANT_SELECTORS=[
    '#profilePanel > .profile-hero',
    '#profilePanel > .private-tag',
    '#profilePanel > .profile-meta',
    '#profilePanel > .profile-xp-progress',
    '#profilePanel > #editProfile'
  ];
  function cleanup(){
    const panel=document.getElementById('profilePanel');
    if(!panel)return;
    REDUNDANT_SELECTORS.forEach(selector=>panel.querySelectorAll(selector).forEach(el=>el.remove()));
    panel.querySelectorAll(':scope > p').forEach(el=>el.remove());
  }
  function init(){
    cleanup();
    const panel=document.getElementById('profilePanel');
    if(panel&&!panel.dataset.omProfileCleanupV2){
      panel.dataset.omProfileCleanupV2='1';
      new MutationObserver(cleanup).observe(panel,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.OneMuslimProfilePageCleanup={render:cleanup};
})();
