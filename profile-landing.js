/* OneMuslim Profile Landing — authenticated users land in the full profile editor. */
(function(){
  'use strict';
  let opened=false;
  function tryOpen(){
    const app=document.getElementById('appView');
    if(!app||app.classList.contains('hidden')||opened)return;
    if(typeof window.OneMuslimOpenProfileEditor!=='function')return;
    if(!window.profile)return;
    const profileButton=document.querySelector('#appView [data-page="profile"]');
    if(profileButton)profileButton.click();
    opened=true;
    window.OneMuslimOpenProfileEditor();
  }
  function init(){
    tryOpen();
    [250,600,1200,2000,3500].forEach(ms=>setTimeout(tryOpen,ms));
    new MutationObserver(tryOpen).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();