/* OneMuslim visited-profile Follow compatibility layer. The main follow system owns the button, state, counts, and lists. */
(function(){
'use strict';
function refresh(){
  const id=new URLSearchParams(location.search).get('profile');
  if(id&&window.OneMuslimProfileFollows?.render){
    const card=document.querySelector('#visitedProfilePanel .visited-profile-card');
    if(card)window.OneMuslimProfileFollows.render(card,id);
  }
}
function init(){
  refresh();
  new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('profile:follow-changed',refresh);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
