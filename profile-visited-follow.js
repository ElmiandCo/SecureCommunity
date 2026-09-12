/* OneMuslim visited-profile Follow compatibility layer. The main follow system owns the button, state, counts, and lists. */
(function(){
'use strict';
let lastId='';
function refresh(){
  const id=new URLSearchParams(location.search).get('profile');
  const card=document.querySelector('#visitedProfilePanel .visited-profile-card');
  if(!id||!card||!window.OneMuslimProfileFollows?.render)return;
  const box=card.querySelector('.om-follow-box');
  if(box&&card.dataset.profileId===id)return;
  lastId=id;
  window.OneMuslimProfileFollows.render(card,id);
}
function init(){
  refresh();
  new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('profile:follow-changed',()=>{lastId='';refresh();});
  window.addEventListener('popstate',()=>{lastId='';refresh();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
