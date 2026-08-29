/* OneMuslim Profile Builder launcher.
   app.js historically replaces #editProfile.onclick with the legacy editor.
   This keeps the existing Profile Builder as the single owner of that button. */
(function(){
  'use strict';

  function handoffToBuilder(){
    const button=document.getElementById('editProfile');
    if(!button || button.dataset.omBuilderForced==='1') return;

    const replacement=button.cloneNode(true);
    replacement.removeAttribute('data-pbv5');
    replacement.dataset.omBuilderForced='1';
    button.replaceWith(replacement);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',handoffToBuilder);
  }else{
    handoffToBuilder();
  }

  new MutationObserver(handoffToBuilder).observe(document.body,{childList:true,subtree:true});
})();
