/* OneMuslim Profile Landing — opens the profile editor after authentication. */
(function(){
  'use strict';
  let opened = false;
  function tryOpen(){
    const app = document.getElementById('appView');
    if(!app || app.classList.contains('hidden') || opened) return;
    if(typeof window.OneMuslimOpenProfileEditor !== 'function') return;
    opened = true;
    window.OneMuslimOpenProfileEditor();
  }
  function init(){
    tryOpen();
    setTimeout(tryOpen, 350);
    setTimeout(tryOpen, 900);
    setTimeout(tryOpen, 1600);
    new MutationObserver(tryOpen).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();