/* Open a legacy ?community=... URL inside the authenticated OneMuslim shell. */
(function(){
  'use strict';
  function boot(){
    const key=new URLSearchParams(location.search).get('community');
    if(!key||!window.OneMuslimCommunities)return;
    let tries=0;
    const run=()=>{tries++;const app=document.getElementById('appView');if(app&&!app.classList.contains('hidden')){window.OneMuslimCommunities.show(key);return}if(tries<60)setTimeout(run,150)};
    run();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
